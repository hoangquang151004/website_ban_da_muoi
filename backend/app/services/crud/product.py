"""CRUD operations cho Product, Category, Use model."""
import math
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.product import Product
from app.models.review import Review
from app.models.use import Use


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

async def list_categories_active(db: AsyncSession) -> list[dict]:
    """Trả về danh sách category active kèm product_count."""
    result = await db.execute(
        select(Category).where(Category.is_active == True).options(  # noqa: E712
            selectinload(Category.products)
        )
    )
    categories = result.scalars().all()
    output = []
    for cat in categories:
        # Chỉ đếm sản phẩm active trong category
        active_count = sum(1 for p in cat.products if p.is_active)
        cat_dict = {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "description": cat.description,
            "image_url": cat.image_url,
            "is_active": cat.is_active,
            "created_at": cat.created_at,
            "product_count": active_count,
        }
        output.append(cat_dict)
    return output


# ---------------------------------------------------------------------------
# Use
# ---------------------------------------------------------------------------

async def list_uses_active(db: AsyncSession) -> list[Use]:
    """Trả về danh sách use tag active."""
    result = await db.execute(
        select(Use).where(Use.is_active == True)  # noqa: E712
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

async def list_products(
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
    category_slug: str | None = None,
    use_id: int | None = None,
    is_featured: bool | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    search: str | None = None,
    sort_by: str | None = None,
) -> dict:
    """Danh sách sản phẩm có phân trang, lọc, tìm kiếm."""
    query = (
        select(Product)
        .where(Product.is_active == True)  # noqa: E712
        .options(selectinload(Product.uses))
    )

    # Filter: category slug
    if category_slug:
        query = query.join(Category).where(
            Category.slug == category_slug,
            Category.is_active == True,  # noqa: E712
        )

    # Filter: use_id
    if use_id is not None:
        query = query.join(Product.uses).where(
            Use.id == use_id,
            Use.is_active == True,  # noqa: E712
        )

    # Filter: is_featured
    if is_featured is not None:
        query = query.where(Product.is_featured == is_featured)

    # Filter: price range
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    # Search by name or description (case-insensitive)
    if search:
        like_pattern = f"%{search}%"
        query = query.where(
            Product.name.ilike(like_pattern) | Product.description.ilike(like_pattern)
        )

    # Count total (before pagination)
    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    # Sort
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    else:  # newest (default)
        query = query.order_by(Product.created_at.desc())

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    products = result.scalars().unique().all()

    return {
        "items": list(products),
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    }


async def get_product_by_slug(db: AsyncSession, slug: str) -> Product | None:
    """Lấy product đầy đủ thông tin kèm category, uses, reviews (approved)."""
    result = await db.execute(
        select(Product)
        .where(Product.slug == slug, Product.is_active == True)  # noqa: E712
        .options(
            selectinload(Product.category),
            selectinload(Product.uses),
            selectinload(Product.reviews),
        )
    )
    product = result.scalar_one_or_none()
    return product


def compute_average_rating(reviews: list[Review]) -> float | None:
    """Tính average rating từ danh sách review đã approved."""
    approved = [r.rating for r in reviews if r.is_approved]
    if not approved:
        return None
    return round(sum(approved) / len(approved), 2)
