"""foundation tables

Revision ID: 0001_foundation
Revises:
Create Date: 2026-04-27
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_foundation"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(160)),
        sa.Column("email_verified_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(128), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("rotated_to", sa.String(36)),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    op.create_table(
        "user_profiles",
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("full_name", sa.String(160)),
        sa.Column("current_role", sa.String(160)),
        sa.Column("industry", sa.String(80)),
        sa.Column("seniority", sa.String(20)),
        sa.Column("years_experience", sa.Integer),
        sa.Column("skills", sa.JSON, nullable=False),
        sa.Column("education", sa.JSON, nullable=False),
        sa.Column("companies", sa.JSON, nullable=False),
        sa.Column("current_country", sa.String(2)),
        sa.Column("current_city", sa.String(80)),
        sa.Column("target_country", sa.String(2)),
        sa.Column("target_city", sa.String(80)),
        sa.Column("current_salary", sa.BigInteger),
        sa.Column("expected_salary", sa.BigInteger),
        sa.Column("salary_currency", sa.String(3)),
        sa.Column("move_urgency", sa.String(20)),
        sa.Column("work_preference", sa.String(20)),
        sa.Column("relocation_budget", sa.BigInteger),
        sa.Column("needs_visa_sponsorship", sa.Boolean),
        sa.Column("priority_ranking", sa.JSON, nullable=False),
        sa.Column("field_sources", sa.JSON, nullable=False),
        sa.Column("completion_percentage", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "relocation_cases",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("state", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("state_changed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("inputs_revision", sa.Integer, nullable=False, server_default="1"),
        sa.Column("inputs_snapshot", sa.JSON, nullable=False),
        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_relocation_cases_user_id", "relocation_cases", ["user_id"]
    )
    op.create_index(
        "ix_cases_user_active", "relocation_cases", ["user_id", "active"]
    )

    op.create_table(
        "resume_parses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("storage_uri", sa.String(500), nullable=False),
        sa.Column("mime_type", sa.String(80), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("original_filename", sa.String(240)),
        sa.Column("status", sa.String(20), nullable=False, server_default="parsing"),
        sa.Column("raw_text", sa.Text),
        sa.Column("extracted_json", sa.JSON),
        sa.Column("error", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_resume_parses_user_id", "resume_parses", ["user_id"])

    op.create_table(
        "analyses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "case_id",
            sa.String(36),
            sa.ForeignKey("relocation_cases.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("envelope", sa.JSON),
        sa.Column("status", sa.String(20), nullable=False, server_default="generating"),
        sa.Column("model", sa.String(60)),
        sa.Column("prompt_version", sa.String(40)),
        sa.Column("input_hash", sa.String(128), nullable=False),
        sa.Column("inputs_revision_at_gen", sa.Integer, nullable=False, server_default="1"),
        sa.Column("analysis_version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("stale", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column(
            "recompute_required", sa.Boolean, nullable=False, server_default=sa.text("0")
        ),
        sa.Column("stale_reason", sa.String(240)),
        sa.Column("superseded_by", sa.String(36)),
        sa.Column("tokens_in", sa.Integer),
        sa.Column("tokens_out", sa.Integer),
        sa.Column("latency_ms", sa.Integer),
        sa.Column("cost_usd", sa.Numeric(10, 6)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("case_id", "kind", "input_hash", name="uq_analyses_case_kind_hash"),
    )
    op.create_index(
        "ix_analyses_case_kind_version",
        "analyses",
        ["case_id", "kind", "analysis_version"],
    )
    op.create_index("ix_analyses_case_stale", "analyses", ["case_id", "stale"])

    op.create_table(
        "ai_calls",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("case_id", sa.String(36)),
        sa.Column("kind", sa.String(60), nullable=False),
        sa.Column("model", sa.String(60), nullable=False),
        sa.Column("prompt_version", sa.String(40)),
        sa.Column("tokens_in", sa.Integer),
        sa.Column("tokens_out", sa.Integer),
        sa.Column("latency_ms", sa.Integer),
        sa.Column("cost_usd", sa.Numeric(10, 6)),
        sa.Column("request_id", sa.String(80)),
        sa.Column("success", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("error", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ai_calls_case_id", "ai_calls", ["case_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_calls_case_id", table_name="ai_calls")
    op.drop_table("ai_calls")
    op.drop_index("ix_analyses_case_stale", table_name="analyses")
    op.drop_index("ix_analyses_case_kind_version", table_name="analyses")
    op.drop_table("analyses")
    op.drop_index("ix_resume_parses_user_id", table_name="resume_parses")
    op.drop_table("resume_parses")
    op.drop_index("ix_cases_user_active", table_name="relocation_cases")
    op.drop_index("ix_relocation_cases_user_id", table_name="relocation_cases")
    op.drop_table("relocation_cases")
    op.drop_table("user_profiles")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
