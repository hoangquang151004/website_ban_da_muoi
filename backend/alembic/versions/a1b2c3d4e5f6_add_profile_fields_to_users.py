"""add_profile_fields_to_users

Revision ID: a1b2c3d4e5f6
Revises: 9a89433413dd
Create Date: 2026-03-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '57339e480b54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS ward VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS address_note VARCHAR(500)")


def downgrade() -> None:
    op.drop_column('users', 'date_of_birth')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'ward')
    op.drop_column('users', 'district')
    op.drop_column('users', 'city')
    op.drop_column('users', 'postal_code')
    op.drop_column('users', 'address_note')
