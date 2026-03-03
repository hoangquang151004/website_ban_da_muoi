# Import tất cả models để Alembic (env.py) nhận diện khi autogenerate migration
from app.models.user import User, UserRole  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.use import Use, product_uses  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.stock_log import StockLog, StockLogReason  # noqa: F401

__all__ = [
    "User",
    "UserRole",
    "Category",
    "Use",
    "product_uses",
    "Product",
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentMethod",
    "Review",
    "StockLog",
    "StockLogReason",
]
