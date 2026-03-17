from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models.data_source import DataSourceStatus
from app.schemas.base import BaseResponse
from app.schemas.data_source import (
    DataSourceDeleteResponse,
    DataSourceListPage,
    DataSourceReindexResponse,
    DataSourceUploadResponse,
    IndexJobStatusResponse,
)
from app.services.crud import admin_data as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.post("/data-sources/upload", response_model=BaseResponse[DataSourceUploadResponse])
async def upload_data_source(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    payload = await svc.create_data_source_and_queue_job(
        db=db,
        file=file,
        created_by_user_id=current_user.id,
        category=category,
        tags=tags,
    )
    # Ensure source/job rows are committed before background task queries them.
    await db.commit()
    svc.enqueue_index_job(background_tasks, payload["job_id"])
    return BaseResponse.success(data=DataSourceUploadResponse(**payload))


@router.get("/data-sources", response_model=BaseResponse[DataSourceListPage])
async def list_data_sources(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: DataSourceStatus | None = Query(None),
):
    result = await svc.list_data_sources(db=db, page=page, limit=limit, status=status)
    return BaseResponse.success(data=DataSourceListPage(**result))


@router.post("/data-sources/{source_id}/reindex", response_model=BaseResponse[DataSourceReindexResponse])
async def reindex_data_source(
    source_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin),
):
    payload = await svc.queue_reindex_job(db=db, source_id=source_id, user_id=current_user.id)
    # Ensure reindex job row is committed before background task starts.
    await db.commit()
    svc.enqueue_index_job(background_tasks, payload["job_id"])
    return BaseResponse.success(data=DataSourceReindexResponse(**payload))


@router.delete("/data-sources/{source_id}", response_model=BaseResponse[DataSourceDeleteResponse])
async def delete_data_source(source_id: str, db: AsyncSession = Depends(get_db)):
    payload = await svc.soft_delete_data_source(db=db, source_id=source_id)
    return BaseResponse.success(data=DataSourceDeleteResponse(**payload))


@router.get("/data-sources/jobs/{job_id}", response_model=BaseResponse[IndexJobStatusResponse])
async def get_data_source_job_status(job_id: str, db: AsyncSession = Depends(get_db)):
    payload = await svc.get_index_job_status(db=db, job_id=job_id)
    return BaseResponse.success(data=IndexJobStatusResponse(**payload))
