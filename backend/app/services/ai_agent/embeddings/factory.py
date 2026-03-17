"""Embedding provider factory."""

from __future__ import annotations

import logging

from app.core.config import settings

from .baseline import BaselineEmbeddingProvider
from .gemini import GeminiEmbeddingProvider
from .provider import EmbeddingProvider

logger = logging.getLogger(__name__)

SUPPORTED_EMBEDDING_PROVIDERS = {"baseline", "gemini"}


def get_embedding_provider(provider_name: str | None = None) -> EmbeddingProvider:
    """Create provider by config with safe fallback.

    Fallback behavior:
    - Unknown provider -> baseline + warning
    - Gemini init failure -> baseline + warning
    """
    configured = (provider_name or settings.EMBEDDING_PROVIDER).strip().lower()

    if configured not in SUPPORTED_EMBEDDING_PROVIDERS:
        logger.warning(
            "Unsupported EMBEDDING_PROVIDER=%s. Falling back to baseline. "
            "Supported values: %s",
            configured,
            sorted(SUPPORTED_EMBEDDING_PROVIDERS),
        )
        return BaselineEmbeddingProvider()

    if configured == "gemini":
        try:
            return GeminiEmbeddingProvider(
                model_name=settings.EMBEDDING_MODEL or None,
                batch_size=settings.EMBEDDING_BATCH_SIZE,
            )
        except Exception as exc:
            logger.warning(
                "Failed to initialize gemini embedding provider (%s). "
                "Falling back to baseline.",
                exc,
            )
            return BaselineEmbeddingProvider()

    return BaselineEmbeddingProvider()
