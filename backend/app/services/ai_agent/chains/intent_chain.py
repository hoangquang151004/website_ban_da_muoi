"""
intent_chain.py — Multi-thinking semantic intent classifier.

Cải tiến cho Gemma 4 12B:
  - Few-shot examples trong mỗi prompt thinker
  - Robust JSON extraction (regex fallback khi parser fail)
  - Confidence calibration (penalize overconfident small-model outputs)
  - Giảm còn 2 thinker chuyên biệt thay vì 4 để tăng độ nhất quán
  - Loại bỏ circular import _is_product_consultation_message
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Literal, Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, field_validator

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Tự động định vị thư mục backend và thêm vào sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Nạp file cấu hình .env từ backend
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from app.core.config import settings
from app.services.ai_agent.llm import get_llm

logger = logging.getLogger(__name__)

ThinkerLens = Literal["transaction", "discovery", "knowledge", "social_admin"]

VALID_INTENTS = frozenset({
    "order", "recommend", "knowledge", "order_query", "stats", "greeting",
})

# Tie-break priority (higher index = wins on equal score)
# recommend hạ xuống giữa để tránh luôn thắng khi hòa điểm
INTENT_TIE_PRIORITY = (
    "greeting",
    "recommend",
    "knowledge",
    "stats",
    "order_query",
    "order",
)

THINKER_ALLOWED: dict[ThinkerLens, frozenset[str]] = {
    "transaction": frozenset({"order", "order_query"}),
    "discovery": frozenset({"recommend", "order"}),
    "knowledge": frozenset({"knowledge"}),
    "social_admin": frozenset({"greeting", "stats", "order_query"}),
}

# ---------------------------------------------------------------------------
# Prompts với few-shot examples — quan trọng cho model nhỏ như Gemma 12B
# ---------------------------------------------------------------------------
THINKER_SYSTEM_PROMPTS: dict[ThinkerLens, str] = {
    "transaction": """Bạn là chuyên gia phân tích ý định GIAO DỊCH cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `order`, `order_query`.

ĐỊNH NGHĨA:
- `order`: thêm/xóa giỏ, mua ngay, thanh toán, checkout.
- `order_query`: xem/tra cứu đơn của tôi, trạng thái đơn, lịch sử đơn.

KHÔNG chọn `order_query` khi khách hỏi tư vấn/gợi ý sản phẩm.
QUAN TRỌNG: Các từ "tư vấn", "gợi ý", "giới thiệu" KHÔNG phải giao dịch — trả về confidence rất thấp (≤ 0.05) cho những câu này.

QUY TẮC NGỮ CẢNH HỘI THOẠI:
1. Bạn sẽ nhận được Lịch sử hội thoại gần đây ([Lịch sử hội thoại gần đây]) và câu chat hiện tại (sau dòng "Câu chat: ").
2. Hãy CHỈ PHÂN LOẠI ý định của câu chat hiện tại. KHÔNG phân loại ý định của các câu chat cũ trong lịch sử.
3. Chỉ sử dụng lịch sử hội thoại gần đây để làm rõ nghĩa các đại từ hoặc từ thay thế (ví dụ: "nó", "cái này", "đó").

VÍ DỤ (few-shot):
Câu: "Thêm đèn A vào giỏ hàng" → {{"intent":"order","confidence":0.95,"reasoning":"Yêu cầu thêm giỏ hàng rõ ràng."}}
Câu: "Cho tôi mua 2 cái đèn ngủ" → {{"intent":"order","confidence":0.92,"reasoning":"Ý định mua hàng trực tiếp."}}
Câu: "Đơn hàng #123 của tôi đến chưa?" → {{"intent":"order_query","confidence":0.93,"reasoning":"Tra cứu trạng thái đơn cụ thể."}}
Câu: "Tôi đặt hàng hôm qua rồi, giờ đâu?" → {{"intent":"order_query","confidence":0.90,"reasoning":"Hỏi về đơn đã đặt."}}
Câu: "Tư vấn đèn phòng ngủ cho tôi" → {{"intent":"order","confidence":0.05,"reasoning":"Đây là yêu cầu tư vấn sản phẩm, không phải giao dịch — confidence rất thấp."}}
Câu: "Gợi ý đèn cho tôi" → {{"intent":"order","confidence":0.05,"reasoning":"Đây là yêu cầu gợi ý, không phải giao dịch — confidence rất thấp."}}

