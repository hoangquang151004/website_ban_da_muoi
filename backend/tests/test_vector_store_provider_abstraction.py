from __future__ import annotations

from app.services.ai_agent import vector_store


class _FakeVectorStore:
    def __init__(self):
        self.last_query = None
        self.last_kwargs = None

    def similarity_search(self, query: str, **kwargs):
        self.last_query = query
        self.last_kwargs = kwargs
        return ["doc-1"]


class _FakeChroma:
    def __init__(self, **kwargs):
        self.kwargs = kwargs


def test_get_embeddings_uses_provider_factory(monkeypatch):
    sentinel_provider = object()
    monkeypatch.setattr(vector_store, "get_embedding_provider", lambda: sentinel_provider)

    provider = vector_store._get_embeddings()

    assert provider is sentinel_provider


def test_similarity_search_keeps_retrieval_behavior(monkeypatch):
    fake_vs = _FakeVectorStore()
    monkeypatch.setattr(vector_store, "get_vector_store", lambda: fake_vs)

    docs = vector_store.similarity_search("den da muoi", k=7, filter={"category": "policy"})

    assert docs == ["doc-1"]
    assert fake_vs.last_query == "den da muoi"
    assert fake_vs.last_kwargs == {"k": 7, "filter": {"category": "policy"}}


def test_get_vector_store_passes_embedding_from_factory(monkeypatch, tmp_path):
    sentinel_provider = object()

    monkeypatch.setattr(vector_store, "_resolve_persist_dir", lambda: str(tmp_path))
    monkeypatch.setattr(vector_store, "_get_embeddings", lambda: sentinel_provider)
    monkeypatch.setattr(vector_store, "Chroma", _FakeChroma)

    vector_store.get_vector_store.cache_clear()
    vs = vector_store.get_vector_store()

    assert isinstance(vs, _FakeChroma)
    assert vs.kwargs["collection_name"] == "salt_lamp_knowledge"
    assert vs.kwargs["embedding_function"] is sentinel_provider
    assert vs.kwargs["persist_directory"] == str(tmp_path)
