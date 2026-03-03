"""CRUD operations cho Review model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus
from app.models.review import Review
from app.schemas.review import ReviewSubmit


async def _has_purchased_and_received(
    db: AsyncSession, user_id: int, product_id: int
) -> bool:
    """Kiểm tra user đã mua và nhận sản phẩm này chưa."""
    result = await db.execute(
        select(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == user_id,
            Order.status == OrderStatus.delivered,
            OrderItem.product_id == product_id,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _get_existing_review(
    db: AsyncSession, user_id: int, product_id: int
) -> Review | None:
    result = await db.execute(
        select(Review).where(
            Review.user_id == user_id,
            Review.product_id == product_id,
        )
    )
    return result.scalar_one_or_none()


async def create_review(
    db: AsyncSession,
    user_id: int,
    product_id: int,
    data: ReviewSubmit,
) -> Review:
    """Tạo review. Raise nếu chưa mua hoặc đã review rồi."""
    from fastapi import HTTPException, status as http_status

    if not await _has_purchased_and_received(db, user_id, product_id):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng",
        )

    existing = await _get_existing_review(db, user_id, product_id)
    if existing:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Bạn đã đánh giá sản phẩm này rồi",
        )

    review = Review(
        product_id=product_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
        is_approved=False,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


async def list_approved_reviews(
    db: AsyncSession, product_id: int
) -> tuple[list[Review], float | None]:
    """Trả về danh sách review đã approved và average_rating."""
    result = await db.execute(
        select(Review).where(
            Review.product_id == product_id,
            Review.is_approved == True,  # noqa: E712
        ).order_by(Review.created_at.desc())
    )
    reviews = list(result.scalars().all())
    if reviews:
        avg = round(sum(r.rating for r in reviews) / len(reviews), 2)
    else:
        avg = None
    return reviews, avg
