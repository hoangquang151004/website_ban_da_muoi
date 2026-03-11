"""CRUD admin: Review moderation."""
import math
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import Review


def _review_to_dict(r: Review) -> dict:
    return {
        "id": r.id,
        "product_id": r.product_id,
        "product_name": r.product.name if r.product else "",
        "user_id": r.user_id,
        "user_full_name": r.user.full_name if r.user else "",
        "rating": r.rating,
        "comment": r.comment,
        "is_approved": r.is_approved,
        "admin_reply": r.admin_reply,
        "replied_at": r.replied_at,
        "created_at": r.created_at,
    }


async def list_reviews_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    is_approved: bool | None = False,
    product_id: int | None = None,
    search: str | None = None,
    rating: int | None = None,
) -> dict:
    query = (
        select(Review)
        .options(selectinload(Review.user), selectinload(Review.product))
        .order_by(Review.created_at.desc())
    )
    if is_approved is not None:
        query = query.where(Review.is_approved == is_approved)
    if product_id is not None:
        query = query.where(Review.product_id == product_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Review.comment.ilike(pattern),
                Review.user.has(Review.user.property.mapper.class_.full_name.ilike(pattern)),
            )
        )
    if rating is not None:
        query = query.where(Review.rating == rating)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    reviews = list(result.scalars().all())

    return {
        "items": [_review_to_dict(r) for r in reviews],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def update_review_approval(db: AsyncSession, review_id: int, is_approved: bool) -> dict:
    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.user), selectinload(Review.product))
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    review.is_approved = is_approved
    await db.flush()
    await db.refresh(review)
    return _review_to_dict(review)


async def reply_to_review(db: AsyncSession, review_id: int, admin_reply: str) -> dict:
    """Admin phản hồi một review."""
    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.user), selectinload(Review.product))
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    review.admin_reply = admin_reply.strip()
    review.replied_at = datetime.utcnow()
    await db.flush()
    await db.refresh(review)
    return _review_to_dict(review)


async def clear_reply(db: AsyncSession, review_id: int) -> dict:
    """Xóa phản hồi của admin (set NULL)."""
    result = await db.execute(
        select(Review)
        .where(Review.id == review_id)
        .options(selectinload(Review.user), selectinload(Review.product))
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    review.admin_reply = None
    review.replied_at = None
    await db.flush()
    await db.refresh(review)
    return _review_to_dict(review)


async def delete_review(db: AsyncSession, review_id: int) -> None:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    await db.delete(review)
    await db.flush()


async def get_review_stats(db: AsyncSession) -> dict:
    """Thống kê tổng số review và breakdown theo trạng thái."""
    total_result = await db.execute(select(func.count(Review.id)))
    total = total_result.scalar_one()

    pending_result = await db.execute(
        select(func.count(Review.id)).where(Review.is_approved == False)  # noqa: E712
    )
    pending = pending_result.scalar_one()

    approved_result = await db.execute(
        select(func.count(Review.id)).where(Review.is_approved == True)  # noqa: E712
    )
    approved = approved_result.scalar_one()

    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.is_approved == True)  # noqa: E712
    )
    avg_rating = avg_result.scalar_one()

    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "avg_rating": round(float(avg_rating), 1) if avg_rating else 0.0,
    }
