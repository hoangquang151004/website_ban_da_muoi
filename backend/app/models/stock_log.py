import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StockLogReason(str, enum.Enum):
    purchase = "purchase"      # Xuất kho do bán hàng
    restock = "restock"        # Nhập kho
    adjustment = "adjustment"  # Điều chỉnh thủ công


class StockLog(Base):
    __tablename__ = "stock_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    change_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[StockLogReason] = mapped_column(Enum(StockLogReason), nullable=False)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    unit_cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="stock_logs")  # noqa: F821

    def __repr__(self) -> str:
        return (
            f"<StockLog id={self.id} product_id={self.product_id} "
            f"change={self.change_amount} reason={self.reason}>"
        )
