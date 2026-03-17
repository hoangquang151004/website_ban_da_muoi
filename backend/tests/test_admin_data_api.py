from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.core.dependencies import get_db, require_admin
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_overrides():
    async def _fake_db():
        yield None

    async def _fake_admin():
        return SimpleNamespace(id=1, role="admin")

    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[require_admin] = _fake_admin
    yield
    app.dependency_overrides.clear()


def test_admin_data_upload_source_success(client: TestClient, admin_overrides, monkeypatch):
    from app.routers import admin_data

    async def _fake_upload(**kwargs):
        return {"source_id": "src_123", "job_id": "job_456", "status": "queued"}

    monkeypatch.setattr(admin_data.svc, "create_data_source_and_queue_job", _fake_upload)
    monkeypatch.setattr(admin_data.svc, "enqueue_index_job", lambda *args, **kwargs: None)

    response = client.post(
        "/api/v1/admin/data-sources/upload",
        files={"file": ("policy.txt", b"policy content", "text/plain")},
        data={"category": "policy", "tags": "shipping,warranty"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["data"]["source_id"] == "src_123"
    assert payload["data"]["job_id"] == "job_456"


def test_admin_data_list_sources_success(client: TestClient, admin_overrides, monkeypatch):
    from app.routers import admin_data

    async def _fake_list(**kwargs):
        return {
            "items": [
                {
                    "id": "src_123",
                    "name": "policy.txt",
                    "type": "txt",
                    "status": "indexed",
                    "created_at": "2026-03-15T00:00:00Z",
                    "chunks": 4,
                    "version": 1,
                    "category": "policy",
                    "tags": ["shipping"],
                }
            ],
            "total": 1,
            "page": 1,
            "limit": 20,
            "total_pages": 1,
        }

    monkeypatch.setattr(admin_data.svc, "list_data_sources", _fake_list)

    response = client.get("/api/v1/admin/data-sources?page=1&limit=20")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["data"]["total"] == 1
    assert payload["data"]["items"][0]["id"] == "src_123"


def test_admin_data_reindex_success(client: TestClient, admin_overrides, monkeypatch):
    from app.routers import admin_data

    async def _fake_reindex(**kwargs):
        return {"job_id": "job_789", "status": "queued"}

    monkeypatch.setattr(admin_data.svc, "queue_reindex_job", _fake_reindex)
    monkeypatch.setattr(admin_data.svc, "enqueue_index_job", lambda *args, **kwargs: None)

    response = client.post("/api/v1/admin/data-sources/src_123/reindex")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["job_id"] == "job_789"
    assert payload["data"]["status"] == "queued"


def test_admin_data_delete_success(client: TestClient, admin_overrides, monkeypatch):
    from app.routers import admin_data

    async def _fake_delete(**kwargs):
        return {"deleted": True}

    monkeypatch.setattr(admin_data.svc, "soft_delete_data_source", _fake_delete)

    response = client.delete("/api/v1/admin/data-sources/src_123")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["deleted"] is True


def test_admin_data_job_status_success(client: TestClient, admin_overrides, monkeypatch):
    from app.routers import admin_data

    async def _fake_job(**kwargs):
        return {"job_id": "job_456", "status": "processing", "progress": 65, "error": None}

    monkeypatch.setattr(admin_data.svc, "get_index_job_status", _fake_job)

    response = client.get("/api/v1/admin/data-sources/jobs/job_456")

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["status"] == "processing"
    assert payload["data"]["progress"] == 65


def test_admin_data_requires_admin_role(client: TestClient):
    async def _fake_db():
        yield None

    async def _forbidden_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[require_admin] = _forbidden_admin

    response = client.get("/api/v1/admin/data-sources")

    app.dependency_overrides.clear()

    assert response.status_code == 403
    payload = response.json()
    assert payload["status"] == "error"
    assert "Admin" in payload["message"]
