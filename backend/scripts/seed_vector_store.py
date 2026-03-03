"""
seed_vector_store.py — Script chạy một lần để nạp kiến thức vào ChromaDB.

Chạy: python scripts/seed_vector_store.py
(từ thư mục backend/)
"""

from __future__ import annotations

import asyncio
import os
import sys

# Thêm backend/ vào sys.path để import app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_core.documents import Document

# Load .env trước khi import settings
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from app.services.ai_agent.vector_store import upsert_documents

# ---------------------------------------------------------------------------
# 1. Kiến thức cứng về sức khỏe và phong thủy (hardcoded)
# ---------------------------------------------------------------------------
KNOWLEDGE_DOCS: list[Document] = [
    Document(
        page_content=(
            "Đèn đá muối Himalaya có tác dụng lọc không khí, ion hóa không gian sống, "
            "giúp trung hòa bức xạ điện từ từ các thiết bị điện tử. "
            "Ánh sáng ấm dịu từ đèn giúp thư giãn thần kinh, giảm căng thẳng và lo âu."
        ),
        metadata={"doc_id": "knowledge_001", "category": "health", "title": "Tác dụng lọc không khí"},
    ),
    Document(
        page_content=(
            "Đèn đá muối himalaya giúp cải thiện chất lượng giấc ngủ. "
            "Ánh sáng đỏ cam từ đèn kích thích cơ thể tiết melatonin — hormone điều hòa giấc ngủ, "
            "giúp người dùng dễ ngủ hơn và ngủ sâu hơn. Thích hợp đặt trong phòng ngủ."
        ),
        metadata={"doc_id": "knowledge_002", "category": "health", "title": "Cải thiện giấc ngủ"},
    ),
    Document(
        page_content=(
            "Đèn đá muối Himalaya phát ra ion âm giúp cải thiện tâm trạng, "
            "giảm triệu chứng trầm cảm theo mùa và tăng sức đề kháng. "
            "Đặc biệt tốt cho người làm việc trong môi trường điều hòa, ít tiếp xúc thiên nhiên."
        ),
        metadata={"doc_id": "knowledge_003", "category": "health", "title": "Ion âm và tâm trạng"},
    ),
    Document(
        page_content=(
            "Đèn đá muối himalaya có tác dụng trị liệu cho người bị hen suyễn, "
            "viêm mũi dị ứng, và các bệnh về đường hô hấp. "
            "Muối himalaya khi được làm nóng giải phóng các ion natri giúp làm sạch không khí."
        ),
        metadata={"doc_id": "knowledge_004", "category": "health", "title": "Hỗ trợ hô hấp"},
    ),
    Document(
        page_content=(
            "Người bị mất ngủ có thể dùng đèn đá muối Himalaya đặt trong phòng ngủ. "
            "Ánh sáng cam dịu không gây kích thích não bộ như ánh sáng xanh từ màn hình điện thoại. "
            "Nên bật đèn 30 phút trước khi đi ngủ để não bộ được thư giãn."
        ),
        metadata={"doc_id": "knowledge_005", "category": "health", "title": "Điều trị mất ngủ"},
    ),
    Document(
        page_content=(
            "Theo phong thủy, đèn đá muối himalaya màu cam/hổ phách mang năng lượng Thổ, "
            "giúp tăng cường sự ổn định và vận tài lộc. "
            "Nên đặt ở phòng khách, phòng làm việc hoặc góc tài lộc của căn nhà."
        ),
        metadata={"doc_id": "knowledge_006", "category": "fengshui", "title": "Phong thủy màu hổ phách"},
    ),
    Document(
        page_content=(
            "Đèn đá muối himalaya màu hồng phong thủy tượng trưng cho tình yêu và sức khỏe. "
            "Đặt trong phòng ngủ hoặc phòng của trẻ em giúp tạo không gian nhẹ nhàng, ấm áp. "
            "Màu hồng kết hợp ánh sáng dịu giúp thư giãn và thu hút năng lượng tích cực."
        ),
        metadata={"doc_id": "knowledge_007", "category": "fengshui", "title": "Phong thủy màu hồng"},
    ),
    Document(
        page_content=(
            "Đèn đá muối himalaya màu trắng/xám thích hợp phong thủy Kim, "
            "tăng cường sự minh mẫn và tập trung. Đặt trong phòng học hoặc văn phòng. "
            "Ánh sáng trắng giúp tăng hiệu quả làm việc và học tập."
        ),
        metadata={"doc_id": "knowledge_008", "category": "fengshui", "title": "Phong thủy màu trắng"},
    ),
    Document(
        page_content=(
            "Vị trí đặt đèn đá muối tốt nhất: "
            "- Phòng ngủ: giúp ngủ ngon, tạo không gian thư giãn. "
            "- Phòng khách: cân bằng năng lượng, trang trí đẹp. "
            "- Bàn làm việc: giảm bức xạ từ máy tính, tăng tập trung. "
            "- Phòng thiền/yoga: tăng cường năng lượng thanh tịnh. "
            "Nên đặt gần thiết bị điện tử để trung hòa bức xạ điện từ."
        ),
        metadata={"doc_id": "knowledge_009", "category": "fengshui", "title": "Vị trí đặt đèn"},
    ),
    Document(
        page_content=(
            "Cách bảo quản đèn đá muối Himalaya: "
            "- Không để đèn ở nơi ẩm ướt vì muối sẽ tan chảy. "
            "- Lau đèn bằng khăn khô, tránh dùng nước. "
            "- Khi không dùng, nên bọc đèn trong túi nilon hoặc để trong hộp kín. "
            "- Bóng đèn cần thay định kỳ mỗi 1-2 năm."
        ),
        metadata={"doc_id": "knowledge_010", "category": "care", "title": "Cách bảo quản"},
    ),
]

