"""Job Fit contracts.

The detail payload mirrors what Page 5 of the frontend renders: four scoring
cards (overall, role match, salary realism, visa employability), a skill
panel split three ways (aligned / missing / transferable), an alternative-
roles list, a pathways list, and a key-gaps list. Salary fields use minor-
unit ints so the frontend can format per-locale.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class JobFitInputs(BaseModel):
    """Body for POST /job-fit/run.

    Body > case snapshot > profile precedence (same as country-comparison).
    Empty body is allowed when the profile is already complete enough.
    """

    model_config = ConfigDict(extra="forbid")

    current_role: Optional[str] = Field(default=None, max_length=160)
    target_role: Optional[str] = Field(default=None, max_length=160)
    preferred_industry: Optional[str] = Field(default=None, max_length=80)
    years_experience: Optional[int] = Field(default=None, ge=0, le=70)

    salary_range_min: Optional[int] = Field(default=None, ge=0)
    salary_range_max: Optional[int] = Field(default=None, ge=0)
    salary_currency: Optional[str] = Field(default=None, min_length=3, max_length=3)

    work_mode: Optional[str] = Field(default=None, max_length=40)
    needs_visa_sponsorship: Optional[bool] = None
    open_to_role_change: Optional[bool] = None

    force: bool = False


# ----- detail payload -----


class SalaryRange(BaseModel):
    min: int = Field(ge=0)
    p50: int = Field(ge=0)
    max: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)


class RoleMatchDetail(BaseModel):
    score: int = Field(ge=0, le=100)
    target_role_inferred: str = Field(min_length=1, max_length=160)
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(min_length=1, max_length=600)


class SalaryRealismDetail(BaseModel):
    score: int = Field(ge=0, le=100)
    user_expectation: SalaryRange
    market_estimate: SalaryRange
    gap_pct: int = Field(
        ge=-100,
        le=200,
        description="positive = expectation above market p50; negative = below",
    )
    note: str = Field(min_length=1, max_length=400)


class VisaEmployabilityDetail(BaseModel):
    score: int = Field(ge=0, le=100)
    sponsor_friendly_employer_density: str = Field(
        pattern="^(low|medium|high)$",
        description="how common visa-sponsoring employers are for this role/destination",
    )
    typical_sponsor_titles: list[str] = Field(default_factory=list, max_length=10)
    note: str = Field(min_length=1, max_length=400)


class SkillItem(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    why: str = Field(min_length=1, max_length=300)


class TransferableSkill(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    transfers_to: str = Field(min_length=1, max_length=120)
    note: str = Field(min_length=1, max_length=300)


class AlternativeRole(BaseModel):
    role: str = Field(min_length=1, max_length=160)
    fit_score: int = Field(ge=0, le=100)
    why: str = Field(min_length=1, max_length=300)


class JobPathway(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    steps: list[str] = Field(min_length=1, max_length=8)
    time_to_offer_weeks: int = Field(ge=1, le=104)
    confidence: float = Field(ge=0.0, le=1.0)


class KeyGap(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    severity: str = Field(pattern="^(low|medium|high)$")
    fixable_in_weeks: int = Field(ge=0, le=104)
    detail: str = Field(min_length=1, max_length=400)


class JobFitDetail(BaseModel):
    """Strict job-fit artifact rendered by the frontend's Page 5."""

    overall_job_fit_score: int = Field(ge=0, le=100)
    role_match: RoleMatchDetail
    salary_realism: SalaryRealismDetail
    visa_employability: VisaEmployabilityDetail

    skill_alignment: dict = Field(
        description="{aligned: SkillItem[], missing: SkillItem[], transferable: TransferableSkill[]}"
    )

    inferred_target_roles: list[str] = Field(default_factory=list, max_length=5)
    alternative_roles: list[AlternativeRole] = Field(
        default_factory=list, max_length=6
    )
    pathways: list[JobPathway] = Field(min_length=1, max_length=4)

    estimated_time_to_offer_weeks: int = Field(ge=1, le=104)

    key_gaps: list[KeyGap] = Field(default_factory=list, max_length=8)
