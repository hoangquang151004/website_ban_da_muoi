"""
product_db_search.py — Tìm sản phẩm qua MySQL với bộ lọc AND/OR (DB-first).
"""

from __future__ import annotations

import logging
import re
import time
import unicodedata
from typing import Any, Literal, Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload, sessionmaker

from app.core.config import settings
from app.db.session import AsyncSessionLocal
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

    @field_validator("use_ids", mode="before")
    @classmethod
    def normalize_use_ids(cls, v: Any) -> list[int]:
        if not v:
            return []
        if isinstance(v, (int, str)):
            v = [v]
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


_FILTER_PARSE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """Bạn phân tích yêu cầu tìm/gợi ý sản phẩm đèn đá muối Himalaya.
Trả về JSON với các trường:
- max_price, min_price (VND, số thực). "500k" -> 500000, "1.5 triệu" -> 1500000
- Khoảng giá: "từ 1 triệu đến 1 triệu 5" -> min_price 1000000, max_price 1500000
  ("1 triệu 5" = 1,5 triệu = 1500000 VND). "một triệu rưỡi" -> 1500000
- "dưới/tầm 5 triệu" -> max_price 5000000. "lớn hơn/trên 5 triệu" -> min_price 5000000 (KHÔNG max)
- "nhỏ hơn 3 triệu" -> max_price; "cao hơn / ít nhất 2 triệu" -> min_price
- use_ids: list id công dụng khớp catalog (chỉ id có trong catalog)
- use_match: "any" nếu khách dùng "hoặc"/"hay"; "all" nếu "và"/"cả"/"đồng thời"
- category_slug: slug danh mục nếu khớp catalog
- keywords: từ khóa tìm trong tên/mô tả (bỏ từ thừa: gợi ý, tư vấn)
- Nếu khách nêu TÊN SẢN PHẨM CỤ THỂ (vd "sản phẩm Đèn đá muối tự nhiên dài"):
  đặt keywords là CẢ cụm tên (giữ nguyên), keyword_match "all", KHÔNG đoán category_slug
- keyword_match: "any" hoặc "all" (mặc định any)
- featured_only: true nếu hỏi nổi bật/bán chạy
- sort_by: price_asc | price_desc | newest | featured

Catalog:
{catalog}""",
    ),
    ("human", "Yêu cầu khách: {message}"),
])


def _strip_accents(text: str) -> str:
    """Lowercase + bỏ dấu; đ/Đ -> d (NFD không tách được chữ đơn tiếng Việt)."""
    text = (text or "").lower().replace("đ", "d").replace("Đ", "d")
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _triệu_groups_to_vnd(base: str, trailing_digit: Optional[str] = None) -> float:
    """Chuyển '1' + trailing '5' -> 1.5 triệu VND."""
    amount = float(base.replace(",", "."))
    if trailing_digit and len(trailing_digit) == 1:
        amount += int(trailing_digit) / 10
    return amount * 1_000_000


def parse_vnd_amount(fragment: str) -> Optional[float]:
    """Parse một mẩu giá: 500k, 1.5 triệu, 1 triệu 5, 1500000."""
    raw = (fragment or "").strip().lower()
    if not raw:
        return None
    norm = _strip_accents(raw)

    k_match = re.search(r"(\d+(?:[.,]\d+)?)\s*k\b", norm)
    if k_match:
        return float(k_match.group(1).replace(",", ".")) * 1000

    trieu_match = re.search(
        r"(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b",
        norm,
    )
    if trieu_match:
        return _triệu_groups_to_vnd(trieu_match.group(1), trieu_match.group(2))

    if "ruoi" in norm or "rưỡi" in raw:
        ruoi = re.search(r"(\d+(?:[.,]\d+)?)\s*trieu", norm)
        if ruoi:
            base = float(ruoi.group(1).replace(",", "."))
            return (base + 0.5) * 1_000_000

    vnd_match = re.search(r"(\d{4,})\s*(?:dong|vnd|d)?\b", norm)
    if vnd_match:
        return float(vnd_match.group(1))

    return None


