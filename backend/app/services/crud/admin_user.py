"""CRUD admin: Customer management."""
import math

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole


async def list_users_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
) -> dict:
    """Chỉ lấy user có role=customer."""
    query = (
        select(User)
        .where(User.role == UserRole.customer)
        .order_by(User.created_at.desc())
    )
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
                User.phone.ilike(pattern),
            )
        )
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    users = list(result.scalars().all())

    # Thống kê order_count + total_spent
    user_ids = [u.id for u in users]
    stats: dict[int, dict] = {uid: {"order_count": 0, "total_spent": 0.0} for uid in user_ids}
    if user_ids:
        stat_result = await db.execute(
            select(
                Order.user_id,
                func.count(Order.id).label("cnt"),
                func.coalesce(func.sum(Order.total_amount), 0).label("spent"),
            )
            .where(Order.user_id.in_(user_ids), Order.status == OrderStatus.delivered)
            .group_by(Order.user_id)
        )
        for row in stat_result.all():
            stats[row.user_id] = {"order_count": row.cnt, "total_spent": float(row.spent)}

    items = []
    for u in users:
        items.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "address": u.address,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "updated_at": u.updated_at,
            "order_count": stats[u.id]["order_count"],
            "total_spent": stats[u.id]["total_spent"],
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def toggle_user_status(
    db: AsyncSession, user_id: int, is_active: bool, current_admin_id: int
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    if user.id == current_admin_id:
        raise HTTPException(status_code=400, detail="Admin không thể tự khóa chính mình")
    user.is_active = is_active
    await db.flush()
    await db.refresh(user)
    return user
