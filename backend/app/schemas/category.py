from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    slug: str | None = None  # Tự động sinh nếu không cung cấp
    description: str | None = None
    image_url: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    image_url: str | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    image_url: str | None
    is_active: bool
    created_at: datetime
    product_count: int = 0  # Computed field — được điền bởi service layer

    model_config = {"from_attributes": True}


class StatusToggle(BaseModel):
    is_active: bool