def extract_price_range_from_text(text: str) -> tuple[Optional[float], Optional[float]]:
    """Trích khoảng giá min/max từ câu (từ X đến Y)."""
    norm = _strip_accents(text or "")

    range_patterns = [
        # từ 1 triệu đến 1 triệu 5
        re.compile(
            r"tu\s*"
            r"(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\s*"
            r"den\s*"
            r"(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?",
            re.IGNORECASE,
        ),
        # khoang 1 trieu den 1.5 trieu
        re.compile(
            r"khoang\s*"
            r"(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\s*"
            r"den\s*"
            r"(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?",
            re.IGNORECASE,
        ),
        # tu 1000k den 1500k
        re.compile(
            r"tu\s*(\d+(?:[.,]\d+)?)\s*k\s*den\s*(\d+(?:[.,]\d+)?)\s*k",
            re.IGNORECASE,
        ),
        # generic: tu {fragment} den {fragment} (fallback)
        re.compile(
            r"tu\s*(.+?)\s*den\s*(.+?)(?:\s|$|[,.])",
            re.IGNORECASE,
        ),
    ]

    for idx, pattern in enumerate(range_patterns):
        match = pattern.search(norm)
        if not match:
            continue
        if idx < 2:
            min_v = _triệu_groups_to_vnd(match.group(1), match.group(2))
            max_v = _triệu_groups_to_vnd(match.group(3), match.group(4))
            return min_v, max_v
        if idx == 2:
            min_v = float(match.group(1).replace(",", ".")) * 1000
            max_v = float(match.group(2).replace(",", ".")) * 1000
            return min_v, max_v
        min_v = parse_vnd_amount(match.group(1))
        max_v = parse_vnd_amount(match.group(2))
        if min_v is not None and max_v is not None:
            return min_v, max_v

    return None, None


def _has_price_range_marker(text: str) -> bool:
    """Phát hiện khoảng giá — tránh nhầm 'đèn' -> 'den' sau khi bỏ dấu."""
    norm = _strip_accents(text or "")
    return bool(
        re.search(r"trieu\s+den\s+", norm)
        or re.search(r"\d\s*k\s+den\s+", norm)
        or re.search(r"\btu\s+\d", norm)
        and re.search(r"\sden\s+\d", norm)
        or " - " in norm
    )


def _has_min_price_marker(text: str) -> bool:
    """Câu yêu cầu giá tối thiểu (lớn hơn / trên / từ X) — không parse X triệu thành max."""
    if _has_price_range_marker(text):
        return False
    norm = _strip_accents(text or "")
    return bool(
        re.search(
            r"(?:lon\s+hon|lon\s+hon\s+hon|cao\s+hon|it\s+nhat|hang\s+tren|tren\s+gia)"
            r"|\btren\s+\d"
            r"|\btu\s+\d+(?:\s*k|\s*trieu)",
            norm,
        )
    )


def _looks_like_price_filter_fragment(text: str) -> bool:
    """Đoạn sau 'sản phẩm' chỉ mô tả giá — không phải tên SP."""
    fragment = (text or "").strip()
    if not fragment:
        return False
    spec = merge_price_fallback(ProductFilterSpec(), fragment)
    if spec.min_price is None and spec.max_price is None:
        return False
    norm = _strip_accents(fragment)
    productish = re.search(
        r"\b(den\s+da|da\s+muoi|den\s+muoi|himalaya|hinh\s|khoi\s|tu\s+nhiên|tu\s+nhiên)",
        norm,
    )
    return productish is None


