"""profile: richer intake fields (target_role, languages, family, budget, readiness)

Revision ID: 0004_profile_richer_intake
Revises: 0003_profile_documents
Create Date: 2026-05-06

Adds the columns required to support the data-first onboarding flow:
identity contact, career context, alternatives, relocation goal,
budget detail, household structure, readiness signal.

All columns are nullable / JSON-default-empty. Existing rows are not
touched. The migration is idempotent under SQLite via batch_alter_table.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0004_profile_richer_intake"
down_revision = "0003_profile_documents"
branch_labels = None
depends_on = None


_NEW_SCALAR_COLUMNS: list[tuple[str, sa.types.TypeEngine]] = [
    ("phone", sa.String(40)),
    ("target_role", sa.String(160)),
    ("current_employer", sa.String(160)),
    ("destination_language_confidence", sa.String(8)),
    ("open_to_alternatives", sa.Boolean()),
    ("relocation_goal", sa.String(40)),
    ("reason_for_moving", sa.String(600)),
    ("monthly_budget", sa.BigInteger()),
    ("savings", sa.BigInteger()),
    ("rent_expectation", sa.BigInteger()),
    ("cost_sensitivity", sa.String(20)),
    ("family_status", sa.String(20)),
    ("moving_with_family", sa.Boolean()),
    ("children_count", sa.Integer()),
    ("parents_moving", sa.Boolean()),
    ("family_budget_impact", sa.String(20)),
    ("housing_requirement", sa.String(200)),
    ("school_requirement", sa.String(20)),
    ("readiness_level", sa.String(20)),
    ("move_clarity_score", sa.Integer()),
]

_NEW_JSON_LIST_COLUMNS: list[str] = [
    "certifications",
    "languages_known",
    "alternatives",
]


def upgrade() -> None:
    with op.batch_alter_table("user_profiles") as batch:
        for name, type_ in _NEW_SCALAR_COLUMNS:
            batch.add_column(sa.Column(name, type_, nullable=True))
        for name in _NEW_JSON_LIST_COLUMNS:
            batch.add_column(
                sa.Column(
                    name,
                    sa.JSON,
                    nullable=False,
                    server_default=sa.text("'[]'"),
                )
            )


def downgrade() -> None:
    with op.batch_alter_table("user_profiles") as batch:
        for name in _NEW_JSON_LIST_COLUMNS:
            batch.drop_column(name)
        for name, _ in reversed(_NEW_SCALAR_COLUMNS):
            batch.drop_column(name)
