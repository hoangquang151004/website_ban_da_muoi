from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.services.ai_agent import ingestion


class FakeResult:
    def __init__(self, *, scalar=None, first=None, all_rows=None):
        self._scalar = scalar
        self._first = first
        self._all_rows = all_rows or []

    def scalar_one_or_none(self):
        return self._scalar

    def first(self):
        return self._first

    def all(self):
        return self._all_rows


class FakeCollection:
    def __init__(self):
        self.embeddings_by_id = {"cached-1": [0.1, 0.2, 0.3]}
        self.present_ids = set()

    def get(self, ids, include):
        if include == ["embeddings"]:
            cid = ids[0]
            if cid in self.embeddings_by_id:
                return {"ids": [cid], "embeddings": [self.embeddings_by_id[cid]]}
            return {"ids": [], "embeddings": []}
        found = [x for x in ids if x in self.present_ids]
        return {"ids": found}

    def upsert(self, ids, embeddings, documents, metadatas):
        self.present_ids.update(ids)
        for idx, emb in zip(ids, embeddings):
            self.embeddings_by_id[idx] = emb


class FakeVectorStore:
    def __init__(self):
        self._collection = FakeCollection()
        self.add_calls = 0

    def add_documents(self, docs, ids):
        self.add_calls += 1
        self._collection.present_ids.update(ids)


class FakeDB:
    def __init__(self):
        self.rows = []

    async def execute(self, stmt):
        q = str(stmt)
        if "WHERE data_chunks.source_id" in q and "chunk_index" in q and "version" in q:
            return FakeResult(scalar=None)
        if "WHERE data_chunks.text_hash" in q:
            return FakeResult(first=("cached-1",))
        if "SELECT data_chunks.chroma_id" in q:
            return FakeResult(all_rows=[("sid:0:1",), ("sid:1:1",)])
        return FakeResult()

    def add(self, row):
        self.rows.append(row)

    async def flush(self):
        return None


def test_chunk_text_large_input_produces_many_chunks():
    text = "abcde " * 5000
    chunks = ingestion.chunk_text(text, chunk_size=800, overlap=100)
    assert len(chunks) > 10


def test_text_hash_is_stable():
    h1 = ingestion.text_hash("same text")
    h2 = ingestion.text_hash("same text")
    assert h1 == h2


def test_chroma_chunk_id_idempotent_key_format():
    assert ingestion.chroma_chunk_id("src_1", 2, 3) == "src_1:2:3"


def test_copy_embedding_from_cached_chunk_success():
    vs = FakeVectorStore()
    ok = ingestion._copy_embedding_from_cached_chunk(
        vs,
        cached_id="cached-1",
        new_id="new-1",
        document="hello",
        metadata={"k": "v"},
    )
    assert ok is True
    assert "new-1" in vs._collection.present_ids


@pytest.mark.asyncio
async def test_validate_source_consistency_detects_missing(monkeypatch):
    db = FakeDB()
    vs = FakeVectorStore()
    vs._collection.present_ids = {"sid:0:1"}
    monkeypatch.setattr(ingestion, "get_vector_store", lambda: vs)

    result = await ingestion.validate_source_consistency(db, "sid", 1)

    assert result["ok"] is False
    assert "sid:1:1" in result["missing"]


@pytest.mark.asyncio
async def test_ingest_source_chunks_uses_cache_and_skips_embedding(monkeypatch):
    db = FakeDB()
    vs = FakeVectorStore()
    monkeypatch.setattr(ingestion, "get_vector_store", lambda: vs)

    source = SimpleNamespace(id="sid", name="src", category="policy")
    stats = await ingestion.ingest_source_chunks(
        db=db,
        source=source,
        version=1,
        chunks=["shipping policy chunk"],
    )

    assert stats["total_chunks"] == 1
    assert stats["cache_hits"] == 1
    assert stats["embedded_chunks"] == 0
    assert vs.add_calls == 0
