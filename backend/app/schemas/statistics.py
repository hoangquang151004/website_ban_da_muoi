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


class StatisticsKPI(BaseModel):
    total_revenue: float
    gross_profit: float
    total_cost: float         # COGS (cost of goods sold)
    avg_order_value: float
    completed_orders: int
    new_customers: int
    growth_pct: float         # revenue growth vs previous same-length period


class OrderStatusItem(BaseModel):
    status: str
    count: int
    percentage: float


class CategoryRevenueItem(BaseModel):
    category_id: int
    category_name: str
    qty_sold: int
    revenue: float
    cost: float
    profit: float
    margin_pct: float
