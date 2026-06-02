"""
intent_chain.py — Multi-thinking semantic intent classifier.

Chạy 4 thinker LLM song song (góc nhìn khác nhau), tổng hợp bằng weighted vote.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Literal, Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, field_validator

from app.core.config import settings
from app.services.ai_agent.llm import get_llm

logger = logging.getLogger(__name__)

ThinkerLens = Literal["transaction", "discovery", "knowledge", "social_admin"]

VALID_INTENTS = frozenset({
    "order", "recommend", "knowledge", "order_query", "stats", "greeting",
})

# Tie-break priority (higher index = wins on equal score)
INTENT_TIE_PRIORITY = (
    "greeting",
    "knowledge",
    "recommend",
    "stats",
    "order",
    "order_query",
)

THINKER_ALLOWED: dict[ThinkerLens, frozenset[str]] = {
    "transaction": frozenset({"order", "order_query"}),
    "discovery": frozenset({"recommend", "order"}),
    "knowledge": frozenset({"knowledge", "recommend"}),
    "social_admin": frozenset({"greeting", "stats", "order_query"}),
}

THINKER_SYSTEM_PROMPTS: dict[ThinkerLens, str] = {
    "transaction": """Bạn là chuyên gia phân tích ý định GIAO DỊCH cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `order`, `order_query`.

- `order`: thêm/xóa giỏ, mua ngay, thanh toán, checkout.
- `order_query`: xem đơn của tôi, tra cứu đơn #, trạng thái đơn, xem giỏ hàng hiện tại.

Nếu câu không liên quan giao dịch/đơn hàng, chọn intent gần đúng nhất với độ confidence THẤP (<0.4).
Trả về JSON: intent, confidence (0.0-1.0), reasoning (1-2 câu tiếng Việt).""",
    "discovery": """Bạn là chuyên gia phân tích ý định TÌM SẢN PHẨM cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `recommend`, `order`.

- `recommend`: gợi ý/tư vấn sản phẩm, tìm đèn, lọc giá (dưới Xk, tầm X triệu), ngân sách, màu, kích thước, bán chạy.
- `order`: chỉ khi khách MUỐN MUA hoặc THÊM VÀO GIỎ rõ ràng.

Ví dụ RECOMMEND confidence cao: "tư vấn đèn dưới 500k", "gợi ý đèn phòng ngủ", "đèn ngủ hoặc thư giãn dưới 1 triệu".
Trả về JSON: intent, confidence (0.0-1.0), reasoning (1-2 câu tiếng Việt).""",
    "knowledge": """Bạn là chuyên gia phân tích ý định TƯ VẤN KIẾN THỨC cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `knowledge`, `recommend`.

- `knowledge`: công dụng lý thuyết, phong thủy, bảo quản, so sánh chung — KHÔNG kèm mua/lọc giá cụ thể.
- `recommend`: tư vấn/gợi ý/tìm sản phẩm, có ngân sách (dưới 500k...), muốn mua, hỏi giá để chọn mua.

Ví dụ: "tư vấn sản phẩm dưới 500k" -> `recommend`. "công dụng đèn đá muối là gì" -> `knowledge`.
Trả về JSON: intent, confidence (0.0-1.0), reasoning (1-2 câu tiếng Việt).""",
    "social_admin": """Bạn là chuyên gia phân tích ý định XÃ GIAO & QUẢN TRỊ cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `greeting`, `stats`, `order_query`.

- `greeting`: chào hỏi, cảm ơn, tạm biệt, chitchat ngắn.
- `stats`: báo cáo doanh thu, KPI, top sản phẩm, thống kê hệ thống (chỉ khi user_role=admin).
- `order_query`: admin tra cứu đơn cụ thể (không phải báo cáo tổng hợp).

