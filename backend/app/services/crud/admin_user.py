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
    sort_by: str | None = None,
    tier: str | None = None,
) -> dict:
    """Lấy danh sách customer với order_count và total_spent, hỗ trợ filter/sort."""
    
    stats_subquery = (
        select(
            Order.user_id,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
        )
        .where(Order.status == OrderStatus.delivered)
        .group_by(Order.user_id)
        .subquery()
    )

    query = (
        select(
            User,
            func.coalesce(stats_subquery.c.order_count, 0).label("order_count"),
            func.coalesce(stats_subquery.c.total_spent, 0).label("total_spent"),
        )
        .outerjoin(stats_subquery, User.id == stats_subquery.c.user_id)
        .where(User.role == UserRole.customer)
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
        
    if tier:
        if tier == "VIP":
            query = query.where(func.coalesce(stats_subquery.c.total_spent, 0) >= 20000000)
        elif tier == "Thân thiết":
            query = query.where(
                func.coalesce(stats_subquery.c.total_spent, 0) >= 5000000,
                func.coalesce(stats_subquery.c.total_spent, 0) < 20000000
            )
        elif tier == "Mới":
            query = query.where(func.coalesce(stats_subquery.c.total_spent, 0) < 5000000)

    if sort_by == "spent":
        query = query.order_by(func.coalesce(stats_subquery.c.total_spent, 0).desc(), User.created_at.desc())
    elif sort_by == "joined":
        query = query.order_by(User.created_at.desc())
    elif sort_by == "name":
        query = query.order_by(User.full_name.asc())
    else:
        query = query.order_by(User.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    # Get page
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = result.all()

    items = []
    for row in rows:
        u = row.User
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
            "order_count": row.order_count,
            "total_spent": float(row.total_spent),
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
