"""Admin sub-router: Order management."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models.order import OrderStatus
from app.schemas.base import BaseResponse
from app.schemas.order import OrderAdminListPage, OrderAdminResponse, OrderStatusUpdate
from app.services.crud import admin_order as svc

router = APIRouter(dependencies=[Depends(require_admin)])


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


@router.put("/orders/{order_id}/status", response_model=BaseResponse[OrderAdminResponse])
async def update_order_status(
    order_id: int, body: OrderStatusUpdate, db: AsyncSession = Depends(get_db)
):
    order = await svc.update_order_status(db, order_id, body.status)
    return BaseResponse.success(data=OrderAdminResponse.model_validate(order))
