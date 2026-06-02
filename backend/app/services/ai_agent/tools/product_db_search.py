"""
product_db_search.py — Tìm sản phẩm qua MySQL với bộ lọc AND/OR (DB-first).
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any, Literal, Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload, sessionmaker

from app.core.config import settings
from app.models.category import Category
from app.models.product import Product
from app.models.use import Use, product_uses
from app.services.ai_agent.llm import get_llm

logger = logging.getLogger(__name__)

MatchMode = Literal["any", "all"]
SortBy = Literal["price_asc", "price_desc", "newest", "featured"]


class ProductFilterSpec(BaseModel):
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    use_ids: list[int] = Field(default_factory=list)
    use_match: MatchMode = "any"
    category_slug: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)
    keyword_match: MatchMode = "any"
    featured_only: bool = False
    sort_by: Optional[SortBy] = None
    limit: int = Field(default=6, ge=1, le=20)

    @field_validator("use_ids", mode="before")
    @classmethod
    def normalize_use_ids(cls, v: Any) -> list[int]:
        if not v:
            return []
        out: list[int] = []
        for item in v:
            try:
                out.append(int(item))
            except (TypeError, ValueError):
                continue
        return out

    @field_validator("keywords", mode="before")
    @classmethod
    def normalize_keywords(cls, v: Any) -> list[str]:
        if not v:
            return []
        if isinstance(v, str):
            v = [v]
        return [str(k).strip() for k in v if str(k).strip()]

    def to_meta_dict(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)


class ParsedProductFilters(BaseModel):
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    use_ids: list[int] = Field(default_factory=list)
    use_match: MatchMode = "any"
    category_slug: Optional[str] = None
    keywords: list[str] = Field(default_factory=list)
    keyword_match: MatchMode = "any"
    featured_only: bool = False
    sort_by: Optional[SortBy] = None


_FILTER_PARSE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """Bạn phân tích yêu cầu tìm/gợi ý sản phẩm đèn đá muối Himalaya.
Trả về JSON với các trường:
- max_price, min_price (VND, số thực). "500k" -> 500000, "1.5 triệu" -> 1500000
- use_ids: list id công dụng khớp catalog (chỉ id có trong catalog)
- use_match: "any" nếu khách dùng "hoặc"/"hay"; "all" nếu "và"/"cả"/"đồng thời"
- category_slug: slug danh mục nếu khớp catalog
- keywords: từ khóa tìm trong tên/mô tả (bỏ từ thừa: gợi ý, tư vấn, đèn, sản phẩm)
- keyword_match: "any" hoặc "all" (mặc định any)
- featured_only: true nếu hỏi nổi bật/bán chạy
- sort_by: price_asc | price_desc | newest | featured

