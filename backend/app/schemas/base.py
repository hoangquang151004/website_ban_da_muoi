from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedData(BaseModel, Generic[T]):
    """Schema tái sử dụng cho mọi response phân trang."""

    items: list[T]
    total: int
    page: int
    limit: int
    total_pages: int


class BaseResponse(BaseModel, Generic[T]):
    """Format response chuẩn cho toàn bộ API.

    Ví dụ thành công:
        {"status": "success", "data": {...}, "message": "OK"}

    Ví dụ lỗi:
        {"status": "error", "data": null, "message": "Not found"}
    """

    status: str = "success"
    data: T | None = None
    message: str = "OK"

    @classmethod
    def success(cls, data: Any = None, message: str = "OK") -> "BaseResponse":
        return cls(status="success", data=data, message=message)

    @classmethod
    def error(cls, message: str = "An error occurred", data: Any = None) -> "BaseResponse":
        return cls(status="error", data=data, message=message)
