from __future__ import annotations

from app.services.ai_agent.embeddings.gemini import (
    DEFAULT_GEMINI_EMBEDDING_MODEL,
    GeminiEmbeddingProvider,
)


class DummyBackend:
    def __init__(self):
        self.document_calls = []
        self.query_calls = []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.document_calls.append(texts)
        return [[float(len(text))] for text in texts]

    def embed_query(self, text: str) -> list[float]:
        self.query_calls.append(text)
        return [float(len(text)), 1.0]


class DummyFailBackend:
    def __init__(self):
        self.document_calls = 0
        self.query_calls = 0

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.document_calls += 1
        raise TimeoutError("request timed out")

    def embed_query(self, text: str) -> list[float]:
        self.query_calls += 1
        raise PermissionError("invalid key")


class DummyFlakyBackend:
    def __init__(self, fail_times: int = 1):
        self.fail_times = fail_times
        self.query_calls = 0

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[float(len(text))] for text in texts]

    def embed_query(self, text: str) -> list[float]:
        self.query_calls += 1
        if self.query_calls <= self.fail_times:
            raise TimeoutError("request timed out")
        return [float(len(text))]


class DummyQuotaBackend:
    def __init__(self):
        self.query_calls = 0

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        raise RuntimeError("resource exhausted: quota exceeded")

    def embed_query(self, text: str) -> list[float]:
        self.query_calls += 1
        raise RuntimeError("resource exhausted: quota exceeded")


class DummyFlakyDocumentsBackend:
    def __init__(self, fail_times: int = 1):
        self.fail_times = fail_times
        self.document_calls = 0

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.document_calls += 1
        if self.document_calls <= self.fail_times:
            raise TimeoutError("request timed out")
        return [[float(len(text))] for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return [float(len(text))]


def test_gemini_provider_embed_documents_respects_batch_size():
    backend = DummyBackend()
    provider = GeminiEmbeddingProvider(backend=backend, batch_size=2)

    vectors = provider.embed_documents(["a", "bb", "ccc"])

    assert vectors == [[1.0], [2.0], [3.0]]
    assert backend.document_calls == [["a", "bb"], ["ccc"]]


def test_gemini_provider_embed_query_returns_vector():
    backend = DummyBackend()
    provider = GeminiEmbeddingProvider(backend=backend)

    vector = provider.embed_query("hello")

    assert vector == [5.0, 1.0]
    assert backend.query_calls == ["hello"]


def test_gemini_provider_defaults_model_from_constant(monkeypatch):
    monkeypatch.setattr(
        "app.services.ai_agent.embeddings.gemini.settings.EMBEDDING_MODEL",
        "",
    )
    provider = GeminiEmbeddingProvider(backend=DummyBackend())

    assert provider.model_name == DEFAULT_GEMINI_EMBEDDING_MODEL


def test_gemini_provider_uses_model_from_settings(monkeypatch):
    monkeypatch.setattr(
        "app.services.ai_agent.embeddings.gemini.settings.EMBEDDING_MODEL",
        "models/text-embedding-005",
    )
    provider = GeminiEmbeddingProvider(backend=DummyBackend())

    assert provider.model_name == "models/text-embedding-005"


def test_gemini_provider_normalizes_embed_documents_error():
    provider = GeminiEmbeddingProvider(backend=DummyFailBackend(), retry_base_seconds=0)

    try:
        provider.embed_documents(["abc"])
        assert False, "Expected RuntimeError"
    except RuntimeError as exc:
        assert "embed_documents" in str(exc)


def test_gemini_provider_normalizes_embed_query_error():
    provider = GeminiEmbeddingProvider(backend=DummyFailBackend(), retry_base_seconds=0)

    try:
        provider.embed_query("abc")
        assert False, "Expected RuntimeError"
    except RuntimeError as exc:
        assert "embed_query" in str(exc)


def test_gemini_provider_retry_succeeds_for_temporary_timeout():
    backend = DummyFlakyBackend(fail_times=1)
    provider = GeminiEmbeddingProvider(
        backend=backend,
        max_retries=3,
        retry_base_seconds=0,
    )

    vector = provider.embed_query("abc")

    assert vector == [3.0]
    assert backend.query_calls == 2


def test_gemini_provider_embed_documents_retries_then_succeeds():
    backend = DummyFlakyDocumentsBackend(fail_times=1)
    provider = GeminiEmbeddingProvider(
        backend=backend,
        max_retries=3,
        retry_base_seconds=0,
    )

    vectors = provider.embed_documents(["abc"])

    assert vectors == [[3.0]]
    assert backend.document_calls == 2


def test_gemini_provider_does_not_retry_invalid_key_error():
    backend = DummyFailBackend()
    provider = GeminiEmbeddingProvider(
        backend=backend,
        max_retries=3,
        retry_base_seconds=0,
    )

    try:
        provider.embed_query("abc")
        assert False, "Expected RuntimeError"
    except RuntimeError as exc:
        assert "invalid key" in str(exc).lower()

    assert backend.query_calls == 1


def test_gemini_provider_maps_quota_error_message():
    provider = GeminiEmbeddingProvider(
        backend=DummyQuotaBackend(),
        max_retries=2,
        retry_base_seconds=0,
    )

    try:
        provider.embed_query("abc")
        assert False, "Expected RuntimeError"
    except RuntimeError as exc:
        assert "quota" in str(exc).lower()


def test_gemini_provider_logs_batch_info(caplog):
    backend = DummyBackend()
    provider = GeminiEmbeddingProvider(backend=backend, batch_size=2)

    with caplog.at_level("INFO"):
        provider.embed_documents(["a", "bb", "ccc"])

    logs = "\n".join(caplog.messages)
    assert "batch start" in logs
    assert "batch success" in logs


def test_gemini_provider_requires_google_api_key(monkeypatch):
    monkeypatch.setattr(
        "app.services.ai_agent.embeddings.gemini.settings.GOOGLE_API_KEY",
        "",
    )

    try:
        GeminiEmbeddingProvider()
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert "GOOGLE_API_KEY" in str(exc)
