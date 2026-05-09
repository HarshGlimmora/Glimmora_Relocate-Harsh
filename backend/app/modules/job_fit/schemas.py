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


class MarketDemandDetail(BaseModel):
    """Dynamic market demand signal for the inferred target role at the
    destination — fourth tile of the Compatibility Dashboard."""

    score: int = Field(ge=0, le=100, description="0–100 demand strength")
    level: str = Field(
        pattern="^(low|medium|high)$",
        description="thresholded level for the chip on the card",
    )
    note: str = Field(
        min_length=1,
        max_length=400,
        description="one or two sentences explaining why the score lands here",
    )
    demand_signals: list[str] = Field(
        default_factory=list,
        max_length=6,
        description="short tag-style signals e.g. 'high vacancy ratio', 'rising LinkedIn postings'",
    )


class CareerAngleRecommendation(BaseModel):
    """Strategic positioning advice for the user — populates the
    'Sharpen your career angle' AI block."""

    title: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)
    impact: str = Field(
        pattern="^(low|medium|high)$",
        description="how much shifting on this would move the needle",
    )
    category: str = Field(
        min_length=1,
        max_length=40,
        description="e.g. 'positioning', 'skills', 'salary', 'visa', 'narrative'",
    )


class SupportingSignal(BaseModel):
    """A positive AI-detected signal for the 'Pulling for it' panel —
    explicit, model-authored evidence rather than derived numbers."""

    title: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)
    confidence: float = Field(ge=0.0, le=1.0)
    category: str = Field(
        min_length=1,
        max_length=40,
        description="e.g. 'demand', 'skills', 'visa', 'industry', 'pathway'",
    )


class JobFitDetail(BaseModel):
    """Strict job-fit artifact rendered by the frontend's Page 5.

    Field naming intentionally matches the consumer app's
    `JobFitDetail` TS interface (`apps/consumer/lib/backend/types.ts`)
    so the Next.js page can read fields directly without a transform
    layer. Three lists were previously nested under
    ``skill_alignment`` and have been flattened into top-level
    ``aligned_skills`` / ``missing_skills`` / ``transferable_skills``;
    ``alternative_roles`` and ``pathways`` were renamed to
    ``alternate_roles`` and ``job_pathways`` for the same reason.
    """

    overall_job_fit_score: int = Field(ge=0, le=100)
    role_match: RoleMatchDetail
    salary_realism: SalaryRealismDetail
    visa_employability: VisaEmployabilityDetail
    market_demand: MarketDemandDetail

    aligned_skills: list[SkillItem] = Field(default_factory=list, max_length=10)
    missing_skills: list[SkillItem] = Field(default_factory=list, max_length=10)
    transferable_skills: list[TransferableSkill] = Field(
        default_factory=list, max_length=10
    )

    inferred_target_roles: list[str] = Field(default_factory=list, max_length=5)
    alternate_roles: list[AlternativeRole] = Field(
        default_factory=list, max_length=6
    )
    job_pathways: list[JobPathway] = Field(min_length=1, max_length=4)

    estimated_time_to_offer_weeks: int = Field(ge=1, le=104)

    key_gaps: list[KeyGap] = Field(default_factory=list, max_length=8)

    # Newer dashboard sections — populated dynamically by the AI.
    career_angle_recommendations: list[CareerAngleRecommendation] = Field(
        default_factory=list,
        max_length=6,
        description="strategic positioning advice for the 'Sharpen your career angle' panel",
    )
    supporting_signals: list[SupportingSignal] = Field(
        default_factory=list,
        max_length=6,
        description="positive AI-detected evidence for the 'Pulling for it' panel",
    )
