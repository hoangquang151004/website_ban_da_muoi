"""
vector_store.py — Kết nối ChromaDB local, tạo collection cho kiến thức sản phẩm.

Collection: salt_lamp_knowledge
Embedding : Provider abstraction (factory chọn theo EMBEDDING_PROVIDER)
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from langchain_core.documents import Document

from app.core.config import settings
from app.services.ai_agent.embeddings import EmbeddingProvider, get_embedding_provider

try:
    # Preferred import (new package).
    from langchain_chroma import Chroma
except ImportError:  # pragma: no cover - fallback for older envs
    from langchain_community.vectorstores import Chroma

def _resolve_persist_dir() -> str:
    """Resolve Chroma persist path independent from current working directory.

    If CHROMA_DB_PATH is relative, anchor it at backend root (folder containing app/).
    """
    configured = Path(settings.CHROMA_DB_PATH)
    if configured.is_absolute():
        return str(configured)

    # vector_store.py -> ai_agent -> services -> app -> backend
    backend_root = Path(__file__).resolve().parents[3]
    return str((backend_root / configured).resolve())

def _get_embeddings() -> EmbeddingProvider:
    """Trả về embedding model theo EMBEDDING_PROVIDER config."""
    return get_embedding_provider()


def _resolve_collection_name() -> str:
    """Use provider-specific collection to prevent embedding dimension conflicts."""
    provider = (settings.EMBEDDING_PROVIDER or "baseline").strip().lower()
    if provider == "baseline":
        # Keep legacy collection name for backward compatibility.
        return "salt_lamp_knowledge"
    return f"salt_lamp_knowledge_{provider}"


@lru_cache(maxsize=1)
def get_vector_store() -> Chroma:
    """Trả về singleton ChromaDB Chroma instance (persistent local)."""
    persist_dir = _resolve_persist_dir()
    os.makedirs(persist_dir, exist_ok=True)
    return Chroma(
        collection_name=_resolve_collection_name(),
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
