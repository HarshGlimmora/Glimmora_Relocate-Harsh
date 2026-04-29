"""Profile request/response shapes."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.profile import (
    Education,
    MoveUrgency,
    Priority,
    Seniority,
    Skill,
    UserProfile,
    WorkPreference,
    PROFILE_PATCHABLE_FIELDS,
)


class ProfilePatch(BaseModel):
    """Whitelisted fields a user can update directly via PATCH /profile.

    Every field is optional; only present fields are applied.
    """

    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, max_length=160)
    current_role: str | None = Field(default=None, max_length=160)
    industry: str | None = Field(default=None, max_length=80)
    years_experience: int | None = Field(default=None, ge=0, le=70)
    seniority: Seniority | None = None
    skills: list[Skill] | None = None
    education: list[Education] | None = None
    companies: list[str] | None = None

    current_country: str | None = Field(default=None, min_length=2, max_length=2)
    current_city: str | None = Field(default=None, max_length=80)
    target_country: str | None = Field(default=None, min_length=2, max_length=2)
    target_city: str | None = Field(default=None, max_length=80)
    nationality: str | None = Field(default=None, min_length=2, max_length=2)
    current_visa_status: str | None = Field(default=None, max_length=80)

    current_salary: int | None = Field(default=None, ge=0)
    expected_salary: int | None = Field(default=None, ge=0)
    salary_currency: str | None = Field(default=None, min_length=3, max_length=3)

    move_urgency: MoveUrgency | None = None
    work_preference: WorkPreference | None = None
    relocation_budget: int | None = Field(default=None, ge=0)
    needs_visa_sponsorship: bool | None = None
    priority_ranking: list[Priority] | None = Field(default=None, max_length=5)
    current_document_status: dict[str, dict] | None = Field(default=None)

    @field_validator(
        "current_country", "target_country", "nationality", "salary_currency"
    )
    @classmethod
    def _upper(cls, v: str | None) -> str | None:
        return v.upper() if v else v

    def applied_keys(self) -> set[str]:
        # Only fields the caller actually sent (excluding None defaults that
        # they didn't include) — uses Pydantic's set of explicitly-provided fields.
        return set(self.model_fields_set) & PROFILE_PATCHABLE_FIELDS


class ProfileResponse(BaseModel):
    profile: UserProfile
    field_sources: dict[str, str] = Field(default_factory=dict)
    completion_percentage: int = Field(ge=0, le=100)
    required_missing: list[str] = Field(default_factory=list)


class ProfilePatchResult(ProfileResponse):
    changed_keys: list[str] = Field(default_factory=list)
    impacted_modules: list[str] = Field(default_factory=list)
    inputs_revision: int = Field(ge=1)
