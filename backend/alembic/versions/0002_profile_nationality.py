"""profile nationality + current_visa_status

Revision ID: 0002_profile_nationality
Revises: 0001_foundation
Create Date: 2026-04-28
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002_profile_nationality"
down_revision = "0001_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("user_profiles") as batch:
        batch.add_column(sa.Column("nationality", sa.String(2)))
        batch.add_column(sa.Column("current_visa_status", sa.String(80)))


def downgrade() -> None:
    with op.batch_alter_table("user_profiles") as batch:
        batch.drop_column("current_visa_status")
        batch.drop_column("nationality")
