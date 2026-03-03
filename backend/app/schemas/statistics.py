from pydantic import BaseModel


class StatisticsOverview(BaseModel):
    today_revenue: float
    today_orders: int
    pending_orders: int
    total_customers: int
    total_products_active: int
    low_stock_count: int


class RevenuePoint(BaseModel):
    label: str            # e.g. "2026-03-03" or "2026-03"
    revenue: float
    order_count: int


class TopProductItem(BaseModel):
    product_id: int
    product_name: str
    total_sold: int
    total_revenue: float