Catalog:
{catalog}""",
    ),
    ("human", "Yêu cầu khách: {message}"),
])


def extract_max_price_from_text(text: str) -> Optional[float]:
    patterns = [
        (r"dưới\s*(\d+)\s*k\b", 1000),
        (r"tầm\s*(\d+)\s*k\b", 1000),
        (r"khoảng\s*(\d+)\s*k\b", 1000),
        (r"(\d+)\s*triệu", 1_000_000),
        (r"(\d{3,})\s*(?:đồng|vnd|đ)\b", 1),
    ]
    lower = (text or "").lower()
    for pattern, multiplier in patterns:
        match = re.search(pattern, lower)
        if match:
            val = float(match.group(1))
            if "triệu" in pattern:
                return val * multiplier
            if "k" in pattern or val < 10000:
                return val * multiplier
            return val
    return None


def extract_min_price_from_text(text: str) -> Optional[float]:
    patterns = [
        (r"trên\s*(\d+)\s*k\b", 1000),
        (r"từ\s*(\d+)\s*k\b", 1000),
    ]
    lower = (text or "").lower()
    for pattern, multiplier in patterns:
        match = re.search(pattern, lower)
        if match:
            return float(match.group(1)) * multiplier
    return None


def merge_price_fallback(spec: ProductFilterSpec, message: str) -> ProductFilterSpec:
    if spec.max_price is None:
        spec.max_price = extract_max_price_from_text(message)
    if spec.min_price is None:
        spec.min_price = extract_min_price_from_text(message)
    if spec.max_price is not None and spec.sort_by is None:
        spec.sort_by = "price_asc"
    return spec


def build_keyword_condition(keywords: list[str], match: MatchMode):
    if not keywords:
        return None
    per_keyword = [
        or_(
            Product.name.ilike(f"%{kw}%"),
            Product.description.ilike(f"%{kw}%"),
        )
        for kw in keywords
    ]
    if match == "all":
        return and_(*per_keyword)
    return or_(*per_keyword)


def build_use_product_ids_subquery(use_ids: list[int], match: MatchMode):
    if not use_ids:
        return None
    if match == "any":
        return (
            select(product_uses.c.product_id)
            .where(product_uses.c.use_id.in_(use_ids))
            .distinct()
        )
    return (
        select(product_uses.c.product_id)
        .where(product_uses.c.use_id.in_(use_ids))
        .group_by(product_uses.c.product_id)
        .having(func.count(func.distinct(product_uses.c.use_id)) == len(use_ids))
    )


def product_to_dict(p: Product) -> dict:
    short_description = p.description
    if short_description and len(short_description) > 120:
        short_description = short_description[:120] + "..."
    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "price": float(p.price),
        "original_price": float(p.original_price) if p.original_price else None,
        "image_url": p.image_url,
        "stock": p.stock,
        "short_description": short_description,
        "uses": [{"id": u.id, "name": u.name} for u in (p.uses or [])],
    }


async def _get_async_session() -> tuple[Any, Any]:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, async_session


async def load_product_catalog() -> dict[str, Any]:
    engine, async_session = await _get_async_session()
    try:
        async with async_session() as session:
            uses_result = await session.execute(
                select(Use.id, Use.name).where(Use.is_active == True)  # noqa: E712
            )
            categories_result = await session.execute(
                select(Category.slug, Category.name).where(Category.is_active == True)  # noqa: E712
            )
            uses = [{"id": row.id, "name": row.name} for row in uses_result.all()]
            categories = [
                {"slug": row.slug, "name": row.name} for row in categories_result.all()
            ]
            return {"uses": uses, "categories": categories}
    finally:
        await engine.dispose()


_catalog_cache: dict[str, Any] = {"data": None, "expires_at": 0.0}


async def get_product_catalog_cached(ttl_seconds: int = 300) -> dict[str, Any]:
    now = time.time()
    if _catalog_cache["data"] is not None and now < _catalog_cache["expires_at"]:
        return _catalog_cache["data"]
    data = await load_product_catalog()
    _catalog_cache["data"] = data
    _catalog_cache["expires_at"] = now + ttl_seconds
    return data


def format_catalog_for_prompt(catalog: dict[str, Any]) -> str:
    uses = catalog.get("uses") or []
    categories = catalog.get("categories") or []
    uses_text = ", ".join(f"{u['id']}:{u['name']}" for u in uses) or "(trống)"
    cat_text = ", ".join(f"{c['slug']}:{c['name']}" for c in categories) or "(trống)"
    return f"Công dụng (id:name): {uses_text}\nDanh mục (slug:name): {cat_text}"


async def parse_product_filters(
    message: str,
    conversation_context: Optional[str] = None,
) -> ProductFilterSpec:
    catalog = await get_product_catalog_cached()
    catalog_text = format_catalog_for_prompt(catalog)
    llm = get_llm()
    parser = JsonOutputParser(pydantic_object=ParsedProductFilters)
    chain = _FILTER_PARSE_PROMPT | llm | parser

    parse_message = message
    if conversation_context:
        parse_message = f"{conversation_context.strip()}\n\n[Câu hiện tại]\n{message}"

    parsed = ParsedProductFilters()
    try:
        raw = await chain.ainvoke({"message": parse_message, "catalog": catalog_text})
        if isinstance(raw, ParsedProductFilters):
            parsed = raw
        else:
            parsed = ParsedProductFilters(**raw)
    except Exception:
        logger.warning("LLM filter parse failed, using regex/defaults", exc_info=True)

    valid_use_ids = {u["id"] for u in catalog.get("uses", [])}
    use_ids = [uid for uid in parsed.use_ids if uid in valid_use_ids]

    valid_slugs = {c["slug"] for c in catalog.get("categories", [])}
    category_slug = parsed.category_slug if parsed.category_slug in valid_slugs else None

    spec = ProductFilterSpec(
        max_price=parsed.max_price,
        min_price=parsed.min_price,
        use_ids=use_ids,
        use_match=parsed.use_match,
        category_slug=category_slug,
        keywords=parsed.keywords,
        keyword_match=parsed.keyword_match,
        featured_only=parsed.featured_only,
        sort_by=parsed.sort_by,
        limit=settings.PRODUCT_RECOMMEND_LIMIT,
    )
    return merge_price_fallback(spec, message)


async def query_products_by_filters(spec: ProductFilterSpec) -> list[dict]:
    engine, async_session = await _get_async_session()
    output: list[dict] = []

    try:
        async with async_session() as session:
            conditions: list[Any] = [
                Product.is_active == True,  # noqa: E712
                Product.stock > 0,
            ]
            if spec.max_price is not None:
                conditions.append(Product.price <= spec.max_price)
            if spec.min_price is not None:
                conditions.append(Product.price >= spec.min_price)
            if spec.featured_only:
                conditions.append(Product.is_featured == True)  # noqa: E712

            use_subq = build_use_product_ids_subquery(spec.use_ids, spec.use_match)
            if use_subq is not None:
                conditions.append(Product.id.in_(use_subq))

            keyword_cond = build_keyword_condition(spec.keywords, spec.keyword_match)
            if keyword_cond is not None:
                conditions.append(keyword_cond)

            query = select(Product).where(and_(*conditions))

            if spec.category_slug:
                query = query.join(Category, Product.category_id == Category.id).where(
                    Category.slug == spec.category_slug,
                    Category.is_active == True,  # noqa: E712
                )

            sort_by = spec.sort_by
            if sort_by is None and spec.max_price is not None:
                sort_by = "price_asc"
            if sort_by == "price_asc":
                query = query.order_by(Product.price.asc(), Product.id.asc())
            elif sort_by == "price_desc":
                query = query.order_by(Product.price.desc(), Product.id.desc())
            elif sort_by == "newest":
                query = query.order_by(Product.created_at.desc(), Product.id.desc())
            else:
                query = query.order_by(
                    Product.is_featured.desc(),
                    Product.created_at.desc(),
                    Product.id.desc(),
                )

            query = query.options(selectinload(Product.uses)).limit(spec.limit)
            result = await session.execute(query)
            products = result.scalars().unique().all()

            # Fallback: bỏ lọc use/keyword nếu quá hẹp nhưng vẫn giữ giá
            if not products and (spec.use_ids or spec.keywords):
                relaxed = ProductFilterSpec(
                    max_price=spec.max_price,
                    min_price=spec.min_price,
                    category_slug=spec.category_slug,
                    featured_only=spec.featured_only,
                    sort_by=sort_by or "featured",
                    limit=spec.limit,
                )
                return await query_products_by_filters(relaxed)

            output = [product_to_dict(p) for p in products]
    finally:
        await engine.dispose()

    return output


async def spec_to_meta_dict(spec: ProductFilterSpec) -> dict[str, Any]:
    """Meta cho UI/debug, kèm nhãn đọc được."""
    meta = spec.to_meta_dict()
    catalog = await get_product_catalog_cached()
    if spec.use_ids:
        id_to_name = {u["id"]: u["name"] for u in catalog.get("uses", [])}
        meta["use_labels"] = [id_to_name.get(uid, str(uid)) for uid in spec.use_ids]
    if spec.category_slug:
        for c in catalog.get("categories", []):
            if c.get("slug") == spec.category_slug:
                meta["category_label"] = c.get("name")
                break
    return meta


async def search_products_db(
    message: str,
    conversation_context: Optional[str] = None,
) -> tuple[list[dict], dict[str, Any]]:
    """Parse filters + query DB — entry point cho recommend."""
    spec = await parse_product_filters(message, conversation_context=conversation_context)
    products = await query_products_by_filters(spec)
    return products, await spec_to_meta_dict(spec)
