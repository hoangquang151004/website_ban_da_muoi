"""
product_search.py — LangChain Tool tìm kiếm sản phẩm kết hợp Vector + SQL.
"""

from __future__ import annotations

from typing import Optional

from langchain_core.tools import tool

from app.services.ai_agent.vector_store import similarity_search


@tool
async def product_search_tool(
    query: str,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    use_id: Optional[int] = None,
) -> str:
    """Tìm kiếm sản phẩm đèn đá muối phù hợp với yêu cầu của khách hàng.

    Kết hợp Vector Search ngữ nghĩa (ChromaDB) và SQL Filter (giá, tồn kho, công dụng).

    Args:
        query: Mô tả yêu cầu của khách hàng (VD: "đèn ngủ thư giãn")
        max_price: Giá tối đa (VND)
        min_price: Giá tối thiểu (VND)
        use_id: ID công dụng cụ thể (nếu đã biết)

    Returns:
        Chuỗi mô tả danh sách sản phẩm phù hợp để LLM đọc và trình bày
    """
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker, selectinload
    from sqlalchemy import select, and_
    from app.core.config import settings
    from app.models.product import Product
    from app.models.use import Use

    # 1. Vector search để lấy product_ids ứng viên
    filter_kwargs = {"category": "product"}
    vector_docs = similarity_search(query, k=10, filter=filter_kwargs)
    candidate_product_ids = [
        doc.metadata["product_id"]
        for doc in vector_docs
        if "product_id" in doc.metadata
    ]

    # 2. Nếu không có use_id, thử suy luận từ ChromaDB (tìm use gần nghĩa)
    inferred_use_id = use_id
    if inferred_use_id is None:
        use_docs = similarity_search(query, k=3, filter={"category": "use"})
        if use_docs:
            inferred_use_id = use_docs[0].metadata.get("use_id")

    # 3. SQL filter
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    results = []
    async with async_session() as session:
        conditions = [
            Product.is_active == True,
            Product.stock > 0,
        ]
        if max_price is not None:
            conditions.append(Product.price <= max_price)
        if min_price is not None:
            conditions.append(Product.price >= min_price)

        query_obj = (
            select(Product)
            .where(and_(*conditions))
            .options(selectinload(Product.uses))
            .order_by(Product.is_featured.desc(), Product.id)
            .limit(10)
        )

        if inferred_use_id is not None:
            from app.models.use import product_uses
            query_obj = (
                select(Product)
                .join(product_uses, Product.id == product_uses.c.product_id)
                .where(and_(*conditions, product_uses.c.use_id == inferred_use_id))
                .options(selectinload(Product.uses))
                .order_by(Product.is_featured.desc(), Product.id)
                .limit(10)
            )

        db_result = await session.execute(query_obj)
        db_products = db_result.scalars().all()

        # Fallback: nếu lọc theo use quá hẹp, bổ sung thêm sản phẩm chung
        if inferred_use_id is not None and len(db_products) < 3:
            fallback_query = (
                select(Product)
                .where(and_(*conditions))
                .options(selectinload(Product.uses))
                .order_by(Product.is_featured.desc(), Product.id)
                .limit(10)
            )
            fallback_result = await session.execute(fallback_query)
            fallback_products = fallback_result.scalars().all()

            existing_ids = {p.id for p in db_products}
            db_products.extend([p for p in fallback_products if p.id not in existing_ids])

        # Ưu tiên sản phẩm trong Vector Search candidates
        sorted_products = sorted(
            db_products,
            key=lambda p: (
                0 if p.id in candidate_product_ids else 1,
                not p.is_featured,
            ),
        )

        for p in sorted_products[:3]:
            uses_text = ", ".join(u.name for u in p.uses) if p.uses else "Đa công dụng"
            results.append(
                f"- ID:{p.id} | {p.name} | Giá: {int(p.price):,}đ | "
                f"Còn: {p.stock} cái | Công dụng: {uses_text}"
            )

    await engine.dispose()

    if not results:
        return "Không tìm thấy sản phẩm phù hợp với yêu cầu."

    header = f"Tìm thấy {len(results)} sản phẩm phù hợp:\n"
    if inferred_use_id:
        header = f"Sản phẩm liên quan đến công dụng (use_id={inferred_use_id}):\n"
    return header + "\n".join(results)


async def search_products_structured(
    query: str,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    use_id: Optional[int] = None,
) -> list[dict]:
    """Phiên bản trả về list[dict] cho API /recommend endpoint."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker, selectinload
    from sqlalchemy import select, and_
    from app.core.config import settings
    from app.models.product import Product
    from app.models.use import product_uses

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

    output = []
    async with async_session() as session:
        conditions = [Product.is_active == True, Product.stock > 0]
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

        # Fallback: nếu lọc theo use quá hẹp, bổ sung thêm sản phẩm chung
        if inferred_use_id is not None and len(products) < 6:
            fallback_query = (
                select(Product)
                .where(and_(*conditions))
                .options(selectinload(Product.uses))
                .order_by(Product.is_featured.desc())
                .limit(10)
            )
            fallback_result = await session.execute(fallback_query)
            fallback_products = fallback_result.scalars().all()

            existing_ids = {p.id for p in products}
            products.extend([p for p in fallback_products if p.id not in existing_ids])

        sorted_products = sorted(
            products,
            key=lambda p: (0 if p.id in candidate_product_ids else 1, not p.is_featured),
        )

        for p in sorted_products[:6]:
            short_description = (p.description[:120] + "...") if p.description and len(p.description) > 120 else p.description
            output.append({
                "id": p.id,
                "name": p.name,
            "slug": p.slug,
                "price": float(p.price),
                "original_price": float(p.original_price) if p.original_price else None,
                "image_url": p.image_url,
                "stock": p.stock,
                "short_description": short_description,
                "uses": [{"id": u.id, "name": u.name} for u in p.uses],
            })

    await engine.dispose()
    return output
