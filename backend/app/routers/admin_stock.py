"""Admin sub-router: Stock management."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models.stock_log import StockLogReason
from app.schemas.base import BaseResponse, PaginatedData
from app.schemas.stock_log import RestockRequest, StockLogResponse, StockReportItem
from app.services.crud import admin_stock as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/stock", response_model=BaseResponse[list[StockReportItem]])
async def get_stock_report(
    db: AsyncSession = Depends(get_db),
    sort_asc: bool = Query(False, description="True = sort theo tồn kho tăng dần"),
):
    items = await svc.get_stock_report(db, sort_asc)
    return BaseResponse.success(data=[StockReportItem(**item) for item in items])


@router.post("/stock/restock", response_model=BaseResponse[StockReportItem])
async def restock(body: RestockRequest, db: AsyncSession = Depends(get_db)):
    item = await svc.restock_product(db, body.product_id, body.quantity, body.note)
    return BaseResponse.success(data=StockReportItem(**item), message="Nhập kho thành công")


@router.get("/stock/logs", response_model=BaseResponse[PaginatedData[StockLogResponse]])
async def list_stock_logs(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    product_id: int | None = Query(None),
    reason: StockLogReason | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
):
    result = await svc.list_stock_logs(db, page, limit, product_id, reason, date_from, date_to)
    page_data = PaginatedData(
        items=[StockLogResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"],
    )
    return BaseResponse.success(data=page_data)
