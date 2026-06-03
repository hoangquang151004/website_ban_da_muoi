"""
rag_chain.py — RAG chain tư vấn kiến thức đèn đá muối Himalaya.

Chain: RunnablePassthrough | retriever | prompt | llm | StrOutputParser
"""

from __future__ import annotations

import logging
from typing import Any, AsyncIterator

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

from app.services.ai_agent.llm import get_llm
from app.services.ai_agent.vector_store import get_vector_store

logger = logging.getLogger(__name__)

# Khi ChromaDB không có chunk phù hợp — hướng khách về mua hàng / gợi ý SP
RAG_NO_CONTEXT_ANSWER = (
    "Mình chưa tìm thấy tài liệu tư vấn phù hợp cho câu hỏi này trong kho kiến thức. "
    "Bạn có thể thử:\n"
    "• Hỏi gợi ý sản phẩm (ví dụ: \"gợi ý đèn đá muối dưới 500k\")\n"
    "• Xem danh mục sản phẩm trên website để chọn mua\n"
    "• Mô tả nhu cầu (phòng ngủ, quà tặng, ngân sách...) để mình gợi ý đèn phù hợp"
)

# Lỗi kỹ thuật khi truy vấn vector DB hoặc gọi LLM — đã log server-side
RAG_ERROR_ANSWER = (
    "Mình tạm thời không tra cứu được thông tin tư vấn do sự cố kỹ thuật. "
    "Bạn vui lòng thử lại sau, hoặc hỏi mình gợi ý sản phẩm để xem đèn phù hợp nhé!"
)

# Câu hỏi ngoài phạm vi cửa hàng / LLM từ chối kiểu "chưa có thông tin"
RAG_REDIRECT_SHOPPING_ANSWER = (
    "Mình là trợ lý của cửa hàng đèn đá muối Himalaya, nên chỉ hỗ trợ các vấn đề "
    "liên quan mua sắm trên website. Bạn có thể:\n"
    "• Hỏi gợi ý đèn theo nhu cầu hoặc ngân sách (ví dụ: \"gợi ý đèn phòng ngủ dưới 500k\")\n"
    "• Tìm hiểu công dụng, cách dùng, bảo quản đèn đá muối\n"
    "• Nhờ mình hướng dẫn đặt hàng: \"thêm vào giỏ\", \"xem giỏ hàng\", \"thanh toán\"\n"
    "• Xem danh mục sản phẩm trên website để chọn mua"
)

# Cụm từ LLM hay trả khi không muốn trả lời — thay bằng hướng dẫn mua hàng
_NO_INFO_PHRASES = (
    "tôi chưa có thông tin",
    "chưa có thông tin",
    "không có thông tin",
    "không tìm thấy thông tin",
    "tôi không có thông tin",
    "không có trong context",
    "không có trong ngữ cảnh",
    "i don't have information",
    "i do not have information",
)

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
RAG_SYSTEM_PROMPT = """Bạn là trợ lý BÁN HÀNG đèn đá muối Himalaya trên website cửa hàng.
Phạm vi: đèn đá muối, tư vấn sản phẩm, mua hàng, đặt hàng, tra cứu đơn.

Quy tắc (theo thứ tự ưu tiên):
1. Câu hỏi KHÔNG liên quan shop (thời tiết, tin tức, bài văn, lập trình, game, chính trị...):
   → KHÔNG trả lời nội dung đó. Từ chối lịch sự và HƯỚNG khách: gợi ý sản phẩm, hỏi công dụng đèn, hoặc hướng dẫn đặt hàng/xem giỏ.
2. Câu hỏi về đèn/shop nhưng Context dưới đây THIẾU chi tiết:
   → KHÔNG nói "Tôi chưa có thông tin". Gợi khách mô tả nhu cầu mua, hỏi gợi ý theo ngân sách, hoặc xem sản phẩm trên web.
3. Context đủ: trả lời ngắn gọn dựa trên Context.

TUYỆT ĐỐI KHÔNG dùng: "Tôi chưa có thông tin về điều này."
Trả lời tiếng Việt, thân thiện, tối đa 4–6 câu.

Context:
{context}
"""

RAG_HUMAN_PROMPT = "{question}"

_rag_prompt = ChatPromptTemplate.from_messages([
    ("system", RAG_SYSTEM_PROMPT),
    ("human", RAG_HUMAN_PROMPT),
])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _format_docs(docs) -> str:
    """Ghép nội dung các document thành một chuỗi context."""
    return "\n\n---\n\n".join(
        f"[{doc.metadata.get('title', 'Kiến thức')}]\n{doc.page_content}"
        for doc in docs
    )


def _normalize_for_match(text: str) -> str:
    return (text or "").lower().strip()


def _is_no_info_answer(answer: str) -> bool:
    """Phát hiện câu trả lời từ chối kiểu cũ để thay bằng hướng dẫn mua hàng."""
    normalized = _normalize_for_match(answer)
    if not normalized:
        return True
    return any(phrase in normalized for phrase in _NO_INFO_PHRASES)


def polish_rag_answer(answer: str) -> str:
    """Đảm bảo không trả 'chưa có thông tin' — luôn hướng về mua hàng."""
    if _is_no_info_answer(answer):
        return RAG_REDIRECT_SHOPPING_ANSWER
    return (answer or "").strip() or RAG_REDIRECT_SHOPPING_ANSWER


def _get_sources(docs) -> list[dict]:
    """Trích xuất thông tin nguồn từ documents."""
    return [
        {
            "title": doc.metadata.get("title", "Kiến thức đèn đá muối"),
            "snippet": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
        }
        for doc in docs
    ]