def extract_max_price_from_text(text: str) -> Optional[float]:
    if _has_price_range_marker(text) or _has_min_price_marker(text):
        return None
    patterns = [
        (r"duoi\s*(\d+)\s*k\b", 1000),
        (r"tam\s*(\d+)\s*k\b", 1000),
        (r"khoang\s*(\d+)\s*k\b", 1000),
        (r"nho\s+hon\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"nho\s+hon\s*(\d+)\s*k\b", 1000),
        (r"duoi\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"tam\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"(\d{3,})\s*(?:dong|vnd|d)\b", 1),
    ]
    lower = _strip_accents(text or "")
    for pattern, multiplier in patterns:
        if multiplier == "trieu":
            match = re.search(pattern, lower)
            if match:
                return _triệu_groups_to_vnd(match.group(1), match.group(2))
            continue
        match = re.search(pattern, lower)
        if match:
            val = float(match.group(1).replace(",", "."))
            if isinstance(multiplier, int) and (val < 10000 or "k" in pattern):
                return val * multiplier
            return val
    return None


def extract_min_price_from_text(text: str) -> Optional[float]:
    if _has_price_range_marker(text):
        return None
    patterns = [
        (r"lon\s+hon\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"lon\s+hon\s*(\d+)\s*k\b", 1000),
        (r"cao\s+hon\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"cao\s+hon\s*(\d+)\s*k\b", 1000),
        (r"it\s+nhat\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"it\s+nhat\s*(\d+)\s*k\b", 1000),
        (r"tren\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
        (r"tren\s*(\d+)\s*k\b", 1000),
        (r"tu\s*(\d+)\s*k\b", 1000),
        (r"tu\s*(\d+(?:[.,]\d+)?)\s*trieu(?:\s*(\d))?\b", "trieu"),
    ]
    lower = _strip_accents(text or "")
    for pattern, multiplier in patterns:
        if multiplier == "trieu":
            match = re.search(pattern, lower)
            if match:
                return _triệu_groups_to_vnd(match.group(1), match.group(2))
            continue
        match = re.search(pattern, lower)
        if match:
            return float(match.group(1)) * multiplier
    return None


def merge_price_fallback(spec: ProductFilterSpec, message: str) -> ProductFilterSpec:
    min_r, max_r = extract_price_range_from_text(message)
    if min_r is not None:
        spec.min_price = min_r
    if max_r is not None:
        spec.max_price = max_r

    if spec.max_price is None:
        spec.max_price = extract_max_price_from_text(message)
    if spec.min_price is None:
        spec.min_price = extract_min_price_from_text(message)

    if spec.min_price is not None and spec.max_price is not None:
        if spec.min_price > spec.max_price:
            spec.min_price, spec.max_price = spec.max_price, spec.min_price

    if spec.max_price is not None and spec.sort_by is None:
        spec.sort_by = "price_asc"
    if spec.min_price is not None and spec.max_price is None and spec.sort_by is None:
        spec.sort_by = "price_desc"
    return spec


_PRODUCT_NAME_HINT_PATTERNS = [
    re.compile(
        r"(?:tư\s*vấn|tu\s*van|gợi\s*ý|goi\s*y)"
        r"(?:\s+cho\s+(?:tôi|toi))?"
        r"(?:\s+(?:về|ve))?"
        r"\s*(?:sản\s*phẩm|san\s*phẩm|san\s*pham)?\s*(.+)$",
        re.IGNORECASE | re.UNICODE,
    ),
    re.compile(r"sản\s*phẩm\s+(.+)$", re.IGNORECASE | re.UNICODE),
    re.compile(
        r"(?:tìm|tim)\s+(?:giúp|giup\s+)?(?:đèn|den|sản\s*phẩm|san\s*pham)\s+(.+)$",
        re.IGNORECASE | re.UNICODE,
    ),
]


def extract_product_name_hint(message: str) -> Optional[str]:
    """Trích tên SP cụ thể từ câu tư vấn (vd. sau 'sản phẩm ...')."""
    raw = (message or "").strip()
    if not raw:
        return None
    for pattern in _PRODUCT_NAME_HINT_PATTERNS:
        match = pattern.search(raw)
        if not match:
            continue
        hint = match.group(1).strip(" ?.!,;:")
        if len(hint) >= 4 and not _looks_like_price_filter_fragment(hint):
            return hint
    return None


def _score_product_name_match(product_name: str, name_hint: str) -> int:
    """Điểm khớp tên — ưu tiên trùng khít / dài hơn (tự nhiên dài > tự nhiên)."""
    pn = _strip_accents(product_name or "")
    h = _strip_accents(name_hint or "")
    if not pn or not h:
        return 0
    if pn == h:
        return 10_000
    if pn.startswith(h):
        return 8_000 - abs(len(pn) - len(h))
    if h.startswith(pn):
        return 7_000 - abs(len(pn) - len(h))
    if h in pn:
        return 5_000 - abs(len(pn) - len(h))
    if pn in h:
        return 4_000
    hint_tokens = [t for t in h.split() if len(t) >= 2]
    if hint_tokens and all(t in pn for t in hint_tokens):
        return 3_000 - len(hint_tokens)
    return 0


def _sort_products_by_name_hint(products: list[dict], name_hint: str) -> list[dict]:
    return sorted(
        products,
        key=lambda p: _score_product_name_match(p.get("name", ""), name_hint),
        reverse=True,
    )


async def search_products_by_name_hint(
    name_hint: str,
    *,
    limit: Optional[int] = None,
) -> list[dict]:
    """Tìm SP theo tên — ưu tiên khớp chính xác, không lọc category sai."""
    cap = limit if limit is not None else settings.PRODUCT_RECOMMEND_LIMIT
    output: list[dict] = []

    async with AsyncSessionLocal() as session:
        base = and_(
            Product.is_active == True,  # noqa: E712
            Product.stock > 0,
        )

        query = (
            select(Product)
            .where(base, Product.name.ilike(f"%{name_hint}%"))
            .options(selectinload(Product.uses))
            .limit(50)
        )
        result = await session.execute(query)
        products = list(result.scalars().unique().all())

        if not products:
            words = [w for w in re.split(r"\s+", name_hint.strip()) if len(w) >= 2]
            if len(words) >= 2:
                name_conds = and_(
                    *[Product.name.ilike(f"%{w}%") for w in words],
                )
                query = (
                    select(Product)
                    .where(base, name_conds)
                    .options(selectinload(Product.uses))
                    .limit(50)
                )
                result = await session.execute(query)
                products = list(result.scalars().unique().all())

        ranked = _sort_products_by_name_hint(
            [product_to_dict(p) for p in products],
            name_hint,
        )
        output = ranked[:cap]

    return output


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


async def _get_async_session():
    """Legacy wrapper — dùng AsyncSessionLocal dùng chung thay vì tạo engine mới."""
    return None, AsyncSessionLocal


async def load_product_catalog() -> dict[str, Any]:
    async with AsyncSessionLocal() as session:
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


_catalog_cache: dict[str, Any] = {"data": None, "expires_at": 0.0}


async def get_product_catalog_cached(ttl_seconds: int = 300) -> dict[str, Any]:
    now = time.time()
    if _catalog_cache["data"] is not None and now < _catalog_cache["expires_at"]:
        return _catalog_cache["data"]
    data = await load_product_catalog()
    _catalog_cache["data"] = data
    _catalog_cache["expires_at"] = now + ttl_seconds
    return data


async def get_dynamic_use_keywords() -> list[str]:
    import unicodedata
    import re
    catalog = await get_product_catalog_cached()
    keywords = set()
    for u in catalog.get("uses", []):
        name = u["name"].lower()
        parts = re.split(r'[\&,\-\/]', name)
        for p in parts:
            p = p.strip()
            if not p:
                continue
            keywords.add(p)
            norm_p = unicodedata.normalize("NFD", p)
            unacc_p = "".join(c for c in norm_p if unicodedata.category(c) != "Mn").replace("đ", "d")
            keywords.add(unacc_p)
            
            if "ngủ" in p:
                keywords.update(["ngủ", "ngu", "giấc ngủ", "giac ngu", "ngủ ngon", "ngu ngon"])
            if "thư giãn" in p:
                keywords.update(["thư giãn", "thu gian", "relax"])
            if "stress" in p:
                keywords.update(["giảm stress", "giam stress", "stress"])
            if "lọc" in p:
                keywords.update(["thanh lọc", "thanh loc", "lọc không khí", "loc khong khi"])
            if "phong thuỷ" in p or "phong thủy" in p:
                keywords.update(["phong thủy", "phong thuy", "feng shui"])
            if "thiền" in p:
                keywords.update(["thiền", "thien", "meditation"])
            if "yoga" in p:
                keywords.add("yoga")
            if "sức khỏe" in p or "khoẻ" in p:
                keywords.update(["sức khỏe", "suc khoe", "healthy"])
            if "trang trí" in p:
                keywords.update(["trang trí", "trang tri", "decor"])
                
    return list(keywords)


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

    name_hint = extract_product_name_hint(message)
    keywords = parsed.keywords
    keyword_match = parsed.keyword_match
    if name_hint:
        keywords = [name_hint]
        keyword_match = "all"
        category_slug = None

    spec = ProductFilterSpec(
        max_price=parsed.max_price,
        min_price=parsed.min_price,
        use_ids=use_ids,
        use_match=parsed.use_match,
        category_slug=category_slug,
        keywords=keywords,
        keyword_match=keyword_match,
        featured_only=parsed.featured_only,
        sort_by=parsed.sort_by,
        limit=settings.PRODUCT_RECOMMEND_LIMIT,
    )
    return merge_price_fallback(spec, message)


async def query_products_by_filters(spec: ProductFilterSpec) -> list[dict]:
    async with AsyncSessionLocal() as session:
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

        # Đọc xong dữ liệu trong khi session còn mở
        output = [product_to_dict(p) for p in products]
        fallback_sort = sort_by or "featured"

    if not output:
        # Fallback 1: Drop keywords but keep use_ids and other filters
        if spec.keywords:
            relaxed_keywords = ProductFilterSpec(
                max_price=spec.max_price,
                min_price=spec.min_price,
                use_ids=spec.use_ids,
                use_match=spec.use_match,
                category_slug=spec.category_slug,
                featured_only=spec.featured_only,
                sort_by=fallback_sort,
                limit=spec.limit,
            )
            return await query_products_by_filters(relaxed_keywords)
            
        # Fallback 2: Drop use_ids if it still fails (or if there were no keywords to begin with)
        if spec.use_ids:
            relaxed_uses = ProductFilterSpec(
                max_price=spec.max_price,
                min_price=spec.min_price,
                category_slug=spec.category_slug,
                featured_only=spec.featured_only,
                sort_by=fallback_sort,
                limit=spec.limit,
            )
            return await query_products_by_filters(relaxed_uses)

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
    name_hint = extract_product_name_hint(message)
    if name_hint:
        direct = await search_products_by_name_hint(name_hint)
        if direct:
            spec = ProductFilterSpec(
                keywords=[name_hint],
                keyword_match="all",
                limit=settings.PRODUCT_RECOMMEND_LIMIT,
            )
            meta = await spec_to_meta_dict(spec)
            meta["name_hint"] = name_hint
            meta["match_mode"] = "product_name"
            return direct, meta

    spec = await parse_product_filters(message, conversation_context=conversation_context)
    products = await query_products_by_filters(spec)
    if name_hint and products:
        products = _sort_products_by_name_hint(products, name_hint)
    meta = await spec_to_meta_dict(spec)
    if name_hint:
        meta["name_hint"] = name_hint
    return products, meta