user_role được cung cấp: nếu không phải admin, KHÔNG chọn `stats` (confidence thấp nếu buộc phải chọn).
Trả về JSON: intent, confidence (0.0-1.0), reasoning (1-2 câu tiếng Việt).""",
}


class ThinkerVote(BaseModel):
    intent: str = Field(description="Detected intent")
    confidence: float = Field(description="Confidence 0.0 to 1.0")
    reasoning: str = Field(description="Short explanation")
    lens: Optional[str] = Field(default=None, description="Thinker lens name")

    @field_validator("confidence")
    @classmethod
    def clamp_confidence(cls, v: float) -> float:
        return max(0.0, min(1.0, float(v)))

    @field_validator("intent")
    @classmethod
    def normalize_intent(cls, v: str) -> str:
        return (v or "").strip().lower()


class IntentResult(BaseModel):
    intent: str = Field(description="The detected intent")
    confidence: float = Field(description="Confidence score from 0.0 to 1.0")
    reasoning: str = Field(description="Short explanation")


class AggregatedIntent(BaseModel):
    intent: str
    confidence: float
    votes: list[ThinkerVote] = Field(default_factory=list)


def _tie_priority(intent: str) -> int:
    try:
        return INTENT_TIE_PRIORITY.index(intent)
    except ValueError:
        return -1


def aggregate_votes(
    votes: list[ThinkerVote],
    *,
    user_role: Optional[str] = None,
    min_confidence: Optional[float] = None,
) -> AggregatedIntent:
    """Weighted vote + tie-break + role guard for stats."""
    threshold = min_confidence if min_confidence is not None else settings.INTENT_MIN_CONFIDENCE
    valid_votes = [v for v in votes if v.intent in VALID_INTENTS]

    if not valid_votes:
        return AggregatedIntent(intent="knowledge", confidence=0.0, votes=votes)

    scores: dict[str, float] = {}
    for vote in valid_votes:
        scores[vote.intent] = scores.get(vote.intent, 0.0) + vote.confidence

    max_score = max(scores.values())
    if max_score < threshold:
        return AggregatedIntent(intent="knowledge", confidence=max_score, votes=votes)

    winners = [intent for intent, score in scores.items() if score == max_score]
    if len(winners) == 1:
        winner = winners[0]
    else:
        winner = max(winners, key=_tie_priority)

    normalized_role = (user_role or "").strip().lower()
    if winner == "stats" and normalized_role != "admin":
        winner = "knowledge"

    return AggregatedIntent(intent=winner, confidence=max_score, votes=votes)


def _build_thinker_prompt(lens: ThinkerLens) -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", THINKER_SYSTEM_PROMPTS[lens]),
        (
            "human",
            "user_role: {user_role}\n{conversation_context}Câu chat: {message}",
        ),
    ])


def _sanitize_vote(raw: dict, lens: ThinkerLens) -> Optional[ThinkerVote]:
    try:
        vote = ThinkerVote(**raw, lens=lens)
    except Exception:
        return None

    allowed = THINKER_ALLOWED[lens]
    if vote.intent not in allowed:
        if vote.intent in VALID_INTENTS:
            vote = vote.model_copy(update={"confidence": vote.confidence * 0.5})
        else:
            return None
    return vote


def _format_conversation_context_block(conversation_context: Optional[str]) -> str:
    if not conversation_context:
        return ""
    return f"{conversation_context.strip()}\n\n"


async def run_thinker(
    lens: ThinkerLens,
    message: str,
    user_role: Optional[str] = None,
    conversation_context: Optional[str] = None,
) -> Optional[ThinkerVote]:
    """Chạy một thinker LLM."""
    llm = get_llm()
    parser = JsonOutputParser(pydantic_object=ThinkerVote)
    prompt = _build_thinker_prompt(lens)
    chain = prompt | llm | parser
    role_str = (user_role or "guest").strip().lower()

    try:
        result = await chain.ainvoke({
            "message": message,
            "user_role": role_str,
            "conversation_context": _format_conversation_context_block(conversation_context),
        })
        if isinstance(result, ThinkerVote):
            raw = result.model_dump()
        else:
            raw = dict(result)
        raw.pop("lens", None)
        return _sanitize_vote(raw, lens)
    except Exception as e:
        logger.warning("Thinker %s failed: %s", lens, e)
        return None


async def classify_intent_multi(
    message: str,
    user_role: Optional[str] = None,
    conversation_context: Optional[str] = None,
) -> AggregatedIntent:
    """4 thinker song song, tổng hợp weighted vote."""
    lenses: list[ThinkerLens] = [
        "transaction", "discovery", "knowledge", "social_admin",
    ]
    results = await asyncio.gather(
        *[
            run_thinker(lens, message, user_role, conversation_context)
            for lens in lenses
        ],
        return_exceptions=True,
    )

    votes: list[ThinkerVote] = []
    for lens, result in zip(lenses, results):
        if isinstance(result, Exception):
            logger.warning("Thinker %s exception: %s", lens, result)
            continue
        if result is not None:
            votes.append(result)

    if len(votes) < 2:
        logger.warning(
            "Insufficient thinker votes (%d), falling back to knowledge",
            len(votes),
        )
        if votes:
            return aggregate_votes(votes, user_role=user_role)
        return AggregatedIntent(intent="knowledge", confidence=0.0, votes=[])

    return aggregate_votes(votes, user_role=user_role)


# ---------------------------------------------------------------------------
# Single-LLM classifier (INTENT_MODE=single_llm)
# ---------------------------------------------------------------------------
INTENT_SYSTEM_PROMPT = """Bạn là chuyên gia phân loại ý định (Intent Classifier) cho chatbot cửa hàng đèn đá muối Himalaya.
Chọn một intent: greeting, knowledge, recommend, order, order_query, stats (admin only).

Trả về JSON: intent, confidence (0.0-1.0), reasoning."""

_intent_prompt = ChatPromptTemplate.from_messages([
    ("system", INTENT_SYSTEM_PROMPT),
    ("human", "user_role: {user_role}\n{conversation_context}Câu chat: {message}"),
])


async def classify_intent(
    message: str,
    user_role: Optional[str] = None,
    conversation_context: Optional[str] = None,
) -> Optional[IntentResult]:
    """Phân loại ý định bằng một lần gọi LLM."""
    llm = get_llm()
    parser = JsonOutputParser(pydantic_object=IntentResult)
    chain = _intent_prompt | llm | parser
    role_str = (user_role or "guest").strip().lower()

    try:
        result = await chain.ainvoke({
            "message": message,
            "user_role": role_str,
            "conversation_context": _format_conversation_context_block(conversation_context),
        })
        if isinstance(result, IntentResult):
            return result
        return IntentResult(**result)
    except Exception as e:
        logger.error("Error classifying intent with LLM: %s", e)
        return None
