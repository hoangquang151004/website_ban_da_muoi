"""CRUD admin: Category & Use management."""
import math

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.use import Use
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.use import UseCreate, UseUpdate
from app.utils.slugify import unique_slug


# ===========================================================================
# Category
# ===========================================================================

async def _category_slug_exists(db: AsyncSession, slug: str, exclude_id: int | None = None) -> bool:
    q = select(Category).where(Category.slug == slug)
    if exclude_id:
        q = q.where(Category.id != exclude_id)
    result = await db.execute(q)
    return result.scalar_one_or_none() is not None


async def list_categories_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
) -> dict:
    query = select(Category).options(selectinload(Category.products)).order_by(Category.created_at.desc())
    if search:
        query = query.where(Category.name.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.where(Category.is_active == is_active)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    categories = result.scalars().all()

    items = []
    for cat in categories:
        active_count = sum(1 for p in cat.products if p.is_active)
        items.append({
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "description": cat.description,
            "image_url": cat.image_url,
            "is_active": cat.is_active,
            "created_at": cat.created_at,
            "product_count": active_count,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def create_category(db: AsyncSession, data: CategoryCreate) -> dict:
    async def slug_exists(slug: str) -> bool:
        return await _category_slug_exists(db, slug)

    if data.slug:
        # Use provided slug — check uniqueness
        if await _category_slug_exists(db, data.slug):
            raise HTTPException(status_code=400, detail="Slug đã được sử dụng")
        slug = data.slug
    else:
        slug = await unique_slug(data.name, slug_exists)

    cat = Category(
        name=data.name,
        slug=slug,
        description=data.description,
        image_url=data.image_url,
        is_active=data.is_active,
    )
    db.add(cat)
    await db.flush()
    await db.refresh(cat)
    return {**vars_without_sa_state(cat), "product_count": 0}


async def update_category(db: AsyncSession, cat_id: int, data: CategoryUpdate) -> dict:
    result = await db.execute(
        select(Category).where(Category.id == cat_id).options(selectinload(Category.products))
    )
    cat = result.scalar_one_or_none()
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Danh mục không tồn tại")

    if data.name is not None and data.name != cat.name:
        async def slug_exists(slug: str) -> bool:
            return await _category_slug_exists(db, slug, exclude_id=cat_id)
        cat.slug = await unique_slug(data.name, slug_exists)
        cat.name = data.name
    elif data.name is not None:
        cat.name = data.name

    if data.slug is not None:
        # explicit slug override — check uniqueness
        exists = await _category_slug_exists(db, data.slug, exclude_id=cat_id)
        if exists:
            raise HTTPException(status_code=400, detail="Slug đã được sử dụng")
        cat.slug = data.slug
    if data.description is not None:
        cat.description = data.description
    if data.image_url is not None:
        cat.image_url = data.image_url
    if data.is_active is not None:
        cat.is_active = data.is_active

    await db.flush()
    await db.refresh(cat)
    active_count = sum(1 for p in cat.products if p.is_active)
    return {**vars_without_sa_state(cat), "product_count": active_count}


async def toggle_category_status(db: AsyncSession, cat_id: int, is_active: bool) -> dict:
    result = await db.execute(
        select(Category).where(Category.id == cat_id).options(selectinload(Category.products))
    )
    cat = result.scalar_one_or_none()
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Danh mục không tồn tại")
    cat.is_active = is_active
    await db.flush()
    await db.refresh(cat)
    active_count = sum(1 for p in cat.products if p.is_active)
    return {**vars_without_sa_state(cat), "product_count": active_count}


async def delete_category(db: AsyncSession, cat_id: int) -> None:
    result = await db.execute(
        select(Category).where(Category.id == cat_id).options(selectinload(Category.products))
    )
    cat = result.scalar_one_or_none()
    if cat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Danh mục không tồn tại")
    active_products = [p for p in cat.products if p.is_active]
    if active_products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Danh mục còn sản phẩm đang hoạt động",
        )
    await db.delete(cat)
    await db.flush()


# ===========================================================================
# Use
# ===========================================================================

async def list_uses_admin(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
) -> dict:
    query = select(Use).order_by(Use.created_at.desc())
    if search:
        query = query.where(Use.name.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.where(Use.is_active == is_active)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    uses = result.scalars().all()

    items = [vars_without_sa_state(use) for use in uses]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def create_use(db: AsyncSession, data: UseCreate) -> Use:
    existing = await db.execute(select(Use).where(Use.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tên công dụng đã tồn tại")
    use = Use(name=data.name, icon=data.icon, color=data.color, description=data.description, is_active=data.is_active)
    db.add(use)
    await db.flush()
    await db.refresh(use)
    return use


async def update_use(db: AsyncSession, use_id: int, data: UseUpdate) -> Use:
    result = await db.execute(select(Use).where(Use.id == use_id))
    use = result.scalar_one_or_none()
    if use is None:
        raise HTTPException(status_code=404, detail="Công dụng không tồn tại")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(use, field, value)
    await db.flush()
    await db.refresh(use)
    return use


async def toggle_use_status(db: AsyncSession, use_id: int, is_active: bool) -> Use:
    result = await db.execute(select(Use).where(Use.id == use_id))
    use = result.scalar_one_or_none()
    if use is None:
        raise HTTPException(status_code=404, detail="Công dụng không tồn tại")
    use.is_active = is_active
    await db.flush()
    await db.refresh(use)
    return use


async def delete_use(db: AsyncSession, use_id: int) -> None:
    result = await db.execute(select(Use).where(Use.id == use_id))
    use = result.scalar_one_or_none()
    if use is None:
        raise HTTPException(status_code=404, detail="Công dụng không tồn tại")
    await db.delete(use)
    await db.flush()


# ===========================================================================
# Helpers
# ===========================================================================

def vars_without_sa_state(obj) -> dict:
    """Extract mapped columns as a plain dict (exclude SQLAlchemy internal state)."""
    return {
        k: v for k, v in vars(obj).items() if not k.startswith("_")
    }
