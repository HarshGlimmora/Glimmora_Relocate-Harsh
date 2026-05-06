"""Profile request/response shapes."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.profile import (
    CostSensitivity,
    Education,
    FamilyBudgetImpact,
    FamilyStatus,
    LanguageConfidence,
    MoveUrgency,
    Priority,
    ReadinessLevel,
    RelocationGoal,
    SchoolRequirement,
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

    # identity
    full_name: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    current_role: str | None = Field(default=None, max_length=160)
    target_role: str | None = Field(default=None, max_length=160)
    current_employer: str | None = Field(default=None, max_length=160)
    industry: str | None = Field(default=None, max_length=80)
    years_experience: int | None = Field(default=None, ge=0, le=70)
    seniority: Seniority | None = None
    skills: list[Skill] | None = None
    education: list[Education] | None = None
    companies: list[str] | None = None
    certifications: list[str] | None = None
    languages_known: list[str] | None = None
    destination_language_confidence: LanguageConfidence | None = None

    # relocation
    current_country: str | None = Field(default=None, min_length=2, max_length=2)
    current_city: str | None = Field(default=None, max_length=80)
    target_country: str | None = Field(default=None, min_length=2, max_length=2)
    target_city: str | None = Field(default=None, max_length=80)
    nationality: str | None = Field(default=None, min_length=2, max_length=2)
    current_visa_status: str | None = Field(default=None, max_length=80)
    open_to_alternatives: bool | None = None
    alternatives: list[str] | None = Field(default=None, max_length=5)
    relocation_goal: RelocationGoal | None = None
    reason_for_moving: str | None = Field(default=None, max_length=600)

    # finance
    current_salary: int | None = Field(default=None, ge=0)
    expected_salary: int | None = Field(default=None, ge=0)
    salary_currency: str | None = Field(default=None, min_length=3, max_length=3)
    monthly_budget: int | None = Field(default=None, ge=0)
    savings: int | None = Field(default=None, ge=0)
    rent_expectation: int | None = Field(default=None, ge=0)
    cost_sensitivity: CostSensitivity | None = None

    # intent + ranking
    move_urgency: MoveUrgency | None = None
    work_preference: WorkPreference | None = None
    relocation_budget: int | None = Field(default=None, ge=0)
    needs_visa_sponsorship: bool | None = None
    priority_ranking: list[Priority] | None = Field(default=None, max_length=5)

    # household
    family_status: FamilyStatus | None = None
    moving_with_family: bool | None = None
    children_count: int | None = Field(default=None, ge=0, le=12)
    parents_moving: bool | None = None
    family_budget_impact: FamilyBudgetImpact | None = None
    housing_requirement: str | None = Field(default=None, max_length=200)
    school_requirement: SchoolRequirement | None = None

    # readiness
    readiness_level: ReadinessLevel | None = None
    move_clarity_score: int | None = Field(default=None, ge=0, le=100)

    # documents
    current_document_status: dict[str, dict] | None = Field(default=None)

    @field_validator(
        "current_country", "target_country", "nationality", "salary_currency"
    )
    @classmethod
    def _upper(cls, v: str | None) -> str | None:
        return v.upper() if v else v

    @field_validator("alternatives")
    @classmethod
    def _alts_upper(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        normed: list[str] = []
        for s in v:
            if not s:
                continue
            up = s.strip().upper()
            if len(up) == 2 and up.isalpha():
                normed.append(up)
        return normed

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
