"""Core embedding provider contract.

This interface is intentionally minimal so vector store code can swap providers
without changing business logic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Sequence, TypeAlias

EmbeddingVector: TypeAlias = list[float]
EmbeddingVectors: TypeAlias = list[EmbeddingVector]


class EmbeddingProvider(ABC):
    """Abstract contract for all embedding providers.

    Input normalization:
    - `embed_documents` accepts an ordered sequence of text chunks.
    - Providers must preserve order in returned vectors.

    Output normalization:
    - `embed_documents` returns one vector per input text.
    - `embed_query` returns exactly one vector for the query text.
    - Vector dimensions must be consistent per provider model.
    """

    @abstractmethod
    def embed_documents(self, texts: Sequence[str]) -> EmbeddingVectors:
        """Embed multiple text chunks in input order."""

    @abstractmethod
    def embed_query(self, text: str) -> EmbeddingVector:
        """Embed a single query text."""
