"""profile current_document_status

Revision ID: 0003_profile_documents
Revises: 0002_profile_nationality
Create Date: 2026-04-28
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0003_profile_documents"
down_revision = "0002_profile_nationality"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("user_profiles") as batch:
        batch.add_column(
            sa.Column(
                "current_document_status",
                sa.JSON,
                nullable=False,
                server_default=sa.text("'{}'"),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("user_profiles") as batch:
        batch.drop_column("current_document_status")
