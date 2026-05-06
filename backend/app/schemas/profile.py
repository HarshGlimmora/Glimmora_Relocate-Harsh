"""User-facing profile + resume extraction contracts.

UserProfile is the single source of truth for user identity + relocation
intent. ResumeExtraction is what the parser produces; the merge layer
combines the two and stamps `field_sources` so the UI can render
"auto-filled" vs "you entered" badges.
"""

from __future__ import annotations

from datetime import date
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ----- enums -----


class FieldSource(StrEnum):
    RESUME = "resume"
    USER = "user"
    MERGED = "merged"  # both contributed; user value won the conflict


class MoveUrgency(StrEnum):
    ASAP = "asap"
    SIX_MONTHS = "6m"
    TWELVE_MONTHS = "12m"
    EXPLORING = "exploring"


class WorkPreference(StrEnum):
    ONSITE = "onsite"
    HYBRID = "hybrid"
    REMOTE = "remote"


class Priority(StrEnum):
    CAREER = "career"
    FAMILY = "family"
    COST = "cost"
    LIFESTYLE = "lifestyle"
    SPEED = "speed"


class Seniority(StrEnum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    STAFF = "staff"
    PRINCIPAL = "principal"


class RelocationGoal(StrEnum):
    """Why is the user looking to move? Drives module emphasis + framing.

    Mirrors the `Intent` IDs the consumer DB used to store separately —
    we now persist this on the backend profile so any client can read it.
    """

    COMPARE_COUNTRIES = "compare_countries"
    RELOCATE_WITH_OFFER = "relocate_with_offer"
    FIND_JOB_ABROAD = "find_job_abroad"
    VISA_FEASIBILITY = "visa_feasibility"
    FAMILY_RELOCATION = "family_relocation"
    STRESS_TEST_AFFORDABILITY = "stress_test_affordability"
    DOCUMENTS_TIMELINE = "documents_timeline"
    MOVE_FAST = "move_fast"


class FamilyStatus(StrEnum):
    SINGLE = "single"
    PARTNERED = "partnered"
    MARRIED = "married"
    SEPARATED = "separated"
    WIDOWED = "widowed"


class CostSensitivity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class FamilyBudgetImpact(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SchoolRequirement(StrEnum):
    NONE = "none"
    PRESCHOOL = "preschool"
    PRIMARY = "primary"
    SECONDARY = "secondary"
    HIGH = "high"
    TERTIARY = "tertiary"
    SPECIAL_NEEDS = "special_needs"


class ReadinessLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class LanguageConfidence(StrEnum):
    NONE = "none"
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"


# ----- sub-models shared between resume + profile -----


class Skill(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    category: str | None = Field(default=None, max_length=60)
    evidence_snippet: str | None = Field(default=None, max_length=300)


class ExperienceItem(BaseModel):
    company: str = Field(min_length=1, max_length=160)
    role: str = Field(min_length=1, max_length=160)
    start: date | None = None
    end: date | None = None  # null means current
    location: str | None = Field(default=None, max_length=120)
    bullets: list[str] = Field(default_factory=list, max_length=20)


class Education(BaseModel):
    school: str = Field(min_length=1, max_length=160)
    degree: str | None = Field(default=None, max_length=120)
    field: str | None = Field(default=None, max_length=120)
    start: date | None = None
    end: date | None = None


class Language(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    level: str | None = Field(default=None, max_length=20)  # CEFR or free


class Certification(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    issuer: str | None = Field(default=None, max_length=120)
    issued_at: date | None = None


# ----- ResumeExtraction (what the parser produces) -----


class ResumeExtraction(BaseModel):
    """Strictly structured output produced by the resume parser."""

    full_name: str | None = Field(default=None, max_length=160)
    emails: list[EmailStr] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    headline: str | None = Field(default=None, max_length=200)
    summary: str | None = Field(default=None, max_length=2000)

    current_role: str | None = Field(default=None, max_length=160)
    current_company: str | None = Field(default=None, max_length=160)
    years_experience: int | None = Field(default=None, ge=0, le=70)
    seniority: Seniority | None = None

    skills: list[Skill] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    certifications: list[Certification] = Field(default_factory=list)
    languages: list[Language] = Field(default_factory=list)

    inferred_industry: str | None = Field(default=None, max_length=80)
    inferred_job_category: str | None = Field(default=None, max_length=80)

    extraction_confidence: float = Field(default=0.5, ge=0.0, le=1.0)


# ----- UserProfile (the merged truth) -----


class UserProfile(BaseModel):
    """User profile = merged resume + user-confirmed inputs.

    `field_sources` records, per top-level field, where the current value came
    from. The merge service is the only writer of this map.
    """

    model_config = ConfigDict(use_enum_values=True)

    # identity
    full_name: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    current_role: str | None = Field(default=None, max_length=160)
    target_role: str | None = Field(default=None, max_length=160)
    current_employer: str | None = Field(default=None, max_length=160)
    industry: str | None = Field(default=None, max_length=80)
    years_experience: int | None = Field(default=None, ge=0, le=70)
    seniority: Seniority | None = None
    skills: list[Skill] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    companies: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    languages_known: list[str] = Field(default_factory=list)
    destination_language_confidence: LanguageConfidence | None = None

    # relocation context
    current_country: str | None = Field(default=None, min_length=2, max_length=2)
    current_city: str | None = Field(default=None, max_length=80)
    target_country: str | None = Field(default=None, min_length=2, max_length=2)
    target_city: str | None = Field(default=None, max_length=80)
    nationality: str | None = Field(default=None, min_length=2, max_length=2)
    current_visa_status: str | None = Field(default=None, max_length=80)
    open_to_alternatives: bool | None = None
    alternatives: list[str] = Field(default_factory=list, max_length=5)
    relocation_goal: RelocationGoal | None = None
    reason_for_moving: str | None = Field(default=None, max_length=600)

    current_salary: int | None = Field(default=None, ge=0)
    expected_salary: int | None = Field(default=None, ge=0)
    salary_currency: str | None = Field(default=None, min_length=3, max_length=3)
    monthly_budget: int | None = Field(default=None, ge=0)
    savings: int | None = Field(default=None, ge=0)
    rent_expectation: int | None = Field(default=None, ge=0)
    cost_sensitivity: CostSensitivity | None = None

    move_urgency: MoveUrgency | None = None
    work_preference: WorkPreference | None = None
    relocation_budget: int | None = Field(default=None, ge=0)
    needs_visa_sponsorship: bool | None = None
    priority_ranking: list[Priority] = Field(default_factory=list, max_length=5)

    # household / lifestyle
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

    # documents (free-form self-report; documents module reads this)
    # Shape examples:
    #   {"passport": {"has": true, "expires_at": "2027-08-01"}}
    #   {"birth_certificate": {"has": false}}
    current_document_status: dict[str, dict] = Field(default_factory=dict)

    # meta
    field_sources: dict[str, FieldSource] = Field(default_factory=dict)
    completion_percentage: int = Field(default=0, ge=0, le=100)

    @field_validator(
        "current_country", "target_country", "nationality", "salary_currency"
    )
    @classmethod
    def _uppercase_codes(cls, v: str | None) -> str | None:
        return v.upper() if v else v

    @field_validator("priority_ranking")
    @classmethod
    def _unique_priorities(cls, v: list[Priority]) -> list[Priority]:
        if len(set(v)) != len(v):
            raise ValueError("priority_ranking entries must be unique")
        return v


# Subset of UserProfile fields the user is allowed to PATCH directly.
PROFILE_REQUIRED_FOR_ANALYSIS = {
    "current_country",
    "target_country",
    "move_urgency",
    "needs_visa_sponsorship",
}

PROFILE_PATCHABLE_FIELDS = {
    # identity
    "full_name",
    "phone",
    "current_role",
    "target_role",
    "current_employer",
    "industry",
    "years_experience",
    "seniority",
    "skills",
    "education",
    "companies",
    "certifications",
    "languages_known",
    "destination_language_confidence",
    # relocation
    "current_country",
    "current_city",
    "target_country",
    "target_city",
    "nationality",
    "current_visa_status",
    "open_to_alternatives",
    "alternatives",
    "relocation_goal",
    "reason_for_moving",
    # finance
    "current_salary",
    "expected_salary",
    "salary_currency",
    "monthly_budget",
    "savings",
    "rent_expectation",
    "cost_sensitivity",
    # intent + ranking
    "move_urgency",
    "work_preference",
    "relocation_budget",
    "needs_visa_sponsorship",
    "priority_ranking",
    # household
    "family_status",
    "moving_with_family",
    "children_count",
    "parents_moving",
    "family_budget_impact",
    "housing_requirement",
    "school_requirement",
    # readiness
    "readiness_level",
    "move_clarity_score",
    # documents
    "current_document_status",
}