Trả về JSON duy nhất, không giải thích thêm:
{{"intent":"...","confidence":0.0-1.0,"reasoning":"1-2 câu tiếng Việt"}}""",

    "discovery": """Bạn là chuyên gia phân tích ý định TÌM SẢN PHẨM cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `recommend`, `order`.

ĐỊNH NGHĨA:
- `recommend`: gợi ý/tư vấn sản phẩm, tìm đèn, lọc giá, ngân sách, màu, kích thước, bán chạy.
- `order`: chỉ khi khách MUỐN MUA hoặc THÊM VÀO GIỎ rõ ràng.

QUY TẮC BẤT BIẾN (ưu tiên tuyệt đối, ghi đè mọi quy tắc khác):
- Câu chứa từ "tư vấn" → LUÔN chọn `recommend`, confidence ≥ 0.95, không ngoại lệ.
- Câu chứa từ "gợi ý" → LUÔN chọn `recommend`, confidence ≥ 0.95, không ngoại lệ.

QUY TẮC NGỮ CẢNH HỘI THOẠI:
1. Bạn sẽ nhận được Lịch sử hội thoại gần đây ([Lịch sử hội thoại gần đây]) và câu chat hiện tại (sau dòng "Câu chat: ").
2. Hãy CHỈ PHÂN LOẠI ý định của câu chat hiện tại. KHÔNG phân loại ý định của các câu chat cũ trong lịch sử.
3. Chỉ sử dụng lịch sử hội thoại gần đây để làm rõ nghĩa các đại từ hoặc từ thay thế (ví dụ: "nó", "cái này", "đó").

VÍ DỤ (few-shot):
Câu: "Tư vấn đèn dưới 500k" → {{"intent":"recommend","confidence":0.97,"reasoning":"Có từ 'tư vấn' → luôn là recommend, kèm ngân sách."}}
Câu: "Tư vấn đèn phòng ngủ cho tôi" → {{"intent":"recommend","confidence":0.95,"reasoning":"Có từ 'tư vấn' → luôn là recommend."}}
Câu: "Tư vấn giúp mình" → {{"intent":"recommend","confidence":0.95,"reasoning":"Có từ 'tư vấn' → luôn là recommend."}}
Câu: "Gợi ý đèn phòng ngủ màu hồng" → {{"intent":"recommend","confidence":0.95,"reasoning":"Có từ 'gợi ý' → luôn là recommend."}}
Câu: "Gợi ý cho tôi xem" → {{"intent":"recommend","confidence":0.95,"reasoning":"Có từ 'gợi ý' → luôn là recommend."}}
Câu: "Đèn nào bán chạy nhất?" → {{"intent":"recommend","confidence":0.90,"reasoning":"Tìm sản phẩm phổ biến."}}
Câu: "Cho tôi mua cái đèn cam to nhất" → {{"intent":"order","confidence":0.88,"reasoning":"Ý định mua hàng cụ thể."}}
Câu: "Xem đơn hàng của tôi" → {{"intent":"recommend","confidence":0.15,"reasoning":"Không liên quan tìm sản phẩm, confidence thấp."}}

Trả về JSON duy nhất, không giải thích thêm:
{{"intent":"...","confidence":0.0-1.0,"reasoning":"1-2 câu tiếng Việt"}}""",

    "knowledge": """Bạn là chuyên gia phân tích ý định TƯ VẤN KIẾN THỨC cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent: `knowledge`.

ĐỊNH NGHĨA:
- `knowledge`: công dụng lý thuyết, phong thủy, bảo quản, so sánh chung, cách sử dụng — bất kỳ câu hỏi kiến thức nào về đèn đá muối.

QUY TẮC:
- Nếu câu hỏi là kiến thức/lý thuyết → confidence CAO (≥ 0.85).
- Nếu câu hỏi KHÔNG phải kiến thức (mua hàng, gợi ý, chào hỏi, tra đơn...) → confidence RẤT THẤP (≤ 0.15).

QUY TẮC NGỮ CẢNH HỘI THOẠI:
1. Bạn sẽ nhận được Lịch sử hội thoại gần đây ([Lịch sử hội thoại gần đây]) và câu chat hiện tại (sau dòng "Câu chat: ").
2. Hãy CHỈ PHÂN LOẠI ý định của câu chat hiện tại. KHÔNG phân loại ý định của các câu chat cũ trong lịch sử.
3. Chỉ sử dụng lịch sử hội thoại gần đây để làm rõ nghĩa các đại từ hoặc từ thay thế (ví dụ: "nó", "cái này", "đó").

