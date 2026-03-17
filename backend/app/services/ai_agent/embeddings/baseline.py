"""Baseline embedding provider.

Keeps current behavior for backward compatibility:
- If OPENAI_API_KEY exists, use OpenAI embeddings.
- Otherwise, use local HuggingFace multilingual embeddings.
"""

from __future__ import annotations

from typing import Any, Sequence

from app.core.config import settings

from .provider import EmbeddingProvider, EmbeddingVector, EmbeddingVectors

try:
    # Preferred import (new package).
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:  # pragma: no cover - fallback for older envs
    from langchain_community.embeddings import HuggingFaceEmbeddings


DEFAULT_HF_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


class BaselineEmbeddingProvider(EmbeddingProvider):
    """Embedding provider using OpenAI first, then HuggingFace fallback."""

    def __init__(self, backend: Any | None = None):
        self._backend = backend or self._build_default_backend()

    def embed_documents(self, texts: Sequence[str]) -> EmbeddingVectors:
        vectors = self._backend.embed_documents(list(texts))
        return [list(vector) for vector in vectors]

    def embed_query(self, text: str) -> EmbeddingVector:
        return list(self._backend.embed_query(text))

    @staticmethod
    def _build_default_backend() -> Any:
        if settings.OPENAI_API_KEY:
            from langchain_openai import OpenAIEmbeddings

            return OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)

        return HuggingFaceEmbeddings(model_name=DEFAULT_HF_MODEL)
