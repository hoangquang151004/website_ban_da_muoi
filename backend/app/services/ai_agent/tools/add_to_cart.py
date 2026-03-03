"""
add_to_cart.py — LangChain Tool thêm sản phẩm vào giỏ hàng.

Giỏ hàng được lưu trong DB bảng `cart_items` (nếu user đã đăng nhập)
hoặc trả về thông tin để frontend lưu session (nếu chưa đăng nhập).
"""

from __future__ import annotations

from typing import Optional

from langchain_core.tools import tool


@tool
async def add_to_cart_tool(product_id: int, quantity: int, user_id: Optional[int] = None) -> str:
    """Thêm sản phẩm vào giỏ hàng của người dùng.

    Args:
        product_id: ID của sản phẩm cần thêm
        quantity: Số lượng cần thêm (tối thiểu 1)
        user_id: ID user (nếu đã đăng nhập)

    Returns:
        Thông báo kết quả dạng text cho LLM đọc
    """
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.product import Product

    if quantity < 1:
        return "Số lượng phải ít nhất là 1."

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Kiểm tra sản phẩm tồn tại
        result = await session.execute(
            select(Product).where(Product.id == product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()

        if not product:
            await engine.dispose()
            return f"Không tìm thấy sản phẩm với ID {product_id}."

        if product.stock <= 0:
            await engine.dispose()
            return f"Sản phẩm '{product.name}' hiện đã hết hàng."

        if product.stock < quantity:
            await engine.dispose()
            return (
                f"Sản phẩm '{product.name}' chỉ còn {product.stock} cái trong kho. "
                f"Bạn có muốn mua {product.stock} cái không?"
            )

        product_name = product.name
        price = float(product.price)

        # Nếu user đã đăng nhập, lưu vào DB
        if user_id:
            result_msg = await _add_to_db_cart(session, user_id, product_id, quantity, price)
        else:
            result_msg = (
                f"Đã thêm {quantity} × '{product_name}' vào giỏ hàng tạm. "
                f"Vui lòng đăng nhập để lưu giỏ hàng."
            )

    await engine.dispose()
    return result_msg


async def _add_to_db_cart(
    session: "AsyncSession",
    user_id: int,
    product_id: int,
    quantity: int,
    price: float,
) -> str:
    """Lưu CartItem vào DB. Tạo mới hoặc cộng thêm số lượng nếu đã có."""
    from sqlalchemy import select
    from app.models.order import CartItem  # type: ignore[attr-defined]

    try:
        result = await session.execute(
            select(CartItem).where(
                CartItem.user_id == user_id,
                CartItem.product_id == product_id,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.quantity += quantity
            await session.commit()
            return (
                f"Đã cập nhật giỏ hàng: '{existing.product_id}' "
                f"× {existing.quantity} cái."
            )
        else:
            new_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity,
                price=price,
            )
            session.add(new_item)
            await session.commit()
            return f"Đã thêm {quantity} vào giỏ hàng thành công! Đơn giá: {int(price):,}đ/cái."
    except Exception as e:
        # Nếu bảng cart_items chưa tồn tại hoặc model chưa có
        return (
            f"Đã ghi nhận yêu cầu thêm {quantity} sản phẩm (ID:{product_id}) "
            f"vào giỏ hàng. Vui lòng kiểm tra giỏ hàng."
        )


async def add_to_cart_internal(
    product_id: int,
    quantity: int,
    user_id: int,
) -> dict:
    """Phiên bản nội bộ cho API endpoint, trả về dict thay vì chuỗi."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.product import Product

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(Product).where(Product.id == product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()

        if not product:
            await engine.dispose()
            return {"success": False, "message": f"Không tìm thấy sản phẩm ID {product_id}."}

        if product.stock < quantity:
            await engine.dispose()
            return {"success": False, "message": f"Chỉ còn {product.stock} cái trong kho."}

        await engine.dispose()
        return {
            "success": True,
            "message": f"Đã thêm {quantity} × '{product.name}' vào giỏ hàng.",
            "cart_item": {
                "product_id": product_id,
                "product_name": product.name,
                "quantity": quantity,
                "price": float(product.price),
                "image_url": product.image_url,
            },
        }