VÍ DỤ (few-shot):
Câu: "Đèn đá muối có tác dụng gì?" → {{"intent":"knowledge","confidence":0.95,"reasoning":"Hỏi công dụng lý thuyết."}}
Câu: "Bảo quản đèn đá muối như thế nào?" → {{"intent":"knowledge","confidence":0.93,"reasoning":"Hỏi kiến thức bảo quản."}}
Câu: "Đèn to hay đèn nhỏ tốt hơn?" → {{"intent":"knowledge","confidence":0.88,"reasoning":"So sánh chung, không có ý mua."}}
Câu: "Phong thủy đặt đèn đá muối ở đâu?" → {{"intent":"knowledge","confidence":0.92,"reasoning":"Hỏi kiến thức phong thủy."}}
Câu: "Tư vấn đèn ngủ cho tôi" → {{"intent":"knowledge","confidence":0.10,"reasoning":"Đây là tìm sản phẩm, không phải kiến thức."}}
Câu: "Gợi ý đèn phòng khách" → {{"intent":"knowledge","confidence":0.10,"reasoning":"Đây là gợi ý sản phẩm, không phải kiến thức."}}
Câu: "Cho mình mua đèn" → {{"intent":"knowledge","confidence":0.05,"reasoning":"Đây là mua hàng, không phải kiến thức."}}

Trả về JSON duy nhất, không giải thích thêm:
{{"intent":"...","confidence":0.0-1.0,"reasoning":"1-2 câu tiếng Việt"}}""",

    "social_admin": """Bạn là chuyên gia phân tích ý định XÃ GIAO & QUẢN TRỊ cho chatbot cửa hàng đèn đá muối Himalaya.
Chỉ chọn MỘT intent trong: `greeting`, `stats`, `order_query`.

ĐỊNH NGHĨA:
- `greeting`: chào hỏi, cảm ơn, tạm biệt, chitchat ngắn.
- `stats`: báo cáo doanh thu, KPI, top sản phẩm, thống kê hệ thống — CHỈ khi user_role=admin.
- `order_query`: admin tra cứu đơn cụ thể (không phải báo cáo tổng hợp).

KHÔNG chọn `order_query` khi câu hỏi là tư vấn sản phẩm.

QUY TẮC NGỮ CẢNH HỘI THOẠI:
1. Bạn sẽ nhận được Lịch sử hội thoại gần đây ([Lịch sử hội thoại gần đây]) và câu chat hiện tại (sau dòng "Câu chat: ").
2. Hãy CHỈ PHÂN LOẠI ý định của câu chat hiện tại. KHÔNG phân loại ý định của các câu chat cũ trong lịch sử.
3. Chỉ sử dụng lịch sử hội thoại gần đây để làm rõ nghĩa các đại từ hoặc từ thay thế (ví dụ: "nó", "cái này", "đó").
4. Nếu user_role != admin thì KHÔNG chọn `stats`.

user_role hiện tại: {user_role}

VÍ DỤ (few-shot):
Câu: "Xin chào!" → {{"intent":"greeting","confidence":0.98,"reasoning":"Câu chào đơn giản."}}
Câu: "Cảm ơn bạn nhé" → {{"intent":"greeting","confidence":0.97,"reasoning":"Lời cảm ơn."}}
Câu: "Doanh thu hôm nay bao nhiêu?" (admin) → {{"intent":"stats","confidence":0.92,"reasoning":"Admin hỏi thống kê doanh thu."}}
Câu: "Top 5 sản phẩm bán chạy tuần này?" (admin) → {{"intent":"stats","confidence":0.90,"reasoning":"Admin hỏi báo cáo KPI."}}
Câu: "Tra đơn hàng mã ABC của khách X" (admin) → {{"intent":"order_query","confidence":0.88,"reasoning":"Admin tra cứu đơn cụ thể."}}
Câu: "Tư vấn đèn ngủ" → {{"intent":"greeting","confidence":0.10,"reasoning":"Không liên quan xã giao/admin, confidence thấp."}}

