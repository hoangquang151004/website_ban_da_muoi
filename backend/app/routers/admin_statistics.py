"""Admin sub-router: Statistics & reporting."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_admin
from app.schemas.base import BaseResponse
from app.schemas.statistics import (
    CategoryRevenueItem,
    CustomerStatsItem,
    OrderStatusItem,
    ProductStatsItem,
    RevenuePoint,
    StatisticsKPI,
    StatisticsOverview,
    TopProductItem,
)
from app.services.crud import admin_statistics as svc

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("/statistics/overview", response_model=BaseResponse[StatisticsOverview])
async def overview(db: AsyncSession = Depends(get_db)):
    data = await svc.get_overview(db)
    return BaseResponse.success(data=StatisticsOverview(**data))


@router.get("/statistics/revenue", response_model=BaseResponse[list[RevenuePoint]])
async def revenue_chart(
    db: AsyncSession = Depends(get_db),
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=29)),
    date_to: date = Query(default_factory=date.today),
):
    data = await svc.get_revenue_chart(db, period, date_from, date_to)
    return BaseResponse.success(data=[RevenuePoint(**item) for item in data])


@router.get("/statistics/top-products", response_model=BaseResponse[list[TopProductItem]])
async def top_products(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(10, ge=1, le=50),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
):
    data = await svc.get_top_products(db, limit, date_from, date_to)
    return BaseResponse.success(data=[TopProductItem(**item) for item in data])


@router.get("/statistics/kpi", response_model=BaseResponse[StatisticsKPI])
async def kpi_stats(
    db: AsyncSession = Depends(get_db),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=29)),
    date_to: date = Query(default_factory=date.today),
):
    data = await svc.get_kpi_stats(db, date_from, date_to)
    return BaseResponse.success(data=StatisticsKPI(**data))


@router.get("/statistics/order-status", response_model=BaseResponse[list[OrderStatusItem]])
async def order_status_distribution(
    db: AsyncSession = Depends(get_db),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=29)),
    date_to: date = Query(default_factory=date.today),
):
    data = await svc.get_order_status_distribution(db, date_from, date_to)
    return BaseResponse.success(data=[OrderStatusItem(**item) for item in data])


@router.get(
    "/statistics/category-revenue", response_model=BaseResponse[list[CategoryRevenueItem]]
)
async def category_revenue(
    db: AsyncSession = Depends(get_db),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=29)),
    date_to: date = Query(default_factory=date.today),
):
    data = await svc.get_category_revenue(db, date_from, date_to)
    return BaseResponse.success(data=[CategoryRevenueItem(**item) for item in data])


@router.get("/statistics/by-product", response_model=BaseResponse[list[ProductStatsItem]])
async def product_stats(
    db: AsyncSession = Depends(get_db),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=29)),
    date_to: date = Query(default_factory=date.today),
    limit: int = Query(50, ge=1, le=100),
):
    data = await svc.get_product_stats(db, date_from, date_to, limit)
    return BaseResponse.success(data=[ProductStatsItem(**item) for item in data])


@router.get("/statistics/by-customer", response_model=BaseResponse[list[CustomerStatsItem]])
async def customer_stats(
    db: AsyncSession = Depends(get_db),
    date_from: date = Query(default_factory=lambda: date.today() - timedelta(days=29)),
    date_to: date = Query(default_factory=date.today),
    limit: int = Query(50, ge=1, le=100),
):
    data = await svc.get_customer_stats(db, date_from, date_to, limit)
    return BaseResponse.success(data=[CustomerStatsItem(**item) for item in data])
