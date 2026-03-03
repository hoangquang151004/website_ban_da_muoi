from datetime import datetime

from pydantic import BaseModel

from app.models.stock_log import StockLogReason


class StockLogCreate(BaseModel):
    product_id: int
    change_amount: int
    reason: StockLogReason
    reference_id: int | None = None
    note: str | None = None


class StockLogResponse(BaseModel):
    id: int
    product_id: int
    product_name: str = ""  # Computed field
    change_amount: int
    reason: StockLogReason
    reference_id: int | None
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RestockRequest(BaseModel):
    product_id: int
    quantity: int
    note: str | None = None


class StockReportItem(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    price: float
    stock_value: float
    low_stock: bool
