"""CRUD admin: Review moderation."""
import math

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import Review


async def list_reviews_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    is_approved: bool | None = False,
    product_id: int | None = None,
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

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    reviews = list(result.scalars().all())

    items = []
    for r in reviews:
        items.append({
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product.name if r.product else "",
            "user_id": r.user_id,
            "user_full_name": r.user.full_name if r.user else "",
            "rating": r.rating,
            "comment": r.comment,
            "is_approved": r.is_approved,
            "created_at": r.created_at,
        })

    return {
        "items": items,
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
    return {
        "id": review.id,
        "product_id": review.product_id,
        "product_name": review.product.name if review.product else "",
        "user_id": review.user_id,
        "user_full_name": review.user.full_name if review.user else "",
        "rating": review.rating,
        "comment": review.comment,
        "is_approved": review.is_approved,
        "created_at": review.created_at,
    }


async def delete_review(db: AsyncSession, review_id: int) -> None:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Đánh giá không tồn tại")
    await db.delete(review)
    await db.flush()
