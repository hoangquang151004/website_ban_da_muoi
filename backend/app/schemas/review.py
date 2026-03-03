from datetime import datetime

from pydantic import BaseModel, field_validator


def _validate_rating(v: int) -> int:
    if v < 1 or v > 5:
        raise ValueError("Rating phải nằm trong khoảng 1 đến 5")
    return v


class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        return _validate_rating(v)


class ReviewSubmit(BaseModel):
    """Schema dùng cho endpoint POST /products/{product_id}/reviews (product_id lấy từ path)."""
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        return _validate_rating(v)


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: str | None
    is_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    items: list[ReviewResponse]
    average_rating: float | None = None


class ReviewAdminUpdate(BaseModel):
    is_approved: bool | None = None
    comment: str | None = None


class ReviewAdminResponse(ReviewResponse):
    """Review kèm thông tin user và product name."""
    user_full_name: str = ""
    product_name: str = ""
