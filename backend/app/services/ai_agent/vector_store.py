"""
vector_store.py — Kết nối ChromaDB local, tạo collection cho kiến thức sản phẩm.

Collection: salt_lamp_knowledge
Embedding : OpenAIEmbeddings (gpt) hoặc HuggingFaceEmbeddings (free, offline)
"""

from __future__ import annotations

import os
from functools import lru_cache

from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from app.core.config import settings

# ---------------------------------------------------------------------------
# Chọn embedding model
# ---------------------------------------------------------------------------
def _get_embeddings():
    """Trả về embedding model.
    - Nếu có OPENAI_API_KEY → dùng OpenAIEmbeddings
    - Ngược lại → dùng HuggingFaceEmbeddings (miễn phí)
    """
    if settings.OPENAI_API_KEY:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
    else:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")


@lru_cache(maxsize=1)
def get_vector_store() -> Chroma:
    """Trả về singleton ChromaDB Chroma instance (persistent local)."""
    persist_dir = os.path.abspath(settings.CHROMA_DB_PATH)
    os.makedirs(persist_dir, exist_ok=True)
    return Chroma(
        collection_name="salt_lamp_knowledge",
        embedding_function=_get_embeddings(),
        persist_directory=persist_dir,
    )


def upsert_documents(docs: list[Document]) -> None:
    """Thêm hoặc cập nhật documents vào ChromaDB.

    Sử dụng document metadata['doc_id'] làm id để tránh duplicate khi chạy lại script.
    """
    vs = get_vector_store()
    ids = [doc.metadata.get("doc_id", None) for doc in docs]
    # Nếu không có doc_id thì để chromadb tự sinh
    if any(i is None for i in ids):
        vs.add_documents(docs)
    else:
        # Delete existing rồi add mới để simulate upsert
        try:
            vs.delete(ids=ids)
        except Exception:
            pass
        vs.add_documents(docs, ids=ids)


def similarity_search(query: str, k: int = 5, filter: dict | None = None) -> list[Document]:
    """Tìm kiếm ngữ nghĩa trong ChromaDB.

    Args:
        query: Câu truy vấn ngôn ngữ tự nhiên
        k: Số lượng kết quả trả về
        filter: Metadata filter dict (Chroma where clause)

    Returns:
        Danh sách Document phù hợp nhất
    """
    vs = get_vector_store()
    kwargs = {"k": k}
    if filter:
        kwargs["filter"] = filter
    return vs.similarity_search(query, **kwargs)