# ---------------------------------------------------------------------------
# Chain factories
# ---------------------------------------------------------------------------
def create_rag_chain():
    """Tạo RAG chain trả về string answer.

    Returns:
        Runnable nhận {"question": str} → str (câu trả lời)
    """
    vs = get_vector_store()
    retriever = vs.as_retriever(search_kwargs={"k": 5})
    llm = get_llm()

    chain = (
        {
            "context": retriever | RunnableLambda(_format_docs),
            "question": RunnablePassthrough(),
        }
        | _rag_prompt
        | llm
        | StrOutputParser()
    )
    return chain


def create_rag_chain_with_sources():
    """Tạo RAG chain trả về cả answer lẫn sources.

    Returns:
        Runnable nhận {"question": str} → {"answer": str, "sources": list[dict]}
    """
    vs = get_vector_store()
    retriever = vs.as_retriever(search_kwargs={"k": 5})
    llm = get_llm()

    async def run_with_sources(inputs: dict) -> dict:
        question = (inputs.get("question") or "").strip()
        if not question:
            return {
                "answer": RAG_NO_CONTEXT_ANSWER,
                "sources": [],
                "rag_status": "no_context",
            }

        try:
            docs = await retriever.ainvoke(question)
        except Exception:
            logger.exception("RAG vector retrieval failed for question=%r", question[:200])
            return {
                "answer": RAG_ERROR_ANSWER,
                "sources": [],
                "rag_status": "error",
            }

        if not docs:
            logger.info("RAG no documents for question=%r", question[:200])
            return {
                "answer": RAG_NO_CONTEXT_ANSWER,
                "sources": [],
                "rag_status": "no_context",
            }

        try:
            context = _format_docs(docs)
            prompt_value = _rag_prompt.invoke({"context": context, "question": question})
            raw_answer = await (llm | StrOutputParser()).ainvoke(prompt_value)
            answer = polish_rag_answer(raw_answer)
            if answer == RAG_REDIRECT_SHOPPING_ANSWER and _is_no_info_answer(raw_answer):
                rag_status = "off_topic"
            elif answer == RAG_REDIRECT_SHOPPING_ANSWER:
                rag_status = "redirect"
            else:
                rag_status = "ok"
        except Exception:
            logger.exception("RAG LLM generation failed for question=%r", question[:200])
            return {
                "answer": RAG_ERROR_ANSWER,
                "sources": _get_sources(docs),
                "rag_status": "error",
            }

        return {
            "answer": answer,
            "sources": _get_sources(docs),
            "rag_status": rag_status,
        }

    return RunnableLambda(run_with_sources)


def _rag_status_from_answer(raw_answer: str, answer: str) -> str:
    if answer == RAG_REDIRECT_SHOPPING_ANSWER and _is_no_info_answer(raw_answer):
        return "off_topic"
    if answer == RAG_REDIRECT_SHOPPING_ANSWER:
        return "redirect"
    return "ok"


async def stream_rag_with_sources(question: str) -> AsyncIterator[dict[str, Any]]:
    """Stream SSE frames: status → token chunks → done (answer, sources, rag_status)."""
    from app.services.ai_agent.streaming import (
        done_event,
        status_event,
        stream_llm_text,
        token_event,
        yield_text_as_token_events,
    )

    q = (question or "").strip()
    if not q:
        payload = {
            "answer": RAG_NO_CONTEXT_ANSWER,
            "sources": [],
            "rag_status": "no_context",
        }
        async for frame in yield_text_as_token_events(RAG_NO_CONTEXT_ANSWER):
            yield frame
        yield done_event(payload)
        return

    vs = get_vector_store()
    retriever = vs.as_retriever(search_kwargs={"k": 5})
    llm = get_llm()

    yield status_event("retrieval", "Đang tra cứu tài liệu...")

    try:
        docs = await retriever.ainvoke(q)
    except Exception:
        logger.exception("RAG vector retrieval failed for question=%r", q[:200])
        async for frame in yield_text_as_token_events(RAG_ERROR_ANSWER):
            yield frame
        yield done_event({
            "answer": RAG_ERROR_ANSWER,
            "sources": [],
            "rag_status": "error",
        })
        return

    if not docs:
        logger.info("RAG no documents for question=%r", q[:200])
        async for frame in yield_text_as_token_events(RAG_NO_CONTEXT_ANSWER):
            yield frame
        yield done_event({
            "answer": RAG_NO_CONTEXT_ANSWER,
            "sources": [],
            "rag_status": "no_context",
        })
        return

    sources = _get_sources(docs)
    try:
        context = _format_docs(docs)
        prompt_value = _rag_prompt.invoke({"context": context, "question": q})
        gen_chain = llm | StrOutputParser()
        raw_parts: list[str] = []
        yield status_event("generation", "Đang soạn câu trả lời...")
        async for chunk in stream_llm_text(gen_chain, prompt_value):
            raw_parts.append(chunk)
            yield token_event(chunk)
        raw_answer = "".join(raw_parts)
        answer = polish_rag_answer(raw_answer)
        rag_status = _rag_status_from_answer(raw_answer, answer)
    except Exception:
        logger.exception("RAG LLM generation failed for question=%r", q[:200])
        async for frame in yield_text_as_token_events(RAG_ERROR_ANSWER):
            yield frame
        yield done_event({
            "answer": RAG_ERROR_ANSWER,
            "sources": sources,
            "rag_status": "error",
        })
        return

    yield done_event({
        "answer": answer,
        "sources": sources,
        "rag_status": rag_status,
    })