Trả về JSON duy nhất, không giải thích thêm:
{{"intent":"...","confidence":0.0-1.0,"reasoning":"1-2 câu tiếng Việt"}}""",
}


# ---------------------------------------------------------------------------
# Load Examples from JSON
# ---------------------------------------------------------------------------
def load_intent_examples() -> str:
    try:
        examples_path = backend_dir / "app" / "services" / "ai_agent" / "intent_examples.json"
        with open(examples_path, "r", encoding="utf-8") as f:
            examples = json.load(f)
        
        lines = []
        for ex in examples:
            lines.append(f'"{ex["message"]}" → {{"intent":"{ex["intent"]}","confidence":0.95,"reasoning":"{ex["reasoning"]}"}}')
        return "\n".join(lines)
    except Exception as e:
        logger.warning(f"Could not load intent_examples.json: {e}")
        return ""

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Robust JSON extraction — Gemma hay wrap JSON trong markdown hoặc thêm text
# ---------------------------------------------------------------------------
_JSON_PATTERN = re.compile(r"\{[^{}]*\}", re.DOTALL)


def _extract_json_safe(raw_text: str) -> Optional[dict]:
    """
    Cố gắng parse JSON từ output thô của LLM.
    Thử theo thứ tự: direct parse → strip markdown → regex extract.
    """
    # 1. Parse trực tiếp
    try:
        return json.loads(raw_text.strip())
    except json.JSONDecodeError:
        pass

    # 2. Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?", "", raw_text).strip().strip("`")
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Regex tìm JSON object đầu tiên
    match = _JSON_PATTERN.search(raw_text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    logger.warning("Could not extract JSON from LLM output: %r", raw_text[:200])
    return None


# ---------------------------------------------------------------------------
# Confidence calibration — penalize khi model nhỏ overconfident
# ---------------------------------------------------------------------------
def _calibrate_confidence(confidence: float, is_in_allowed_set: bool) -> float:
    """
    Gemma 12B có xu hướng trả confidence cao bất kể chất lượng.
    Áp dụng nhẹ isotonic-style shrinkage để phân biệt rõ hơn.
    """
    if not is_in_allowed_set:
        return confidence * 0.4  # penalize mạnh nếu out-of-domain

    # Shrink về mean nhẹ (beta calibration đơn giản)
    # confidence >= 0.9 → giữ nguyên; < 0.5 → giảm thêm
    if confidence >= 0.9:
        return confidence
    if confidence >= 0.7:
        return confidence * 0.95
    return confidence * 0.85


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------
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
    message: Optional[str] = None,
) -> AggregatedIntent:
    """Weighted vote + tie-break + role guard."""
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
    winner = winners[0] if len(winners) == 1 else max(winners, key=_tie_priority)

    # Role guard
    normalized_role = (user_role or "").strip().lower()
    if winner == "stats" and normalized_role != "admin":
        winner = "knowledge"

    return AggregatedIntent(intent=winner, confidence=max_score, votes=votes)


# ---------------------------------------------------------------------------
# Thinker runner
# ---------------------------------------------------------------------------
def _build_thinker_prompt(lens: ThinkerLens) -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        ("system", THINKER_SYSTEM_PROMPTS[lens]),
        ("human", "user_role: {user_role}\n{conversation_context}Câu chat: {message}"),
    ])


def _sanitize_vote(raw: dict, lens: ThinkerLens) -> Optional[ThinkerVote]:
    try:
        vote = ThinkerVote(**raw, lens=lens)
    except Exception:
        return None

    allowed = THINKER_ALLOWED[lens]
    in_allowed = vote.intent in allowed
    calibrated_conf = _calibrate_confidence(vote.confidence, in_allowed)

    if vote.intent not in VALID_INTENTS:
        return None

    return vote.model_copy(update={"confidence": calibrated_conf})


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
    """Chạy một thinker LLM với robust JSON extraction."""
    llm = get_llm()
    prompt = _build_thinker_prompt(lens)
    # Dùng raw string output thay vì JsonOutputParser để tự handle extraction
    chain = prompt | llm
    role_str = (user_role or "guest").strip().lower()

    try:
        result = await chain.ainvoke({
            "message": message,
            "user_role": role_str,
            "conversation_context": _format_conversation_context_block(conversation_context),
        })

        # Lấy text từ AIMessage hoặc string
        raw_text = result.content if hasattr(result, "content") else str(result)
        raw_dict = _extract_json_safe(raw_text)
        if raw_dict is None:
            logger.warning("Thinker %s: failed to extract JSON", lens)
            return None

        raw_dict.pop("lens", None)
        return _sanitize_vote(raw_dict, lens)

    except Exception as e:
        logger.warning("Thinker %s failed: %s", lens, e)
        return None


# ---------------------------------------------------------------------------
# Selective thinker: chỉ chạy thinker liên quan thay vì luôn chạy cả 4
# Tiết kiệm 2x latency trong đa số trường hợp
# ---------------------------------------------------------------------------
async def _select_lenses(message: str) -> list[ThinkerLens]:
    """
    Chọn thinker phù hợp dựa trên keyword nhanh.
    Tích lũy lenses để không bỏ sót intent khi câu chat có nhiều vế.
    Fallback: chạy cả 4 nếu không rõ.
    """
    from app.services.ai_agent.tools.product_db_search import get_dynamic_use_keywords
    
    msg_lower = message.lower()
    lenses: set[ThinkerLens] = set()

    # Shortcut bất biến: "tư vấn" và "gợi ý" → CHỈ chạy discovery
    # Tránh để knowledge lens vote cạnh tranh với recommend
    _TU_VAN_KEYWORDS = ["tư vấn", "gợi ý"]
    if any(kw in msg_lower for kw in _TU_VAN_KEYWORDS):
        # Không kèm knowledge lens — discovery đã cover recommend
        return ["discovery"]

    # Tín hiệu giao dịch rõ ràng
    if any(kw in msg_lower for kw in ["mua", "giỏ hàng", "thanh toán", "checkout", "đặt hàng", "đơn hàng", "trạng thái đơn", "order"]):
        lenses.update(["transaction", "discovery"])

    # Tín hiệu tìm sản phẩm (không có "tư vấn"/"gợi ý" — đã handled above)
    if any(kw in msg_lower for kw in ["giới thiệu", "ngân sách", "dưới", "tầm giá", "bán chạy", "tìm"]):
        lenses.update(["discovery", "knowledge"])

    # Tín hiệu gợi ý theo công dụng: nếu có use keyword + sản phẩm/tìm → discovery
    dynamic_use_keywords = await get_dynamic_use_keywords()
    _USE_PRODUCT_HINTS = ["đèn", "den", "sản phẩm", "san pham", "đá muối", "da muoi"]
    _USE_RECOMMEND_VERBS = ["tìm", "tim", "cho xem", "xem", "có không", "đèn nào", "den nao"]
    has_use = any(kw in msg_lower for kw in dynamic_use_keywords)
    if has_use:
        has_product_or_verb = (
            any(kw in msg_lower for kw in _USE_PRODUCT_HINTS)
            or any(kw in msg_lower for kw in _USE_RECOMMEND_VERBS)
        )
        if has_product_or_verb:
            lenses.add("discovery")
        else:
            # Chỉ có công dụng đơn lẻ, có thể là kiến thức
            lenses.add("knowledge")

    # Tín hiệu kiến thức — KHÔNG thêm discovery để tránh recommend cạnh tranh
    if any(kw in msg_lower for kw in ["công dụng", "tác dụng", "bảo quản", "cách dùng"]):
        lenses.add("knowledge")

    # Tín hiệu xã giao / admin — KHÔNG thêm knowledge để tránh nhiễu
    if any(kw in msg_lower for kw in ["chào", "cảm ơn", "doanh thu", "báo cáo", "thống kê", "hello", "hi"]):
        lenses.add("social_admin")

    # Không rõ → chạy cả 4
    if not lenses:
        return ["transaction", "discovery", "knowledge", "social_admin"]
    
    return list(lenses)


async def classify_intent_multi(
    message: str,
    user_role: Optional[str] = None,
    conversation_context: Optional[str] = None,
) -> AggregatedIntent:
    """
    Selective thinker song song, tổng hợp weighted vote.
    Chạy 2-4 thinker tùy độ rõ của câu hỏi.
    """
    # Deterministic shortcut: "tư vấn" và "gợi ý" luôn → recommend, bỏ qua LLM
    _msg_lower = message.lower()
    if any(kw in _msg_lower for kw in ["tư vấn", "gợi ý"]):
        logger.debug("classify_intent_multi: keyword shortcut → recommend for %r", message[:60])
        return AggregatedIntent(
            intent="recommend",
            confidence=0.97,
            votes=[ThinkerVote(intent="recommend", confidence=0.97, reasoning="Keyword shortcut: 'tư vấn' hoặc 'gợi ý' detected.", lens="discovery")],
        )

    lenses = await _select_lenses(message)
    results = await asyncio.gather(
        *[run_thinker(lens, message, user_role, conversation_context) for lens in lenses],
        return_exceptions=True,
    )

    votes: list[ThinkerVote] = []
    for lens, result in zip(lenses, results):
        if isinstance(result, Exception):
            logger.warning("Thinker %s exception: %s", lens, result)
            continue
        if result is not None:
            votes.append(result)

    if len(votes) < 1:
        logger.warning("No valid thinker votes, falling back to knowledge")
        return AggregatedIntent(intent="knowledge", confidence=0.0, votes=[])

    return aggregate_votes(votes, user_role=user_role, message=message)


# ---------------------------------------------------------------------------
# Single-LLM classifier (INTENT_MODE=single_llm)
# ---------------------------------------------------------------------------
INTENT_SYSTEM_PROMPT = """Phân loại intent người dùng cho chatbot cửa hàng đèn đá muối Himalaya.
Chọn ĐÚNG 1 intent trong danh sách:
- greeting: chào hỏi, cảm ơn, tạm biệt, chitchat
- recommend: tìm / gợi ý / tư vấn sản phẩm, lọc giá, ngân sách
- knowledge: công dụng, bảo quản, phong thủy, kiến thức đèn đá muối
- order: thêm/xóa giỏ, mua ngay, checkout, thanh toán
- order_query: xem đơn hàng, tra cứu trạng thái đơn
- stats: thống kê doanh thu, báo cáo KPI (chỉ admin)

