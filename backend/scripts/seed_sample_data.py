"""
seed_sample_data.py — Tạo dữ liệu mẫu cho dev/demo.
Chạy: python scripts/seed_sample_data.py
(từ thư mục backend/)
"""
import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.use import Use
from app.models.product import Product

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with AsyncSessionLocal() as session:
        # 1. Admin user
        admin = User(
            full_name="Admin",
            email="admin@damuoi.com",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
            is_active=True,
        )
        session.add(admin)

        # 2. Categories
        categories = [
            Category(name="Đèn đá muối tự nhiên", slug="den-da-muoi-tu-nhien",
                     description="Đèn làm từ đá muối nguyên khối Himalaya"),
            Category(name="Đèn ngủ đá muối", slug="den-ngu-da-muoi",
                     description="Ánh sáng ấm, thích hợp phòng ngủ"),
            Category(name="Đá muối chăm sóc sức khoẻ", slug="da-muoi-suc-khoe",
                     description="Sản phẩm tắm, ngâm chân từ đá muối"),
            Category(name="Đèn trang trí", slug="den-trang-tri",
                     description="Đa dạng hình dáng, thích hợp trang trí nội thất"),
        ]
        for c in categories:
            session.add(c)

        # 3. Uses (tags)
        uses = [
            Use(name="Phong thủy", icon="spa", color="amber",
                description="Thu hút tài lộc, bình an cho gia đình"),
            Use(name="Trị mất ngủ", icon="bedtime", color="blue",
                description="Ánh sáng cam dịu giúp ngủ ngon hơn"),
            Use(name="Lọc không khí", icon="air", color="emerald",
                description="Ion hóa không khí, khử khuẩn nhẹ"),
            Use(name="Thiền định", icon="self_improvement", color="purple",
                description="Tạo không gian yên tĩnh, tập trung"),
            Use(name="Hỗ trợ hô hấp", icon="air", color="teal",
                description="Giúp giảm triệu chứng viêm mũi dị ứng"),
        ]
        for u in uses:
            session.add(u)

        await session.commit()

        # 4. Products (cần category_id và use_id thực tế)
        # Refresh để lấy ID vừa insert
        await session.refresh(categories[0])
        await session.refresh(categories[1])
        await session.refresh(categories[2])
        await session.refresh(categories[3])

        products = [
            Product(
                name="Đèn đá muối tự nhiên size L",
                slug="den-da-muoi-tu-nhien-size-l",
                description="Đèn đá muối nguyên khối Himalaya, màu hổ phách tự nhiên, kèm đế gỗ.",
                price=850000,
                original_price=1100000,
                stock=45,
                is_featured=True,
                is_active=True,
                category_id=categories[0].id,
            ),
            Product(
                name="Đèn đá muối hình cầu",
                slug="den-da-muoi-hinh-cau",
                description="Đèn đá muối hình cầu, ánh sáng tỏa đều, phù hợp phòng khách.",
                price=1200000,
                original_price=None,
                stock=20,
                is_featured=True,
                is_active=True,
                category_id=categories[0].id,
            ),
            Product(
                name="Đèn ngủ đá muối hổ phách",
                slug="den-ngu-da-muoi-ho-phach",
                description="Nhỏ gọn, ánh cam ấm áp, giúp thư giãn trước giờ ngủ.",
                price=450000,
                original_price=550000,
                stock=60,
                is_featured=False,
                is_active=True,
                category_id=categories[1].id,
            ),
            Product(
                name="Đèn đá muối Kim tự tháp",
                slug="den-da-muoi-kim-tu-thap",
                description="Hình kim tự tháp phong thủy, năng lượng tích cực, trang trí bàn làm việc.",
                price=680000,
                original_price=None,
                stock=15,
                is_featured=False,
                is_active=True,
                category_id=categories[3].id,
            ),
            Product(
                name="Hộp ngâm chân đá muối Himalaya",
                slug="hop-ngam-chan-da-muoi",
                description="Thư giãn đôi chân sau ngày dài, kết hợp muối khoáng tự nhiên.",
                price=2200000,
                stock=12,
                is_active=True,
                category_id=categories[2].id,
            ),
        ]
        for p in products:
            session.add(p)

        await session.commit()
        print("✅ Seed hoàn thành!")
        print("   Admin: admin@damuoi.com / admin123")
        print(f"   {len(categories)} categories, {len(uses)} uses, {len(products)} products")


if __name__ == "__main__":
    asyncio.run(seed())
