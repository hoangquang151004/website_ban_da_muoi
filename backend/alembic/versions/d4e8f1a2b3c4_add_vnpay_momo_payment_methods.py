"""add vnpay and momo payment methods

Revision ID: d4e8f1a2b3c4
Revises: 9a89433413dd
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op

revision: str = "d4e8f1a2b3c4"
down_revision: Union[str, None] = "c7f8a3d91e10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE orders MODIFY COLUMN payment_method "
        "ENUM('cod', 'bank_transfer', 'vnpay', 'momo') NOT NULL"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE orders SET payment_method = 'bank_transfer' "
        "WHERE payment_method IN ('vnpay', 'momo')"
    )
    op.execute(
        "ALTER TABLE orders MODIFY COLUMN payment_method "
        "ENUM('cod', 'bank_transfer') NOT NULL"
    )
