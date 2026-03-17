"""Gemini embedding provider.

Phase-2 core provider with basic validation and error normalization.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Sequence

from app.core.config import settings

from .provider import EmbeddingProvider, EmbeddingVector, EmbeddingVectors

DEFAULT_GEMINI_EMBEDDING_MODEL = "models/gemini-embedding-2-preview"
FALLBACK_GEMINI_EMBEDDING_MODEL = "models/gemini-embedding-001"

logger = logging.getLogger(__name__)


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Embedding provider backed by Google Gemini embeddings."""

    def __init__(
        self,
        backend: Any | None = None,
        model_name: str | None = None,
        batch_size: int | None = None,
        max_retries: int = 3,
        retry_base_seconds: float = 0.5,
    ):
        self.model_name = model_name or settings.EMBEDDING_MODEL or DEFAULT_GEMINI_EMBEDDING_MODEL
        self.batch_size = max(1, int(batch_size or settings.EMBEDDING_BATCH_SIZE))
        self.max_retries = max(1, int(max_retries))
        self.retry_base_seconds = max(0.0, float(retry_base_seconds))
        self._managed_backend = backend is None
        self._backend = backend or self._build_default_backend()

    def embed_documents(self, texts: Sequence[str]) -> EmbeddingVectors:
        text_list = list(texts)
        vectors: EmbeddingVectors = []
        for start in range(0, len(text_list), self.batch_size):
            batch_index = (start // self.batch_size) + 1
            batch = text_list[start : start + self.batch_size]
            logger.info(
                "Gemini embedding batch start: model=%s batch_index=%s batch_size=%s",
                self.model_name,
                batch_index,
                len(batch),
            )
            batch_vectors = self._call_with_retry(
                operation="embed_documents",
                call=lambda: self._backend.embed_documents(batch),
                context=f"batch_index={batch_index} batch_size={len(batch)}",
            )
            vectors.extend([list(vector) for vector in batch_vectors])
            logger.info(
                "Gemini embedding batch success: model=%s batch_index=%s vectors=%s",
                self.model_name,
                batch_index,
                len(batch_vectors),
            )
        return vectors

    def embed_query(self, text: str) -> EmbeddingVector:
        vector = self._call_with_retry(
            operation="embed_query",
            call=lambda: self._backend.embed_query(text),
            context=f"query_length={len(text)}",
        )
        return list(vector)

    def _call_with_retry(self, operation: str, call, context: str):
        for attempt in range(1, self.max_retries + 1):
            try:
                return call()
            except Exception as exc:
                if self._should_retry_with_fallback_model(exc):
                    logger.warning(
                        "Gemini %s switching fallback model due to error (%s).",
                        operation,
                        exc,
                    )
                    self._switch_to_fallback_model()
                    continue

                category = self._classify_error(exc)
                retryable = self._is_retryable_temporary_error(exc)
                is_last_attempt = attempt >= self.max_retries

                if retryable and not is_last_attempt:
                    delay = self.retry_base_seconds * (2 ** (attempt - 1))
                    logger.warning(
                        "Gemini %s temporary failure (%s). context=%s attempt=%s/%s retry_in=%.2fs error=%s",
                        operation,
                        category,
                        context,
                        attempt,
                        self.max_retries,
                        delay,
                        exc,
                    )
                    time.sleep(delay)
                    continue

                self._raise_normalized_error(operation, category, exc)

    def _should_retry_with_fallback_model(self, exc: Exception) -> bool:
        if not self._managed_backend:
            return False
        if self.model_name == FALLBACK_GEMINI_EMBEDDING_MODEL:
            return False
        msg = str(exc).lower()
        return "not_found" in msg or "not found" in msg

    def _switch_to_fallback_model(self) -> None:
        self.model_name = FALLBACK_GEMINI_EMBEDDING_MODEL
        self._backend = self._build_default_backend()

    @staticmethod
    def _classify_error(exc: Exception) -> str:
        msg = str(exc).lower()
        if any(token in msg for token in ["invalid key", "api key", "permission denied", "unauthenticated", "401", "403"]):
            return "invalid_key"
        if any(token in msg for token in ["quota", "resource exhausted", "rate limit", "429"]):
            return "quota"
        if any(token in msg for token in ["timeout", "timed out", "deadline exceeded"]):
            return "timeout"
        return "unknown"

    @staticmethod
    def _is_retryable_temporary_error(exc: Exception) -> bool:
        msg = str(exc).lower()
        return any(
            token in msg
            for token in [
                "timeout",
                "timed out",
                "deadline exceeded",
                "temporarily unavailable",
                "unavailable",
                "503",
                "connection reset",
                "rate limit",
                "429",
            ]
        )

    @staticmethod
    def _raise_normalized_error(operation: str, category: str, exc: Exception) -> None:
        if category == "invalid_key":
            raise RuntimeError(
                f"Gemini {operation} failed: invalid key. Please verify GOOGLE_API_KEY."
            ) from exc
        if category == "quota":
            raise RuntimeError(
                f"Gemini {operation} failed: quota exceeded or rate-limited."
            ) from exc
        if category == "timeout":
            raise RuntimeError(
                f"Gemini {operation} failed: timeout after retries."
            ) from exc
        raise RuntimeError(
            f"Gemini {operation} failed: unknown provider error."
        ) from exc

    def _build_default_backend(self) -> Any:
        if not settings.GOOGLE_API_KEY:
            raise ValueError(
                "EMBEDDING_PROVIDER=gemini requires GOOGLE_API_KEY to be set."
            )

        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
        except Exception as exc:
            raise RuntimeError(
                "Missing dependency langchain_google_genai for Gemini embeddings."
            ) from exc

        try:
            return GoogleGenerativeAIEmbeddings(
                model=self.model_name,
                google_api_key=settings.GOOGLE_API_KEY,
            )
        except Exception as exc:
            raise RuntimeError(
                "Failed to initialize GoogleGenerativeAIEmbeddings. "
                "Verify EMBEDDING_MODEL and GOOGLE_API_KEY configuration."
            ) from exc
