from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Tạo async engine kết nối MySQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,        # In câu SQL ra console khi DEBUG=True
    pool_pre_ping=True,         # Tự kiểm tra kết nối trước khi dùng
    pool_recycle=3600,          # Tái sử dụng connection sau 1 giờ
)

# Session factory — dùng trong Dependency Injection (get_db)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
