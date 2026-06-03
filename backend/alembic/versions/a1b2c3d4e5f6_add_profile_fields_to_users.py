"""add_profile_fields_to_users

Revision ID: a1b2c3d4e5f6
Revises: 9a89433413dd
Create Date: 2026-03-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '57339e480b54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'date_of_birth' not in columns:
        op.add_column('users', sa.Column('date_of_birth', sa.Date(), nullable=True))
    if 'gender' not in columns:
        op.add_column('users', sa.Column('gender', sa.String(length=10), nullable=True))
    if 'avatar_url' not in columns:
        op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))
    if 'ward' not in columns:
        op.add_column('users', sa.Column('ward', sa.String(length=100), nullable=True))
    if 'district' not in columns:
        op.add_column('users', sa.Column('district', sa.String(length=100), nullable=True))
    if 'city' not in columns:
        op.add_column('users', sa.Column('city', sa.String(length=100), nullable=True))
    if 'postal_code' not in columns:
        op.add_column('users', sa.Column('postal_code', sa.String(length=20), nullable=True))
    if 'address_note' not in columns:
        op.add_column('users', sa.Column('address_note', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'ward')
    op.drop_column('users', 'district')
    op.drop_column('users', 'city')
    op.drop_column('users', 'postal_code')
    op.drop_column('users', 'address_note')