# ---------------------------------------------------------------------------
# 2. Nạp dữ liệu Uses từ MySQL
# ---------------------------------------------------------------------------
async def seed_uses_from_db() -> list[Document]:
    """Đọc tất cả Uses từ MySQL và tạo Document cho mỗi use."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from app.core.config import settings
    from app.models.use import Use

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    docs = []
    async with async_session() as session:
        result = await session.execute(select(Use).where(Use.is_active == True))
        uses = result.scalars().all()
        for use in uses:
            text = f"Công dụng: {use.name}"
            if use.description:
                text += f". {use.description}"
            docs.append(Document(
                page_content=text,
                metadata={
                    "doc_id": f"use_{use.id}",
                    "category": "use",
                    "use_id": use.id,
                    "use_name": use.name,
                    "title": use.name,
                },
            ))
    await engine.dispose()
    return docs


# ---------------------------------------------------------------------------
# 3. Nạp mô tả sản phẩm từ MySQL
# ---------------------------------------------------------------------------
async def seed_products_from_db() -> list[Document]:
    """Đọc tất cả sản phẩm active từ MySQL và tạo Document."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.core.config import settings
    from app.models.product import Product

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    docs = []
    async with async_session() as session:
        result = await session.execute(
            select(Product)
            .where(Product.is_active == True)
            .options(selectinload(Product.uses))
        )
        products = result.scalars().all()
        for p in products:
            uses_text = ", ".join(u.name for u in p.uses) if p.uses else "Đa công dụng"
            text = (
                f"Sản phẩm: {p.name}. "
                f"Mô tả: {p.description}. "
                f"Giá: {int(p.price):,}đ. "
                f"Công dụng: {uses_text}. "
                f"Tồn kho: {'Còn hàng' if p.stock > 0 else 'Hết hàng'}."
            )
            docs.append(Document(
                page_content=text,
                metadata={
                    "doc_id": f"product_{p.id}",
                    "category": "product",
                    "product_id": p.id,
                    "product_name": p.name,
                    "price": float(p.price),
                    "stock": p.stock,
                    "title": p.name,
                },
            ))
    await engine.dispose()
    return docs


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
async def main() -> None:
    print("=== Bắt đầu seed Vector Store ===\n")

    # 1. Nạp kiến thức cứng
    print(f"[1/3] Nạp {len(KNOWLEDGE_DOCS)} documents kiến thức...")
    upsert_documents(KNOWLEDGE_DOCS)
    print("      ✓ Xong.\n")

    # 2. Nạp Uses từ DB
    print("[2/3] Nạp Uses từ MySQL...")
    try:
        use_docs = await seed_uses_from_db()
        if use_docs:
            upsert_documents(use_docs)
            print(f"      ✓ Nạp {len(use_docs)} uses.\n")
        else:
            print("      ⚠ Không tìm thấy use nào trong DB.\n")
    except Exception as e:
        print(f"      ✗ Lỗi khi đọc Uses: {e}\n")

    # 3. Nạp Products từ DB
    print("[3/3] Nạp sản phẩm từ MySQL...")
    try:
        product_docs = await seed_products_from_db()
        if product_docs:
            upsert_documents(product_docs)
            print(f"      ✓ Nạp {len(product_docs)} sản phẩm.\n")
        else:
            print("      ⚠ Không tìm thấy sản phẩm nào trong DB.\n")
    except Exception as e:
        print(f"      ✗ Lỗi khi đọc Products: {e}\n")

    print("=== Seed hoàn thành! ===")
    print(f"ChromaDB lưu tại: {os.path.abspath(os.environ.get('CHROMA_DB_PATH', './chroma_db'))}")


if __name__ == "__main__":
    asyncio.run(main())
