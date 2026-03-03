"""CRUD admin: Stock management."""
import math
from datetime import date

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.stock_log import StockLog, StockLogReason


LOW_STOCK_THRESHOLD = 5


async def get_stock_report(db: AsyncSession, sort_asc: bool = False) -> list[dict]:
    """Tồn kho tất cả sản phẩm active."""
    order_col = Product.stock.asc() if sort_asc else Product.stock.desc()
    result = await db.execute(
        select(Product).where(Product.is_active == True).order_by(order_col)  # noqa: E712
    )
    products = result.scalars().all()
    items = []
    for p in products:
        price = float(p.price)
        items.append({
            "product_id": p.id,
            "product_name": p.name,
            "current_stock": p.stock,
            "price": price,
            "stock_value": round(p.stock * price, 2),
            "low_stock": p.stock < LOW_STOCK_THRESHOLD,
        })
    return items


async def restock_product(
    db: AsyncSession, product_id: int, quantity: int, note: str | None
) -> dict:
    """Nhập kho: cộng quantity vào stock, ghi StockLog."""
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Số lượng nhập kho phải > 0")

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    product.stock += quantity
    db.add(StockLog(
        product_id=product_id,
        change_amount=quantity,
        reason=StockLogReason.restock,
        note=note or f"Nhập kho {quantity} sản phẩm",
    ))
    await db.flush()
    await db.refresh(product)
    return {
        "product_id": product.id,
        "product_name": product.name,
        "current_stock": product.stock,
        "price": float(product.price),
        "stock_value": round(product.stock * float(product.price), 2),
        "low_stock": product.stock < LOW_STOCK_THRESHOLD,
    }


async def list_stock_logs(
    db: AsyncSession,
    page: int = 1,
    limit: int = 50,
    product_id: int | None = None,
    reason: StockLogReason | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    query = (
        select(StockLog, Product.name.label("product_name"))
        .join(Product, StockLog.product_id == Product.id)
        .order_by(StockLog.created_at.desc())
    )
    if product_id is not None:
        query = query.where(StockLog.product_id == product_id)
    if reason is not None:
        query = query.where(StockLog.reason == reason)
    if date_from:
        query = query.where(func.date(StockLog.created_at) >= date_from)
    if date_to:
        query = query.where(func.date(StockLog.created_at) <= date_to)

    count_result = await db.execute(
        select(func.count()).select_from(
            select(StockLog.id)
            .join(Product, StockLog.product_id == Product.id)
            .filter(
                *(
                    ([StockLog.product_id == product_id] if product_id else [])
                    + ([StockLog.reason == reason] if reason else [])
                    + ([func.date(StockLog.created_at) >= date_from] if date_from else [])
                    + ([func.date(StockLog.created_at) <= date_to] if date_to else [])
                )
            ).subquery()
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = result.all()

    items = []
    for row in rows:
        log: StockLog = row[0]
        product_name: str = row[1]
        items.append({
            "id": log.id,
            "product_id": log.product_id,
            "product_name": product_name,
            "change_amount": log.change_amount,
            "reason": log.reason,
            "reference_id": log.reference_id,
            "note": log.note,
            "created_at": log.created_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }
