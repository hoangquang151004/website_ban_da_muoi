import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DataSourceStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    indexed = "indexed"
    failed = "failed"
    deleted = "deleted"


class IndexJobStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    indexed = "indexed"
    failed = "failed"


class IndexJobOperation(str, enum.Enum):
    index = "index"
    reindex = "reindex"
    delete = "delete"


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[DataSourceStatus] = mapped_column(
        SqlEnum(DataSourceStatus), default=DataSourceStatus.queued, nullable=False
    )
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    chunks: Mapped[list["DataChunk"]] = relationship(
        "DataChunk",
        back_populates="source",
        cascade="all, delete-orphan",
    )
    jobs: Mapped[list["IndexJob"]] = relationship(
        "IndexJob",
        back_populates="source",
        cascade="all, delete-orphan",
    )


class DataChunk(Base):
    __tablename__ = "data_chunks"
    __table_args__ = (
        UniqueConstraint("source_id", "chunk_index", "version", name="uq_data_chunk_source_idx_ver"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    chroma_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    source: Mapped[DataSource] = relationship("DataSource", back_populates="chunks")


class IndexJob(Base):
    __tablename__ = "index_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    operation: Mapped[IndexJobOperation] = mapped_column(
        SqlEnum(IndexJobOperation), default=IndexJobOperation.index, nullable=False
    )
    status: Mapped[IndexJobStatus] = mapped_column(
        SqlEnum(IndexJobStatus), default=IndexJobStatus.queued, nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    source: Mapped[DataSource] = relationship("DataSource", back_populates="jobs")
