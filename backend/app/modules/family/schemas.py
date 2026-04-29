"""Family Relocation contracts.

Two modes:

  - **solo mode** — `moving_with_family=false`. The artifact is short but
    still valid: low household-complexity score, empty spouse/children/
    parents sub-objects, and a one-paragraph summary.
  - **full mode** — at least one of spouse/children/parents is moving. The
    full set of sub-analyses is required.

The frontend renders the same card grid in both modes; in solo mode most
sections collapse to a "not applicable" pill.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class SpouseInput(BaseModel):
    moving: bool = False
    has_career: bool = False
    profession: Optional[str] = Field(default=None, max_length=120)
    work_visa_required: Optional[bool] = None


class ChildInput(BaseModel):
    age: int = Field(ge=0, le=25)
    schooling_need: str = Field(
        pattern="^(none|preschool|primary|secondary|high|tertiary|special_needs)$"
    )
    notes: Optional[str] = Field(default=None, max_length=240)


class ParentsInput(BaseModel):
    moving: bool = False
    dependency_level: str = Field(
        default="none",
        pattern="^(none|low|medium|high|full_dependency)$",
    )
    healthcare_sensitivity: str = Field(
        default="low",
        pattern="^(low|medium|high)$",
    )
    notes: Optional[str] = Field(default=None, max_length=240)


class FamilyInputs(BaseModel):
    """Body for POST /family/run."""

    model_config = ConfigDict(extra="forbid")

    moving_with_family: Optional[bool] = None
    spouse: Optional[SpouseInput] = None
    children: Optional[list[ChildInput]] = Field(default=None, max_length=10)
    parents: Optional[ParentsInput] = None
    housing_requirement: Optional[str] = Field(
        default=None,
        max_length=200,
        description="free-text e.g. '3-bed near international school'",
    )
    family_budget_impact: Optional[str] = Field(
        default=None,
        pattern="^(low|medium|high)$",
        description="user's self-reported budget pressure from the family",
    )

    force: bool = False


# ----- detail payload -----


class SpouseOutlook(BaseModel):
    moving: bool
    career_outlook: str = Field(
        pattern="^(not_applicable|strong|workable|tight|blocked|unknown)$"
    )
    visa_pathway: str = Field(min_length=1, max_length=240)
    language_pressure: str = Field(pattern="^(low|medium|high|unknown)$")
    support_needs: list[str] = Field(default_factory=list, max_length=8)
    note: str = Field(min_length=1, max_length=400)


class ChildOutlook(BaseModel):
    age: int = Field(ge=0, le=25)
    schooling_recommendation: str = Field(min_length=1, max_length=300)
    school_options: list[str] = Field(default_factory=list, max_length=6)
    language_pressure: str = Field(pattern="^(low|medium|high|unknown)$")
    integration_estimate_months: int = Field(ge=0, le=48)
    notes: Optional[str] = Field(default=None, max_length=300)


class ParentsOutlook(BaseModel):
    moving: bool
    dependency_level: str = Field(pattern="^(none|low|medium|high|full_dependency)$")
    healthcare_fit: str = Field(
        pattern="^(not_applicable|strong|workable|tight|blocked|unknown)$"
    )
    visa_options: list[str] = Field(default_factory=list, max_length=6)
    care_recommendations: list[str] = Field(default_factory=list, max_length=8)
    note: str = Field(min_length=1, max_length=400)


class FamilyWarning(BaseModel):
    severity: str = Field(pattern="^(low|medium|high)$")
    label: str = Field(min_length=1, max_length=140)
    detail: str = Field(min_length=1, max_length=400)
    affects: str = Field(pattern="^(spouse|children|parents|household|housing|finance)$")


class FamilySuggestion(BaseModel):
    label: str = Field(min_length=1, max_length=140)
    detail: str = Field(min_length=1, max_length=400)
    urgency: str = Field(pattern="^(now|this_week|this_month|later)$")


class HousingFit(BaseModel):
    pressure: str = Field(pattern="^(low|medium|high|unknown)$")
    recommendation: str = Field(min_length=1, max_length=400)
    typical_lead_time_weeks: int = Field(ge=0, le=52)


class FamilyImpactDetail(BaseModel):
    """Strict family-impact artifact rendered by the frontend's Page 7."""

    mode: str = Field(pattern="^(solo|with_family)$")
    household_complexity_score: int = Field(ge=0, le=100)
    family_friendly_destination_fit: int = Field(ge=0, le=100)

    spouse: SpouseOutlook
    children: list[ChildOutlook] = Field(default_factory=list, max_length=10)
    parents: ParentsOutlook

    housing_fit: HousingFit
    warnings: list[FamilyWarning] = Field(default_factory=list, max_length=10)
    suggestions: list[FamilySuggestion] = Field(default_factory=list, max_length=10)
