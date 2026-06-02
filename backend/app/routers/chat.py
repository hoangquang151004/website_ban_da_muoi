"""
chat.py — Router cho tất cả chat endpoints (user-facing).

Endpoints:
- POST /api/v1/chat               — Tổng hợp (auto-routing)
- POST /api/v1/chat/knowledge     — RAG tư vấn kiến thức
- POST /api/v1/chat/recommend     — Gợi ý sản phẩm
- POST /api/v1/chat/order         — Conversational Ordering (auth required)
"""

from __future__ import annotations

import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.dependencies import get_optional_user, get_current_user
from app.schemas.base import BaseResponse

router = APIRouter()
logger = logging.getLogger(__name__)

CHAT_SYSTEM_ERROR_ANSWER = (
    "Hệ thống tạm thời không xử lý được tin nhắn do lỗi kỹ thuật. "
    "Bạn vui lòng thử lại sau, hoặc hỏi gợi ý sản phẩm / xem danh mục để tiếp tục mua hàng nhé."
)


ResponseType = Literal[
    "text",          # Cau tra loi van ban thuan / RAG knowledge
    "product_cards", # Danh sach san pham goi y
    "checkout_form", # Form checkout nhung trong chat
    "order_list",    # Danh sach don hang cua user
    "order_detail",  # Chi tiet 1 don hang
    "stats",         # Widgets thong ke cho admin
]


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class KnowledgeResponse(BaseModel):
    answer: str
    sources: list[dict] = []


class RecommendResponse(BaseModel):
    answer: str
    products: list[dict] = []


class OrderChatResponse(BaseModel):
    answer: str
    cart_updated: bool = False
    cart_removed: bool = False
    cart_item: Optional[dict] = None


class ChatResponse(BaseModel):
    answer: str
    response_type: ResponseType = "text"
    intent: Optional[str] = None
    data: Optional[dict] = None
    meta: Optional[dict] = None
    products: Optional[list[dict]] = None
    sources: Optional[list[dict]] = None
    cart_updated: Optional[bool] = None
    cart_removed: Optional[bool] = None
    cart_item: Optional[dict] = None
    orders: Optional[list[dict]] = None
    order_detail: Optional[dict] = None
    stats_data: Optional[dict] = None


# ---------------------------------------------------------------------------
# GET /api/v1/chat/llm-info — Model đang dùng (hiển thị log UI)
# ---------------------------------------------------------------------------
@router.get("/chat/llm-info", response_model=BaseResponse, summary="Thông tin LLM chatbot")
async def chat_llm_info():
    from app.services.ai_agent.llm import get_llm_display_info

    return BaseResponse.success(data=get_llm_display_info())


# ---------------------------------------------------------------------------
# POST /api/v1/chat — Endpoint tổng hợp (auto-routing)
# ---------------------------------------------------------------------------
@router.post("/chat", response_model=BaseResponse, summary="Chat tổng hợp (auto-routing)")
async def chat_unified(
    req: ChatRequest,
    current_user=Depends(get_optional_user),
):
    """Endpoint duy nhất cho frontend chatbot — tự routing đến đúng chain/agent."""
    from app.services.ai_agent.agent import run_chat
    from app.services.ai_agent.llm import get_llm_display_info

    user_id = current_user.id if current_user else None
    user_role = current_user.role if current_user else None
    try:
        result = await run_chat(
            message=req.message,
            user_id=user_id,
            user_role=user_role,
            session_id=req.session_id,
        )
        return BaseResponse.success(data=result)
    except Exception:
        logger.exception(
            "POST /chat failed message=%r session_id=%r",
            (req.message or "")[:200],
            req.session_id,
        )
        return BaseResponse.success(
            data={
                "answer": CHAT_SYSTEM_ERROR_ANSWER,
                "response_type": "text",
                "intent": "knowledge",
                "meta": {**get_llm_display_info(), "chat_error": True},
            }
        )


# ---------------------------------------------------------------------------
# POST /api/v1/chat/knowledge — RAG tư vấn kiến thức
# ---------------------------------------------------------------------------
@router.post("/chat/knowledge", response_model=BaseResponse, summary="Tư vấn kiến thức (RAG)")
async def chat_knowledge(req: ChatRequest):
    """Trả lời câu hỏi về kiến thức đèn đá muối Himalaya dựa trên RAG."""
    from app.services.ai_agent.chains.rag_chain import create_rag_chain_with_sources

    chain = create_rag_chain_with_sources()
    result = await chain.ainvoke({"question": req.message})
    return BaseResponse.success(data=KnowledgeResponse(**result).model_dump())


# ---------------------------------------------------------------------------
# POST /api/v1/chat/recommend — Gợi ý sản phẩm
# ---------------------------------------------------------------------------
@router.post("/chat/recommend", response_model=BaseResponse, summary="Gợi ý sản phẩm")
async def chat_recommend(req: ChatRequest):
    """Phân tích yêu cầu và gợi ý sản phẩm phù hợp."""
    from app.services.ai_agent.agent import run_recommendation_agent

    result = await run_recommendation_agent(req.message)
    return BaseResponse.success(data=RecommendResponse(**result).model_dump())


# ---------------------------------------------------------------------------
# POST /api/v1/chat/order — Conversational Ordering (Auth required)
# ---------------------------------------------------------------------------
@router.delete(
    "/chat/session/{session_id}",
    response_model=BaseResponse,
    summary="Xóa bộ nhớ phiên chat",
)
async def clear_chat_session(session_id: str):
    from app.services.ai_agent.chat_memory import clear_session

    clear_session(session_id)
    return BaseResponse.success(data={"cleared": True, "session_id": session_id})


@router.post("/chat/order", response_model=BaseResponse, summary="Đặt hàng qua chat")
async def chat_order(
    req: ChatRequest,
    current_user=Depends(get_current_user),
):
    """Xử lý đặt hàng qua ngôn ngữ tự nhiên. Yêu cầu đăng nhập."""
    from app.services.ai_agent.agent import run_ordering_agent

    result = await run_ordering_agent(req.message, current_user.id)
    return BaseResponse.success(data=OrderChatResponse(**result).model_dump())
