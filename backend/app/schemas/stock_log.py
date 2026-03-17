from datetime import datetime
import enum

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
    unit_cost: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RestockRequest(BaseModel):
    product_id: int
    quantity: int
    note: str | None = None
    unit_cost: float | None = None  # Giá nhập cho lần này


class UpdateMinStockRequest(BaseModel):
    min_stock: int


class UpdateCostPriceRequest(BaseModel):
    cost_price: float | None = None


class WriteOffReason(str, enum.Enum):
    damaged = "damaged"    # Hàng hỏng
    expired = "expired"    # Hết hạn / hỏng do lưu lâu
    lost = "lost"          # Mất mát, thất thoát
    other = "other"        # Lý do khác


class WriteOffRequest(BaseModel):
    product_id: int
    quantity: int  # Số lượng cần xuất (dương, service sẽ đổi thành âm)
    write_off_reason: WriteOffReason
    note: str | None = None


class StockReportItem(BaseModel):
    product_id: int
    product_name: str
    category_name: str
    image_url: str | None
    current_stock: int
    min_stock: int
    price: float
    cost_price: float | None = None
    stock_value: float
    low_stock: bool


class StockSummary(BaseModel):
    total_products: int
    total_stock: int
    low_stock_count: int
    out_of_stock_count: int
    total_stock_value: float
    new_imported: int
