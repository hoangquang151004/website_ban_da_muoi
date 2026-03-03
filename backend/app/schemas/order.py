from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.order import OrderStatus, PaymentMethod


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    note: str | None = None
    payment_method: PaymentMethod
    items: list[OrderItemCreate]


class OrderResponse(BaseModel):
    id: int
    user_id: int | None
    receiver_name: str
    receiver_phone: str
    receiver_address: str
    note: str | None
    payment_method: PaymentMethod
    status: OrderStatus
    total_amount: Decimal
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderUserSummary(BaseModel):
    """Thông tin tóm tắt khách hàng đặt đơn, dùng trong admin."""
    id: int
    full_name: str
    email: str
    phone: str | None

    model_config = {"from_attributes": True}


class OrderAdminResponse(OrderResponse):
    """OrderResponse mở rộng kèm thông tin khách hàng đặt đơn (dùng trong admin)."""
    user: OrderUserSummary | None = None

    model_config = {"from_attributes": True}


class OrderListPage(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class OrderAdminListPage(BaseModel):
    items: list[OrderAdminResponse]
    total: int
    page: int
    limit: int
    total_pages: int
