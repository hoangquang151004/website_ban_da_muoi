"""
rag_chain.py — RAG chain tư vấn kiến thức đèn đá muối Himalaya.

Chain: RunnablePassthrough | retriever | prompt | llm | StrOutputParser
"""

from __future__ import annotations

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

from app.services.ai_agent.llm import get_llm
from app.services.ai_agent.vector_store import get_vector_store

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
RAG_SYSTEM_PROMPT = """Bạn là trợ lý tư vấn sản phẩm đèn đá muối Himalaya chuyên nghiệp.
Chỉ trả lời dựa trên context được cung cấp dưới đây.
Nếu không có thông tin trong context, hãy nói "Tôi chưa có thông tin về điều này."
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện và hữu ích.

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

    def run_with_sources(inputs: dict) -> dict:
        question = inputs["question"]
        docs = retriever.invoke(question)
        if not docs:
            return {
                "answer": "Kho du lieu tu van hien dang chua co noi dung phu hop. Vui long cap nhat vector store hoac thu cau hoi cu the hon.",
                "sources": [],
            }
        context = _format_docs(docs)
        prompt_value = _rag_prompt.invoke({"context": context, "question": question})
        answer = (llm | StrOutputParser()).invoke(prompt_value)
        return {
            "answer": answer,
            "sources": _get_sources(docs),
        }

    return RunnableLambda(run_with_sources)
