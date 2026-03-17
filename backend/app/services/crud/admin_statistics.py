"""CRUD admin: Statistics & reporting."""
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole


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
            Product.stock < Product.min_stock,
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


async def get_kpi_stats(
    db: AsyncSession,
    date_from: date,
    date_to: date,
) -> dict:
    """KPI tổng hợp cho khoảng thời gian: doanh thu, lợi nhuận, tăng trưởng."""
    dt_from = datetime.combine(date_from, datetime.min.time())
    dt_to = datetime.combine(date_to, datetime.max.time())

    # Total revenue (delivered orders only)
    rev_res = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == OrderStatus.delivered,
            Order.created_at >= dt_from,
            Order.created_at <= dt_to,
        )
    )
    total_revenue = float(rev_res.scalar_one())

    # Completed orders count
    ord_res = await db.execute(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.delivered,
            Order.created_at >= dt_from,
            Order.created_at <= dt_to,
        )
    )
    completed_orders = int(ord_res.scalar_one())

    avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0.0

    # Gross profit = sum of (unit_price - cost_price) * quantity (cost_price=0 if null)
    profit_res = await db.execute(
        select(
            func.coalesce(
                func.sum(
                    OrderItem.quantity
                    * (OrderItem.unit_price - func.coalesce(Product.cost_price, 0))
                ),
                0,
            )
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .where(
            Order.status == OrderStatus.delivered,
            Order.created_at >= dt_from,
            Order.created_at <= dt_to,
        )
    )
    gross_profit = float(profit_res.scalar_one())
    total_cost = total_revenue - gross_profit

    # New customers in this period
    cust_res = await db.execute(
        select(func.count(User.id)).where(
            User.role == UserRole.customer,
            User.created_at >= dt_from,
            User.created_at <= dt_to,
        )
    )
    new_customers = int(cust_res.scalar_one())

    # Revenue growth vs previous period of same length
    delta_days = (date_to - date_from).days
    prev_date_to = date_from - timedelta(days=1)
    prev_date_from = prev_date_to - timedelta(days=delta_days)
    prev_dt_from = datetime.combine(prev_date_from, datetime.min.time())
    prev_dt_to = datetime.combine(prev_date_to, datetime.max.time())

    prev_rev_res = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == OrderStatus.delivered,
            Order.created_at >= prev_dt_from,
            Order.created_at <= prev_dt_to,
        )
    )
    prev_revenue = float(prev_rev_res.scalar_one())
    growth_pct = (
        round((total_revenue - prev_revenue) / prev_revenue * 100, 1)
        if prev_revenue > 0
        else 0.0
    )

    return {
        "total_revenue": total_revenue,
        "gross_profit": gross_profit,
        "total_cost": total_cost,
        "avg_order_value": avg_order_value,
        "completed_orders": completed_orders,
        "new_customers": new_customers,
        "growth_pct": growth_pct,
    }


async def get_order_status_distribution(
    db: AsyncSession,
    date_from: date,
    date_to: date,
) -> list[dict]:
    """Phân bố trạng thái đơn hàng trong khoảng thời gian."""
    dt_from = datetime.combine(date_from, datetime.min.time())
    dt_to = datetime.combine(date_to, datetime.max.time())

    result = await db.execute(
        select(Order.status, func.count(Order.id).label("cnt"))
        .where(Order.created_at >= dt_from, Order.created_at <= dt_to)
        .group_by(Order.status)
        .order_by(func.count(Order.id).desc())
    )
    rows = result.all()
    total = sum(r.cnt for r in rows)

    return [
        {
            "status": row.status.value,
            "count": int(row.cnt),
            "percentage": round(row.cnt / total * 100, 1) if total > 0 else 0.0,
        }
        for row in rows
    ]


async def get_category_revenue(
    db: AsyncSession,
    date_from: date,
    date_to: date,
) -> list[dict]:
    """Doanh thu, giá vốn, lợi nhuận theo danh mục (đơn delivered)."""
    dt_from = datetime.combine(date_from, datetime.min.time())
    dt_to = datetime.combine(date_to, datetime.max.time())

    result = await db.execute(
        select(
            Product.category_id,
            Category.name.label("category_name"),
            func.sum(OrderItem.quantity).label("qty_sold"),
            func.sum(OrderItem.subtotal).label("revenue"),
            func.sum(
                OrderItem.quantity * func.coalesce(Product.cost_price, 0)
            ).label("cost"),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .where(
            Order.status == OrderStatus.delivered,
            Order.created_at >= dt_from,
            Order.created_at <= dt_to,
        )
        .group_by(Product.category_id, Category.name)
        .order_by(func.sum(OrderItem.subtotal).desc())
    )
    rows = result.all()

    items = []
    for row in rows:
        rev = float(row.revenue)
        cost = float(row.cost)
        profit = rev - cost
        margin = round(profit / rev * 100, 1) if rev > 0 else 0.0
        items.append(
            {
                "category_id": int(row.category_id),
                "category_name": row.category_name,
                "qty_sold": int(row.qty_sold),
                "revenue": rev,
                "cost": cost,
                "profit": profit,
                "margin_pct": margin,
            }
        )
    return items
