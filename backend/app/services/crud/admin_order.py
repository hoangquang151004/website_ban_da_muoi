"""CRUD admin: Order management + status transitions."""
import math
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.stock_log import StockLog, StockLogReason

# Valid forward-only state machine
_STATUS_ORDER = [
    OrderStatus.pending,
    OrderStatus.confirmed,
    OrderStatus.packing,
    OrderStatus.shipping,
    OrderStatus.delivered,
    OrderStatus.cancelled,
]

# cancelled can only be reached before delivered
_ALLOWED_TRANSITIONS: dict[OrderStatus, list[OrderStatus]] = {
    OrderStatus.pending:   [OrderStatus.confirmed, OrderStatus.cancelled],
    OrderStatus.confirmed: [OrderStatus.packing, OrderStatus.cancelled],
    OrderStatus.packing:   [OrderStatus.shipping, OrderStatus.cancelled],
    OrderStatus.shipping:  [OrderStatus.delivered, OrderStatus.cancelled],
    OrderStatus.delivered: [],
    OrderStatus.cancelled: [],
}


async def list_orders_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    order_status: OrderStatus | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    query = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
        .order_by(Order.created_at.desc())
    )
    if order_status is not None:
        query = query.where(Order.status == order_status)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(Order.receiver_name.ilike(pattern), Order.receiver_phone.ilike(pattern))
        )
    if date_from:
        query = query.where(func.date(Order.created_at) >= date_from)
    if date_to:
        query = query.where(func.date(Order.created_at) <= date_to)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    orders = list(result.scalars().unique().all())

    return {
        "items": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def update_order_status(
    db: AsyncSession, order_id: int, new_status: OrderStatus
) -> Order:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")

    allowed = _ALLOWED_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể chuyển trạng thái từ '{order.status.value}' → '{new_status.value}'",
        )

    # Hoàn trả kho khi hủy đơn
    if new_status == OrderStatus.cancelled:
        for item in order.items:
            item.product.stock += item.quantity
            db.add(StockLog(
                product_id=item.product_id,
                change_amount=item.quantity,
                reason=StockLogReason.adjustment,
                reference_id=order.id,
                note=f"Hoàn kho do hủy đơn #{order.id}",
            ))

    order.status = new_status
    await db.flush()

    # Re-fetch with all relationships to ensure user/items are available after flush
    refreshed = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    return refreshed.scalar_one()


async def get_order_detail(db: AsyncSession, order_id: int) -> Order:
    """Lấy chi tiết 1 đơn hàng kèm đầy đủ items (tên SP, ảnh) và thông tin khách hàng."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return order


async def get_order_stats(db: AsyncSession) -> dict:
    """Đếm số đơn hàng theo từng trạng thái."""
    result = await db.execute(
        select(Order.status, func.count(Order.id).label("cnt"))
        .group_by(Order.status)
    )
    rows = result.all()
    stats: dict[str, int] = {s.value: 0 for s in OrderStatus}
    total = 0
    for row in rows:
        stats[row.status.value] = row.cnt
        total += row.cnt
    stats["total"] = total
    return stats
