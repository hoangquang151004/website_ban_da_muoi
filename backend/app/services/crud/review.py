"""CRUD operations cho Review model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import Review
from app.schemas.review import ReviewSubmit


async def create_review(
    db: AsyncSession,
    user_id: int,
    product_id: int,
    data: ReviewSubmit,
) -> Review:
    """Tạo review mới (tự động được duyệt)."""
    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
        is_approved=True,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review, attribute_names=["user"])
    return review


async def update_user_review(
    db: AsyncSession,
    review_id: int,
    user_id: int,
    data: ReviewSubmit,
) -> Review:
    """Cập nhật review. Chỉ chủ sở hữu mới được sửa."""
    from fastapi import HTTPException

    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.user))
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Không có quyền sửa đánh giá này")
    review.rating = data.rating
    review.comment = data.comment
    await db.flush()
    await db.refresh(review)
    return review


async def delete_user_review(
    db: AsyncSession,
    review_id: int,
    user_id: int,
) -> None:
    """Xóa review. Chỉ chủ sở hữu mới được xóa."""
    from fastapi import HTTPException

    result = await db.execute(
        select(Review).where(Review.id == review_id)
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Không có quyền xóa đánh giá này")
    await db.delete(review)
    await db.flush()


async def list_approved_reviews(
    db: AsyncSession, product_id: int
) -> tuple[list[Review], float | None]:
    """Trả về danh sách review đã approved và average_rating, kèm thông tin user."""
    result = await db.execute(
        select(Review)
        .where(
            Review.product_id == product_id,
            Review.is_approved == True,  # noqa: E712
        )
        .options(selectinload(Review.user))
        .order_by(Review.created_at.desc())
    )
    reviews = list(result.scalars().all())
    if reviews:
        avg = round(sum(r.rating for r in reviews) / len(reviews), 2)
    else:
        avg = None
    return reviews, avg
