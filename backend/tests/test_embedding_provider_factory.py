from __future__ import annotations

from app.services.ai_agent.embeddings import factory


def test_factory_returns_baseline_by_default(monkeypatch):
    monkeypatch.setattr(factory.settings, "EMBEDDING_PROVIDER", "baseline")

    provider = factory.get_embedding_provider()

    assert provider.__class__.__name__ == "BaselineEmbeddingProvider"


def test_factory_falls_back_on_invalid_provider(monkeypatch):
    monkeypatch.setattr(factory.settings, "EMBEDDING_PROVIDER", "invalid-provider")

    provider = factory.get_embedding_provider()

    assert provider.__class__.__name__ == "BaselineEmbeddingProvider"


def test_factory_returns_gemini_when_configured(monkeypatch):
    class DummyGemini:
        pass

    monkeypatch.setattr(factory.settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(factory, "GeminiEmbeddingProvider", lambda **_: DummyGemini())

    provider = factory.get_embedding_provider()

    assert isinstance(provider, DummyGemini)


def test_factory_falls_back_when_gemini_init_fails(monkeypatch):
    def _raise(**_):
        raise ValueError("bad config")

    monkeypatch.setattr(factory.settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(factory, "GeminiEmbeddingProvider", _raise)

    provider = factory.get_embedding_provider()

    assert provider.__class__.__name__ == "BaselineEmbeddingProvider"
