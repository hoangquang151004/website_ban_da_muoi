from __future__ import annotations

from app.services.ai_agent.embeddings.baseline import BaselineEmbeddingProvider


class DummyBackend:
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[float(len(text)), 1.0] for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return [float(len(text)), 2.0]


def test_baseline_provider_delegates_embed_documents_in_order():
    provider = BaselineEmbeddingProvider(backend=DummyBackend())

    vectors = provider.embed_documents(["ab", "x"])

    assert vectors == [[2.0, 1.0], [1.0, 1.0]]


def test_baseline_provider_delegates_embed_query():
    provider = BaselineEmbeddingProvider(backend=DummyBackend())

    vector = provider.embed_query("abcd")

    assert vector == [4.0, 2.0]
