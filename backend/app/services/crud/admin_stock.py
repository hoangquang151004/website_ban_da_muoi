"""CRUD admin: Stock management."""
import math
from datetime import date

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.product import Product
from app.models.stock_log import StockLog, StockLogReason


from decimal import Decimal

async def get_stock_report(
    db: AsyncSession,
    sort_asc: bool = False,
    category_id: int | None = None,
    status: str | None = None,
) -> list[dict]:
    """Tồn kho tất cả sản phẩm active, có join category."""
    order_col = Product.stock.asc() if sort_asc else Product.stock.desc()
    query = (
        select(Product, Category.name.label("category_name"))
        .join(Category, Product.category_id == Category.id)
        .where(Product.is_active == True)  # noqa: E712
        .order_by(order_col)
    )
    if category_id is not None:
        query = query.where(Product.category_id == category_id)

    result = await db.execute(query)
    rows = result.all()

    items = []
    for row in rows:
        p: Product = row[0]
        cat_name: str = row[1]
        
        # Đảm bảo ép kiểu an toàn
        price = Decimal(str(p.price or 0))
        cost_price = Decimal(str(p.cost_price)) if p.cost_price is not None else None
        stock = Decimal(str(p.stock or 0))
        
        low_stock = p.stock < p.min_stock
        out_of_stock = p.stock == 0

        if status == "low_stock" and not (low_stock and not out_of_stock):
            continue
        if status == "out_of_stock" and not out_of_stock:
            continue
        if status == "in_stock" and (low_stock or out_of_stock):
            continue

        items.append({
            "product_id": p.id,
            "product_name": p.name,
            "category_name": cat_name,
            "image_url": p.image_url,
            "current_stock": p.stock,
            "min_stock": p.min_stock,
            "price": float(price),
            "cost_price": float(cost_price) if cost_price is not None else None,
            "stock_value": float(round(stock * price, 2)),
            "low_stock": low_stock,
        })
    return items


async def get_stock_summary(db: AsyncSession) -> dict:
    """Tổng quan tồn kho."""
    result = await db.execute(
        select(Product).where(Product.is_active == True)  # noqa: E712
    )
    products = result.scalars().all()

    total_stock = sum(p.stock for p in products)
    low_stock_count = sum(1 for p in products if 0 < p.stock < p.min_stock)
    out_of_stock_count = sum(1 for p in products if p.stock == 0)
    
    total_value = Decimal("0.0")
    for p in products:
        s = Decimal(str(p.stock or 0))
        price = Decimal(str(p.price or 0))
        # Nếu không có giá vốn, ước tính bằng 70% giá bán
        if p.cost_price is not None:
            cost = Decimal(str(p.cost_price))
        else:
            cost = price * Decimal("0.7")
        total_value += s * cost

    # tổng nhập kho trong 30 ngày gần nhất
    from datetime import datetime, timedelta
    since = datetime.utcnow() - timedelta(days=30)
    log_result = await db.execute(
        select(func.coalesce(func.sum(StockLog.change_amount), 0)).where(
            StockLog.reason == StockLogReason.restock,
            StockLog.created_at >= since,
        )
    )
    new_imported = log_result.scalar_one() or 0

    return {
        "total_products": len(products),
        "total_stock": total_stock,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "total_stock_value": round(total_value, 2),
        "new_imported": int(new_imported),
    }


async def restock_product(
    db: AsyncSession, product_id: int, quantity: int, note: str | None,
    unit_cost: float | None = None,
) -> dict:
    """Nhập kho: cộng quantity vào stock, ghi StockLog."""
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Số lượng nhập kho phải > 0")

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    product.stock += quantity
    if unit_cost is not None:
        product.cost_price = unit_cost

    db.add(StockLog(
        product_id=product_id,
        change_amount=quantity,
        reason=StockLogReason.restock,
        note=note or f"Nhập kho {quantity} sản phẩm",
        unit_cost=unit_cost,
    ))
    await db.flush()
    await db.refresh(product)

    # get category name
    cat_result = await db.execute(select(Category).where(Category.id == product.category_id))
    category = cat_result.scalar_one_or_none()

    return {
        "product_id": product.id,
        "product_name": product.name,
        "category_name": category.name if category else "",
        "image_url": product.image_url,
        "current_stock": product.stock,
        "min_stock": product.min_stock,
        "price": float(product.price),
        "cost_price": float(product.cost_price) if product.cost_price else None,
        "stock_value": round(product.stock * float(product.price), 2),
        "low_stock": product.stock < product.min_stock,
    }


async def update_min_stock(db: AsyncSession, product_id: int, min_stock: int) -> dict:
    """Cập nhật mức tồn kho tối thiểu."""
    if min_stock < 0:
        raise HTTPException(status_code=400, detail="Mức tồn kho tối thiểu phải >= 0")

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    product.min_stock = min_stock
    await db.flush()
    await db.refresh(product)

    cat_result = await db.execute(select(Category).where(Category.id == product.category_id))
    category = cat_result.scalar_one_or_none()

    return {
        "product_id": product.id,
        "product_name": product.name,
        "category_name": category.name if category else "",
        "image_url": product.image_url,
        "current_stock": product.stock,
        "min_stock": product.min_stock,
        "price": float(product.price),
        "cost_price": float(product.cost_price) if product.cost_price else None,
        "stock_value": round(product.stock * float(product.price), 2),
        "low_stock": product.stock < product.min_stock,
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


async def update_cost_price(db: AsyncSession, product_id: int, cost_price: float | None) -> dict:
    """Cập nhật giá vốn thủ công cho sản phẩm."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    product.cost_price = cost_price
    await db.flush()
    await db.refresh(product)

    cat_result = await db.execute(select(Category).where(Category.id == product.category_id))
    category = cat_result.scalar_one_or_none()

    return {
        "product_id": product.id,
        "product_name": product.name,
        "category_name": category.name if category else "",
        "image_url": product.image_url,
        "current_stock": product.stock,
        "min_stock": product.min_stock,
        "price": float(product.price),
        "cost_price": float(product.cost_price) if product.cost_price else None,
        "stock_value": round(product.stock * float(product.price), 2),
        "low_stock": product.stock < product.min_stock,
    }


async def write_off_product(
    db: AsyncSession, product_id: int, quantity: int,
    write_off_reason: str, note: str | None,
) -> dict:
    """Xuất kho điều chỉnh: trừ quantity, ghi StockLog với reason=adjustment."""
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Số lượng xuất phải > 0")

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    if product.stock < quantity:
        raise HTTPException(status_code=400, detail=f"Tồn kho không đủ (hiện có {product.stock})")

    product.stock -= quantity
    log_note = f"[{write_off_reason}] {note}" if note else f"[{write_off_reason}] Xuất điều chỉnh {quantity} sp"
    db.add(StockLog(
        product_id=product_id,
        change_amount=-quantity,
        reason=StockLogReason.adjustment,
        note=log_note,
    ))
    await db.flush()
    await db.refresh(product)

    cat_result = await db.execute(select(Category).where(Category.id == product.category_id))
    category = cat_result.scalar_one_or_none()

    return {
        "product_id": product.id,
        "product_name": product.name,
        "category_name": category.name if category else "",
        "image_url": product.image_url,
        "current_stock": product.stock,
        "min_stock": product.min_stock,
        "price": float(product.price),
        "cost_price": float(product.cost_price) if product.cost_price else None,
        "stock_value": round(product.stock * float(product.price), 2),
        "low_stock": product.stock < product.min_stock,
    }
