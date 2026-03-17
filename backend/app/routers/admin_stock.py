"""Admin sub-router: Stock management."""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.models.stock_log import StockLogReason
from app.schemas.base import BaseResponse, PaginatedData
from app.schemas.stock_log import (
    RestockRequest,
    StockLogResponse,
    StockReportItem,
    StockSummary,
    UpdateCostPriceRequest,
    UpdateMinStockRequest,
    WriteOffRequest,
)
from app.services.crud import admin_stock as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/stock/summary", response_model=BaseResponse[StockSummary])
async def get_stock_summary(db: AsyncSession = Depends(get_db)):
    summary = await svc.get_stock_summary(db)
    return BaseResponse.success(data=StockSummary(**summary))


@router.get("/stock", response_model=BaseResponse[list[StockReportItem]])
async def get_stock_report(
    db: AsyncSession = Depends(get_db),
    sort_asc: bool = Query(False, description="True = sort theo tồn kho tăng dần"),
    category_id: int | None = Query(None),
    status: str | None = Query(None, description="in_stock | low_stock | out_of_stock"),
):
    items = await svc.get_stock_report(db, sort_asc, category_id, status)
    return BaseResponse.success(data=[StockReportItem(**item) for item in items])


@router.post("/stock/restock", response_model=BaseResponse[StockReportItem])
async def restock(body: RestockRequest, db: AsyncSession = Depends(get_db)):
    item = await svc.restock_product(db, body.product_id, body.quantity, body.note, body.unit_cost)
    return BaseResponse.success(data=StockReportItem(**item), message="Nhập kho thành công")


@router.patch("/stock/{product_id}/min-stock", response_model=BaseResponse[StockReportItem])
async def update_min_stock(
    product_id: int, body: UpdateMinStockRequest, db: AsyncSession = Depends(get_db)
):
    item = await svc.update_min_stock(db, product_id, body.min_stock)
    return BaseResponse.success(data=StockReportItem(**item), message="Cập nhật thành công")


@router.patch("/stock/{product_id}/cost-price", response_model=BaseResponse[StockReportItem])
async def update_cost_price(
    product_id: int, body: UpdateCostPriceRequest, db: AsyncSession = Depends(get_db)
):
    item = await svc.update_cost_price(db, product_id, body.cost_price)
    return BaseResponse.success(data=StockReportItem(**item), message="Cập nhật giá vốn thành công")


@router.post("/stock/write-off", response_model=BaseResponse[StockReportItem])
async def write_off(body: WriteOffRequest, db: AsyncSession = Depends(get_db)):
    item = await svc.write_off_product(
        db, body.product_id, body.quantity, body.write_off_reason.value, body.note
    )
    return BaseResponse.success(data=StockReportItem(**item), message="Xuất kho điều chỉnh thành công")


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
