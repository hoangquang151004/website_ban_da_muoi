"""add_cost_price_to_products_and_unit_cost_to_stock_logs

Revision ID: 57339e480b54
Revises: 18c19ca84eca
Create Date: 2026-03-11 23:15:48.836283

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '57339e480b54'
down_revision: Union[str, None] = '18c19ca84eca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Kiểm tra cột cost_price trong products
    prod_columns = [col['name'] for col in inspector.get_columns('products')]
    if 'cost_price' not in prod_columns:
        op.add_column('products', sa.Column('cost_price', sa.Numeric(10, 2), nullable=True))
        
    # Kiểm tra cột unit_cost trong stock_logs
    log_columns = [col['name'] for col in inspector.get_columns('stock_logs')]
    if 'unit_cost' not in log_columns:
        op.add_column('stock_logs', sa.Column('unit_cost', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column('stock_logs', 'unit_cost')
    op.drop_column('products', 'cost_price')
