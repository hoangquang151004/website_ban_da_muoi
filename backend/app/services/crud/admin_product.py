"""CRUD admin: Product management."""
import math

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.stock_log import StockLog, StockLogReason
from app.models.use import Use
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.slugify import unique_slug


async def _product_slug_exists(db: AsyncSession, slug: str, exclude_id: int | None = None) -> bool:
    q = select(Product).where(Product.slug == slug)
    if exclude_id:
        q = q.where(Product.id != exclude_id)
    result = await db.execute(q)
    return result.scalar_one_or_none() is not None


async def _load_uses(db: AsyncSession, use_ids: list[int]) -> list[Use]:
    if not use_ids:
        return []
    result = await db.execute(select(Use).where(Use.id.in_(use_ids)))
    uses = list(result.scalars().all())
    if len(uses) != len(use_ids):
        missing = set(use_ids) - {u.id for u in uses}
        raise HTTPException(status_code=400, detail=f"Không tìm thấy Use id={missing}")
    return uses


async def list_products_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    category_id: int | None = None,
    is_active: bool | None = None,
) -> dict:
    query = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.uses))
        .order_by(Product.created_at.desc())
    )
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    products = list(result.scalars().unique().all())
    return {
        "items": products,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    async def slug_exists(slug: str) -> bool:
        return await _product_slug_exists(db, slug)

    slug = data.slug if data.slug else await unique_slug(data.name, slug_exists)
    if data.slug:
        if await _product_slug_exists(db, slug):
            raise HTTPException(status_code=400, detail="Slug đã được sử dụng")

    uses = await _load_uses(db, data.use_ids)

    product = Product(
        name=data.name,
        slug=slug,
        description=data.description,
        price=data.price,
        original_price=data.original_price,
        stock=data.stock,
        image_url=data.image_url,
        model_3d_url=data.model_3d_url,
        is_featured=data.is_featured,
        is_active=data.is_active,
        category_id=data.category_id,
        uses=uses,
    )
    db.add(product)
    await db.flush()
    await db.refresh(product)

    # Eager-load relationships
    result = await db.execute(
        select(Product).where(Product.id == product.id)
        .options(selectinload(Product.category), selectinload(Product.uses))
    )
    return result.scalar_one()


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    result = await db.execute(
        select(Product).where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.uses))
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    update_data = data.model_dump(exclude_unset=True)

    # Handle slug update
    if "name" in update_data and update_data["name"] != product.name:
        if "slug" not in update_data:
            async def slug_exists(slug: str) -> bool:
                return await _product_slug_exists(db, slug, exclude_id=product_id)
            product.slug = await unique_slug(update_data["name"], slug_exists)

    if "slug" in update_data and update_data["slug"] != product.slug:
        if await _product_slug_exists(db, update_data["slug"], exclude_id=product_id):
            raise HTTPException(status_code=400, detail="Slug đã được sử dụng")

    # Handle use_ids replacement
    if "use_ids" in update_data:
        product.uses = await _load_uses(db, update_data.pop("use_ids"))

    # Handle stock change → create StockLog
    if "stock" in update_data and update_data["stock"] != product.stock:
        delta = update_data["stock"] - product.stock
        db.add(StockLog(
            product_id=product_id,
            change_amount=delta,
            reason=StockLogReason.adjustment,
            note="Điều chỉnh kho qua admin",
        ))

    for field, value in update_data.items():
        if field != "use_ids":
            setattr(product, field, value)

    await db.flush()

    result2 = await db.execute(
        select(Product).where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.uses))
    )
    return result2.scalar_one()


async def soft_delete_product(db: AsyncSession, product_id: int) -> None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    product.is_active = False
    await db.flush()
