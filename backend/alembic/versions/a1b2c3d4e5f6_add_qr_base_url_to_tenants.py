"""add qr_base_url to tenants

Revision ID: a1b2c3d4e5f6
Revises: 33431bb42df4
Create Date: 2026-04-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '33431bb42df4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('qr_base_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'qr_base_url')
