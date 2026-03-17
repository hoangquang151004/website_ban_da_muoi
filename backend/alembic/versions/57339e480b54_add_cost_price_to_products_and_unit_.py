"""add_cost_price_to_products_and_unit_cost_to_stock_logs

Revision ID: 57339e480b54
Revises: 18c19ca84eca
Create Date: 2026-03-11 23:15:48.836283

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '57339e480b54'
down_revision: Union[str, None] = '18c19ca84eca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('cost_price', sa.Numeric(10, 2), nullable=True))
    op.add_column('stock_logs', sa.Column('unit_cost', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column('stock_logs', 'unit_cost')
    op.drop_column('products', 'cost_price')
