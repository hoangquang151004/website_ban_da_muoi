from __future__ import annotations

from app.services.ai_agent.embeddings import EmbeddingProvider


class DummyEmbeddingProvider(EmbeddingProvider):
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[float(len(text))] for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return [float(len(text))]


def test_embedding_provider_contract_embed_documents_preserves_order():
    provider = DummyEmbeddingProvider()
    vectors = provider.embed_documents(["abc", "x"])
    assert vectors == [[3.0], [1.0]]


def test_embedding_provider_contract_embed_query_returns_single_vector():
    provider = DummyEmbeddingProvider()
    vector = provider.embed_query("abcd")
    assert vector == [4.0]
