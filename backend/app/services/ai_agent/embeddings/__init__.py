"""Embedding provider contracts and implementations."""

from .baseline import BaselineEmbeddingProvider
from .factory import get_embedding_provider
from .gemini import GeminiEmbeddingProvider
from .provider import EmbeddingProvider, EmbeddingVector, EmbeddingVectors

__all__ = [
	"BaselineEmbeddingProvider",
	"GeminiEmbeddingProvider",
	"EmbeddingProvider",
	"EmbeddingVector",
	"EmbeddingVectors",
	"get_embedding_provider",
]
