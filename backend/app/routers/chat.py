"""
chat.py — Router cho tất cả chat endpoints (user-facing).

Endpoints:
- POST /api/v1/chat               — Tổng hợp (auto-routing)
- POST /api/v1/chat/knowledge     — RAG tư vấn kiến thức
- POST /api/v1/chat/recommend     — Gợi ý sản phẩm
- POST /api/v1/chat/order         — Conversational Ordering (auth required)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.dependencies import get_optional_user, get_current_user
from app.schemas.base import BaseResponse

router = APIRouter()


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
    cart_item: Optional[dict] = None


class ChatResponse(BaseModel):
    answer: str
    intent: Optional[str] = None
    products: Optional[list[dict]] = None
    sources: Optional[list[dict]] = None
    cart_updated: Optional[bool] = None
    cart_item: Optional[dict] = None


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

    user_id = current_user.id if current_user else None
    result = await run_chat(
        message=req.message,
        user_id=user_id,
        session_id=req.session_id,
    )
    return BaseResponse.success(data=result)


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
@router.post("/chat/order", response_model=BaseResponse, summary="Đặt hàng qua chat")
async def chat_order(
    req: ChatRequest,
    current_user=Depends(get_current_user),
):
    """Xử lý đặt hàng qua ngôn ngữ tự nhiên. Yêu cầu đăng nhập."""
    from app.services.ai_agent.agent import run_ordering_agent

    result = await run_ordering_agent(req.message, current_user.id)
    return BaseResponse.success(data=OrderChatResponse(**result).model_dump())
