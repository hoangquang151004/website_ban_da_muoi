"""CRUD admin: Statistics & reporting."""
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.services.crud.admin_stock import LOW_STOCK_THRESHOLD


async def get_overview(db: AsyncSession) -> dict:
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    # Today revenue (delivered orders)
    today_rev_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == OrderStatus.delivered,
            Order.created_at >= today_start,
            Order.created_at <= today_end,
        )
    )
    today_revenue = float(today_rev_result.scalar_one())

    # Today orders count
    today_orders_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.created_at >= today_start,
            Order.created_at <= today_end,
        )
    )
    today_orders = today_orders_result.scalar_one()

    # Pending orders
    pending_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.pending)
    )
    pending_orders = pending_result.scalar_one()

    # Total customers
    customers_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.customer)
    )
    total_customers = customers_result.scalar_one()

    # Total active products
    products_result = await db.execute(
        select(func.count(Product.id)).where(Product.is_active == True)  # noqa: E712
    )
    total_products_active = products_result.scalar_one()

    # Low stock count
    low_stock_result = await db.execute(
        select(func.count(Product.id)).where(
            Product.is_active == True,  # noqa: E712
            Product.stock < LOW_STOCK_THRESHOLD,
        )
    )
    low_stock_count = low_stock_result.scalar_one()

    return {
        "today_revenue": today_revenue,
        "today_orders": today_orders,
        "pending_orders": pending_orders,
        "total_customers": total_customers,
        "total_products_active": total_products_active,
        "low_stock_count": low_stock_count,
    }


async def get_revenue_chart(
    db: AsyncSession,
    period: str,  # "daily" | "weekly" | "monthly"
    date_from: date,
    date_to: date,
) -> list[dict]:
    """Doanh thu theo period, chỉ tính đơn delivered."""
    if period == "monthly":
        label_expr = func.date_format(Order.created_at, "%Y-%m")
    elif period == "weekly":
        label_expr = func.date_format(Order.created_at, "%Y-%u")
    else:  # daily
        label_expr = func.date_format(Order.created_at, "%Y-%m-%d")

    result = await db.execute(
        select(
            label_expr.label("label"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("order_count"),
        )
        .where(
            Order.status == OrderStatus.delivered,
            func.date(Order.created_at) >= date_from,
            func.date(Order.created_at) <= date_to,
        )
        .group_by("label")
        .order_by("label")
    )
    return [
        {"label": row.label, "revenue": float(row.revenue), "order_count": row.order_count}
        for row in result.all()
    ]


async def get_top_products(
    db: AsyncSession,
    limit: int = 10,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    """Sản phẩm bán chạy nhất (đơn delivered)."""
    query = (
        select(
            OrderItem.product_id,
            Product.name.label("product_name"),
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal).label("total_revenue"),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .where(Order.status == OrderStatus.delivered)
        .group_by(OrderItem.product_id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    if date_from:
        query = query.where(func.date(Order.created_at) >= date_from)
    if date_to:
        query = query.where(func.date(Order.created_at) <= date_to)

    result = await db.execute(query)
    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "total_sold": int(row.total_sold),
            "total_revenue": float(row.total_revenue),
        }
        for row in result.all()
    ]
