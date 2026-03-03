from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Bảng trung gian Many-to-Many giữa Product và Use
product_uses = Table(
    "product_uses",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("use_id", Integer, ForeignKey("uses.id", ondelete="CASCADE"), primary_key=True),
)


class Use(Base):
    __tablename__ = "uses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    products: Mapped[list["Product"]] = relationship(  # noqa: F821
        "Product", secondary=product_uses, back_populates="uses"
    )

    def __repr__(self) -> str:
        return f"<Use id={self.id} name={self.name}>"
