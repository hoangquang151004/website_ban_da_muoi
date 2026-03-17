from datetime import datetime

from pydantic import BaseModel, Field


class DataSourceUploadResponse(BaseModel):
    source_id: str
    job_id: str
    status: str


class DataSourceItemResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    created_at: datetime
    chunks: int = 0
    version: int = 1
    category: str | None = None
    tags: list[str] = []


class DataSourceListPage(BaseModel):
    items: list[DataSourceItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class DataSourceDeleteResponse(BaseModel):
    deleted: bool


class DataSourceReindexResponse(BaseModel):
    job_id: str
    status: str


class IndexJobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int = Field(ge=0, le=100)
    error: str | None = None
