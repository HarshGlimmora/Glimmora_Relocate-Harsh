"""SQLAlchemy ORM models.

Schema target is Postgres 16 in prod and SQLite in dev/test. Columns are
chosen to be portable: UUIDs as strings, JSON as the dialect-neutral JSON
type, timestamps as timezone-aware datetimes.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.storage.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


# --- USERS -----------------------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(160))
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc, onupdate=_now_utc
    )

    profile: Mapped["UserProfile"] = relationship(
        "UserProfile", uselist=False, back_populates="user", cascade="all, delete-orphan"
    )
    cases: Mapped[list["RelocationCase"]] = relationship(
        "RelocationCase", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rotated_to: Mapped[str | None] = mapped_column(String(36))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )


# --- PROFILE ---------------------------------------------------------------


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    # identity
    full_name: Mapped[str | None] = mapped_column(String(160))
    current_role: Mapped[str | None] = mapped_column(String(160))
    industry: Mapped[str | None] = mapped_column(String(80))
    seniority: Mapped[str | None] = mapped_column(String(20))
    years_experience: Mapped[int | None] = mapped_column(Integer)
    skills: Mapped[list[Any]] = mapped_column(JSON, nullable=False, default=list)
    education: Mapped[list[Any]] = mapped_column(JSON, nullable=False, default=list)
    companies: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # relocation context
    current_country: Mapped[str | None] = mapped_column(String(2))
    current_city: Mapped[str | None] = mapped_column(String(80))
    target_country: Mapped[str | None] = mapped_column(String(2))
    target_city: Mapped[str | None] = mapped_column(String(80))
    nationality: Mapped[str | None] = mapped_column(String(2))
    current_visa_status: Mapped[str | None] = mapped_column(String(80))

    current_salary: Mapped[int | None] = mapped_column(BigInteger)
    expected_salary: Mapped[int | None] = mapped_column(BigInteger)
    salary_currency: Mapped[str | None] = mapped_column(String(3))

    move_urgency: Mapped[str | None] = mapped_column(String(20))
    work_preference: Mapped[str | None] = mapped_column(String(20))
    relocation_budget: Mapped[int | None] = mapped_column(BigInteger)
    needs_visa_sponsorship: Mapped[bool | None] = mapped_column(Boolean)
    priority_ranking: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    current_document_status: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )

    # meta
    field_sources: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False, default=dict)
    completion_percentage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc, onupdate=_now_utc
    )

    user: Mapped[User] = relationship("User", back_populates="profile")


# --- CASE ------------------------------------------------------------------


class RelocationCase(Base):
    __tablename__ = "relocation_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    state: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    state_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    inputs_revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    inputs_snapshot: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc, onupdate=_now_utc
    )

    user: Mapped[User] = relationship("User", back_populates="cases")

    __table_args__ = (
        Index("ix_cases_user_active", "user_id", "active"),
    )


# --- RESUME ----------------------------------------------------------------


class ResumeParse(Base):
    __tablename__ = "resume_parses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    storage_uri: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(80), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(240))

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="parsing")
    raw_text: Mapped[str | None] = mapped_column(Text)
    extracted_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc, onupdate=_now_utc
    )


# --- ANALYSES (generic for all 9 + synthesis; not used until later phases) ---


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("relocation_cases.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    envelope: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="generating")
    model: Mapped[str | None] = mapped_column(String(60))
    prompt_version: Mapped[str | None] = mapped_column(String(40))
    input_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    inputs_revision_at_gen: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    analysis_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    stale: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recompute_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    stale_reason: Mapped[str | None] = mapped_column(String(240))
    superseded_by: Mapped[str | None] = mapped_column(String(36))

    tokens_in: Mapped[int | None] = mapped_column(Integer)
    tokens_out: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    cost_usd: Mapped[float | None] = mapped_column(Numeric(10, 6))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc, onupdate=_now_utc
    )

    __table_args__ = (
        UniqueConstraint("case_id", "kind", "input_hash", name="uq_analyses_case_kind_hash"),
        Index("ix_analyses_case_kind_version", "case_id", "kind", "analysis_version"),
        Index("ix_analyses_case_stale", "case_id", "stale"),
    )


# --- AI CALL TELEMETRY ------------------------------------------------------


class AICall(Base):
    __tablename__ = "ai_calls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str | None] = mapped_column(String(36), index=True)
    kind: Mapped[str] = mapped_column(String(60), nullable=False)
    model: Mapped[str] = mapped_column(String(60), nullable=False)
    prompt_version: Mapped[str | None] = mapped_column(String(40))
    tokens_in: Mapped[int | None] = mapped_column(Integer)
    tokens_out: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    cost_usd: Mapped[float | None] = mapped_column(Numeric(10, 6))
    request_id: Mapped[str | None] = mapped_column(String(80))
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )
