"""CRUD operations cho Order model — bao gồm transaction checkout."""
import math
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.stock_log import StockLog, StockLogReason
from app.schemas.order import OrderCreate


async def create_order(
    db: AsyncSession,
    data: OrderCreate,
    user_id: int | None,
) -> Order:
    """
    Tạo đơn hàng mới trong một transaction.
    Dùng SELECT FOR UPDATE để tránh race condition khi nhiều request mua cùng lúc.
    """
    order_items: list[OrderItem] = []
    stock_logs: list[StockLog] = []
    total_amount = Decimal("0.00")

    for item_data in data.items:
        # Lock row — ngăn concurrent update
        result = await db.execute(
            select(Product)
            .where(Product.id == item_data.product_id, Product.is_active == True)  # noqa: E712
            .with_for_update()
        )
        product = result.scalar_one_or_none()
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sản phẩm id={item_data.product_id} không tồn tại hoặc đã ngừng bán",
            )
        if product.stock < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sản phẩm '{product.name}' không đủ tồn kho (còn {product.stock})",
            )

        # Trừ tồn kho
        product.stock -= item_data.quantity

        unit_price = Decimal(str(product.price))
        subtotal = unit_price * item_data.quantity
        total_amount += subtotal

        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=item_data.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )
        )

        stock_logs.append(
            StockLog(
                product_id=product.id,
                change_amount=-item_data.quantity,
                reason=StockLogReason.purchase,
                note=f"Xuất kho do đơn hàng",
            )
        )

    order = Order(
        user_id=user_id,
        receiver_name=data.receiver_name,
        receiver_phone=data.receiver_phone,
        receiver_address=data.receiver_address,
        note=data.note,
        payment_method=data.payment_method,
        status=OrderStatus.pending,
        total_amount=total_amount,
        items=order_items,
    )
    db.add(order)

    # flush để lấy order.id
    await db.flush()

    # Gắn reference_id = order.id vào stock logs, rồi thêm vào session
    for log in stock_logs:
        log.reference_id = order.id
        db.add(log)

    await db.flush()
    await db.refresh(order)

    # Load items relationship
    result2 = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items))
    )
    return result2.scalar_one()


async def list_user_orders(
    db: AsyncSession,
    user_id: int,
    order_status: OrderStatus | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict:
    """Lịch sử đơn hàng của user."""
    query = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    if order_status is not None:
        query = query.where(Order.status == order_status)

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    orders = result.scalars().all()

    return {
        "items": list(orders),
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def get_order_by_id(db: AsyncSession, order_id: int) -> Order | None:
    """Lấy đơn hàng đầy đủ kèm items."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return result.scalar_one_or_none()
