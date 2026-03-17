import hashlib
import math
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from fastapi import BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_source import (
    DataChunk,
    DataSource,
    DataSourceStatus,
    IndexJob,
    IndexJobOperation,
    IndexJobStatus,
)
from app.services.ai_agent.ingestion import run_index_job

DATA_SOURCE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "static",
    "uploads",
    "data_sources",
)


def _parse_tags(raw_tags: str | None) -> str | None:
    if not raw_tags:
        return None
    tags = [x.strip() for x in raw_tags.split(",") if x.strip()]
    return ",".join(tags) if tags else None


def _file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _source_type_from_filename(name: str) -> str:
    suffix = Path(name).suffix.lower().lstrip(".")
    return suffix or "unknown"


async def create_data_source_and_queue_job(
    db: AsyncSession,
    file: UploadFile,
    created_by_user_id: int,
    category: str | None = None,
    tags: str | None = None,
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    os.makedirs(DATA_SOURCE_UPLOAD_DIR, exist_ok=True)

    source_id = f"src_{uuid.uuid4().hex[:12]}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    ext = Path(file.filename).suffix
    saved_file = f"{source_id}{ext}"
    full_path = os.path.join(DATA_SOURCE_UPLOAD_DIR, saved_file)

    with open(full_path, "wb") as f:
        f.write(content)

    source = DataSource(
        id=source_id,
        name=file.filename,
        source_type=_source_type_from_filename(file.filename),
        file_path=full_path,
        file_size=len(content),
        file_hash=_file_hash(content),
        category=category,
        tags=_parse_tags(tags),
        status=DataSourceStatus.queued,
        current_version=1,
        is_deleted=False,
        created_by_user_id=created_by_user_id,
    )
    job = IndexJob(
        id=job_id,
        source_id=source_id,
        operation=IndexJobOperation.index,
        status=IndexJobStatus.queued,
        progress=0,
        created_by_user_id=created_by_user_id,
    )

    db.add(source)
    db.add(job)
    await db.flush()

    return {
        "source_id": source_id,
        "job_id": job_id,
        "status": job.status.value,
    }


def enqueue_index_job(background_tasks: BackgroundTasks, job_id: str) -> None:
    background_tasks.add_task(run_index_job, job_id)


async def list_data_sources(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    status: DataSourceStatus | None = None,
) -> dict:
    query = select(DataSource).where(DataSource.is_deleted == False)  # noqa: E712
    if status is not None:
        query = query.where(DataSource.status == status)
    query = query.order_by(DataSource.created_at.desc())

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    sources = list(result.scalars().all())

    if not sources:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "total_pages": 1,
        }

    source_ids = [s.id for s in sources]
    chunk_counts_result = await db.execute(
        select(DataChunk.source_id, func.count(DataChunk.id))
        .where(DataChunk.source_id.in_(source_ids))
        .group_by(DataChunk.source_id)
    )
    chunk_map = {sid: cnt for sid, cnt in chunk_counts_result.all()}

    items = []
    for s in sources:
        item_tags = [x for x in (s.tags or "").split(",") if x]
        items.append(
            {
                "id": s.id,
                "name": s.name,
                "type": s.source_type,
                "status": s.status.value,
                "created_at": s.created_at,
                "chunks": int(chunk_map.get(s.id, 0)),
                "version": s.current_version,
                "category": s.category,
                "tags": item_tags,
            }
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def queue_reindex_job(db: AsyncSession, source_id: str, user_id: int) -> dict:
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id, DataSource.is_deleted == False)  # noqa: E712
    )
    source = result.scalar_one_or_none()
    if source is None:
        raise HTTPException(status_code=404, detail="Data source not found")

    source.current_version += 1
    source.status = DataSourceStatus.queued

    job_id = f"job_{uuid.uuid4().hex[:12]}"
    job = IndexJob(
        id=job_id,
        source_id=source.id,
        operation=IndexJobOperation.reindex,
        status=IndexJobStatus.queued,
        progress=0,
        created_by_user_id=user_id,
    )
    db.add(job)
    await db.flush()

    return {"job_id": job.id, "status": job.status.value}


async def soft_delete_data_source(db: AsyncSession, source_id: str) -> dict:
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if source is None:
        raise HTTPException(status_code=404, detail="Data source not found")

    source.is_deleted = True
    source.status = DataSourceStatus.deleted
    await db.flush()
    return {"deleted": True}


async def get_index_job_status(db: AsyncSession, job_id: str) -> dict:
    result = await db.execute(select(IndexJob).where(IndexJob.id == job_id))
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Index job not found")

    return {
        "job_id": job.id,
        "status": job.status.value,
        "progress": job.progress,
        "error": job.error,
    }