QUY TẮC BẤT BIẾN (ưu tiên tuyệt đối, ghi đè mọi quy tắc khác):
- Câu chứa từ "tư vấn" → LUÔN chọn `recommend`, không ngoại lệ.
- Câu chứa từ "gợi ý" → LUÔN chọn `recommend`, không ngoại lệ.

QUY TẮC NGỮ CẢNH HỘI THOẠI:
1. Bạn sẽ nhận được Lịch sử hội thoại gần đây ([Lịch sử hội thoại gần đây]) và câu chat hiện tại (sau dòng "Câu chat: ").
2. Hãy CHỈ PHÂN LOẠI ý định của câu chat hiện tại. KHÔNG phân loại ý định của các câu chat cũ trong lịch sử.
3. Chỉ sử dụng lịch sử hội thoại gần đây để làm rõ nghĩa các đại từ hoặc từ thay thế (ví dụ: "nó", "cái này", "đó").

VÍ DỤ TỪ FILE JSON:
{dynamic_examples}

Trả về JSON duy nhất, không thêm text:
{{"intent":"...","confidence":0.0-1.0,"reasoning":"..."}}"""


async def classify_intent(
    message: str,
    user_role: Optional[str] = None,
    conversation_context: Optional[str] = None,
) -> Optional[IntentResult]:
    """Phân loại ý định bằng một lần gọi LLM với robust JSON extraction."""

    # Deterministic shortcut: "tư vấn" và "gợi ý" luôn → recommend, bỏ qua LLM
    _msg_lower = message.lower()
    if any(kw in _msg_lower for kw in ["tư vấn", "gợi ý"]):
        logger.debug("classify_intent: keyword shortcut → recommend for %r", message[:60])
        return IntentResult(
            intent="recommend",
            confidence=0.97,
            reasoning="Keyword shortcut: 'tư vấn' hoặc 'gợi ý' detected.",
        )

    llm = get_llm()
    
    # Load examples dynamically
    dynamic_examples = load_intent_examples()
    if not dynamic_examples:
        dynamic_examples = '"Xin chào" → {"intent":"greeting","confidence":0.98,"reasoning":"Câu chào."}'
        
    _intent_prompt = ChatPromptTemplate.from_messages([
        ("system", INTENT_SYSTEM_PROMPT),
        ("human", "user_role: {user_role}\n{conversation_context}Câu chat: {message}"),
    ])
    
    chain = _intent_prompt | llm
    role_str = (user_role or "guest").strip().lower()

    try:
        result = await chain.ainvoke({
            "dynamic_examples": dynamic_examples,
            "message": message,
            "user_role": role_str,
            "conversation_context": _format_conversation_context_block(conversation_context),
        })
        raw_text = result.content if hasattr(result, "content") else str(result)
        raw_dict = _extract_json_safe(raw_text)
        if raw_dict is None:
            logger.error("classify_intent: could not parse JSON from LLM")
            return None

        intent_val = str(raw_dict.get("intent", "")).strip().lower()
        if intent_val not in VALID_INTENTS:
            logger.warning("classify_intent: unknown intent %r, defaulting to knowledge", intent_val)
            intent_val = "knowledge"

        return IntentResult(
            intent=intent_val,
            confidence=max(0.0, min(1.0, float(raw_dict.get("confidence", 0.5)))),
            reasoning=str(raw_dict.get("reasoning", "")),
        )
    except Exception as e:
        logger.error("Error classifying intent with LLM: %s", e)
        return None