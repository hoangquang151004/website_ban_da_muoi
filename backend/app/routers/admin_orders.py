"""Admin sub-router: Order management."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models.order import OrderStatus
from app.schemas.base import BaseResponse
from app.schemas.order import (
    OrderAdminDetailResponse,
    OrderAdminListPage,
    OrderAdminResponse,
    OrderStatsResponse,
    OrderStatusUpdate,
)
from app.services.crud import admin_order as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/orders/stats", response_model=BaseResponse[OrderStatsResponse])
async def get_order_stats(db: AsyncSession = Depends(get_db)):
    stats = await svc.get_order_stats(db)
    return BaseResponse.success(data=OrderStatsResponse(**stats))


@router.get("/orders", response_model=BaseResponse[OrderAdminListPage])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    order_status: OrderStatus | None = Query(None, alias="status"),
    search: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
):
    result = await svc.list_orders_admin(db, page, limit, order_status, search, date_from, date_to)
    page_data = OrderAdminListPage(
        items=[OrderAdminResponse.model_validate(o) for o in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)


@router.get("/orders/{order_id}", response_model=BaseResponse[OrderAdminDetailResponse])
async def get_order_detail(order_id: int, db: AsyncSession = Depends(get_db)):
    order = await svc.get_order_detail(db, order_id)
    # Manually build items with product name + image_url
    items_data = []
    for item in order.items:
        items_data.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": item.subtotal,
            "product_name": item.product.name if item.product else None,
            "image_url": item.product.image_url if item.product else None,
        })
    detail = OrderAdminDetailResponse(
        id=order.id,
        user_id=order.user_id,
        receiver_name=order.receiver_name,
        receiver_phone=order.receiver_phone,
        receiver_address=order.receiver_address,
        note=order.note,
        payment_method=order.payment_method,
        status=order.status,
        total_amount=order.total_amount,
        items=items_data,
        user=order.user,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )
    return BaseResponse.success(data=detail)


@router.put("/orders/{order_id}/status", response_model=BaseResponse[OrderAdminResponse])
async def update_order_status(
    order_id: int, body: OrderStatusUpdate, db: AsyncSession = Depends(get_db)
):
    order = await svc.update_order_status(db, order_id, body.status)
    return BaseResponse.success(data=OrderAdminResponse.model_validate(order))
