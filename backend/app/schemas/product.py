from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.category import CategoryResponse
from app.schemas.use import UseResponse


class ProductImageResponse(BaseModel):
    id: int
    image_url: str

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    slug: str | None = None  # Tự động sinh nếu không cung cấp
    description: str
    price: Decimal
    original_price: Decimal | None = None
    stock: int = 0
    image_url: str | None = None
    model_3d_url: str | None = None
    is_featured: bool = False
    is_active: bool = True
    category_id: int
    use_ids: list[int] = []
    additional_images: list[str] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    price: Decimal | None = None
    original_price: Decimal | None = None
    stock: int | None = None
    image_url: str | None = None
    model_3d_url: str | None = None
    is_featured: bool | None = None
    is_active: bool | None = None
    category_id: int | None = None
    use_ids: list[int] | None = None
    additional_images: list[str] | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    price: Decimal
    original_price: Decimal | None
    stock: int
    image_url: str | None
    model_3d_url: str | None
    is_featured: bool
    is_active: bool
    category_id: int
    category: CategoryResponse | None = None
    uses: list[UseResponse] = []
    images: list[ProductImageResponse] = []
    reviews: list["ReviewResponse"] = []
    average_rating: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Avoid circular import — ReviewResponse is defined in schemas/review.py
from app.schemas.review import ReviewResponse  # noqa: E402

ProductResponse.model_rebuild()


class ProductListItem(BaseModel):
    """Schema gọn cho danh sách sản phẩm (không cần description đầy đủ)."""
    id: int
    name: str
    slug: str
    price: Decimal
    original_price: Decimal | None
    stock: int
    image_url: str | None
    is_featured: bool
    is_active: bool
    category_id: int
    uses: list[UseResponse] = []
    images: list[ProductImageResponse] = []

    model_config = {"from_attributes": True}


class ProductAdminListPage(BaseModel):
    """Paginated response cho danh sách sản phẩm đầy đủ (dùng trong admin)."""
    items: list[ProductResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ProductListPage(BaseModel):
    """Paginated response cho danh sách sản phẩm."""
    items: list[ProductListItem]
    total: int
    page: int
    limit: int
    total_pages: int
