"""
product_search.py — LangChain tool + structured search cho chat recommend.

Mặc định DB-first (product_db_search). vector_legacy giữ cho rollback.
"""

from __future__ import annotations

from typing import Optional

from langchain_core.tools import tool

from app.core.config import settings


@tool
async def product_search_tool(
    query: str,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    use_id: Optional[int] = None,
) -> str:
    """Tìm kiếm sản phẩm đèn đá muối phù hợp với yêu cầu của khách hàng."""
    products = await search_products_structured(
        query=query,
        max_price=max_price,
        min_price=min_price,
        use_id=use_id,
    )
    if not products:
        return "Không tìm thấy sản phẩm phù hợp với yêu cầu."

    lines = [
        f"- ID:{p['id']} | {p['name']} | Giá: {int(p['price']):,}đ | Còn: {p['stock']} cái"
        for p in products
    ]
    return f"Tìm thấy {len(products)} sản phẩm phù hợp:\n" + "\n".join(lines)


async def search_products_structured(
    query: str,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    use_id: Optional[int] = None,
) -> list[dict]:
    """Trả về list[dict] cho API recommend / ordering."""
    if (settings.PRODUCT_SEARCH_MODE or "db").lower() == "vector_legacy":
        return await _search_products_vector_legacy(
            query=query,
            max_price=max_price,
            min_price=min_price,
            use_id=use_id,
        )

    from app.services.ai_agent.tools.product_db_search import (
        ProductFilterSpec,
        merge_price_fallback,
        parse_product_filters,
        query_products_by_filters,
        search_products_db,
    )

    if use_id is not None:
        spec = await parse_product_filters(query)
        if use_id not in spec.use_ids:
            spec.use_ids = [use_id, *spec.use_ids]
        spec = merge_price_fallback(spec, query)
        if max_price is not None:
            spec.max_price = max_price
        if min_price is not None:
            spec.min_price = min_price
        return await query_products_by_filters(spec)

    products, _spec = await search_products_db(query)
    if max_price is not None or min_price is not None:
        spec = _spec
        if max_price is not None:
            spec.max_price = max_price
        if min_price is not None:
            spec.min_price = min_price
        products = await query_products_by_filters(spec)
    return products


async def search_products_structured_with_meta(
    query: str,
    conversation_context: Optional[str] = None,
) -> tuple[list[dict], dict]:
    """Structured search kèm meta filters cho chat response."""
    from app.services.ai_agent.tools.product_db_search import search_products_db

    products, filter_meta = await search_products_db(
        query, conversation_context=conversation_context
    )
    return products, filter_meta


async def _search_products_vector_legacy(
    query: str,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    use_id: Optional[int] = None,
) -> list[dict]:
    """Legacy Vector + SQL (deprecated)."""
    from sqlalchemy import and_, select
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import selectinload, sessionmaker

    from app.models.product import Product
    from app.models.use import product_uses
    from app.services.ai_agent.vector_store import similarity_search

    filter_kwargs = {"category": "product"}
    vector_docs = similarity_search(query, k=10, filter=filter_kwargs)
    candidate_product_ids = [
        doc.metadata["product_id"]
        for doc in vector_docs
        if "product_id" in doc.metadata
    ]

    inferred_use_id = use_id
    if inferred_use_id is None:
        use_docs = similarity_search(query, k=3, filter={"category": "use"})
        if use_docs:
            inferred_use_id = use_docs[0].metadata.get("use_id")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from app.services.ai_agent.tools.product_db_search import product_to_dict

    output: list[dict] = []
    async with async_session() as session:
        conditions = [Product.is_active == True, Product.stock > 0]  # noqa: E712
        if max_price is not None:
            conditions.append(Product.price <= max_price)
        if min_price is not None:
            conditions.append(Product.price >= min_price)

        if inferred_use_id is not None:
            query_obj = (
                select(Product)
                .join(product_uses, Product.id == product_uses.c.product_id)
                .where(and_(*conditions, product_uses.c.use_id == inferred_use_id))
                .options(selectinload(Product.uses))
                .order_by(Product.is_featured.desc())
                .limit(10)
            )
        else:
            query_obj = (
                select(Product)
                .where(and_(*conditions))
                .options(selectinload(Product.uses))
                .order_by(Product.is_featured.desc())
                .limit(10)
            )

        db_result = await session.execute(query_obj)
        products = db_result.scalars().all()

        sorted_products = sorted(
            products,
            key=lambda p: (0 if p.id in candidate_product_ids else 1, not p.is_featured),
        )

        limit = settings.PRODUCT_RECOMMEND_LIMIT
        for p in sorted_products[:limit]:
            output.append(product_to_dict(p))

    await engine.dispose()
    return output
