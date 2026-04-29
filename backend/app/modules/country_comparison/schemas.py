"""Country Comparison contracts.

The detail payload is paired by design — every access-point score has both
an origin value and a destination value plus a delta the frontend renders
side-by-side. The model is required to compare, not just describe the
destination.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class CountryComparisonInputs(BaseModel):
    """Body for POST /country-comparison/run.

    Most fields are read off the user's profile + case snapshot; the body
    layer is where Page 4's "Destination Setup" form values land. Empty body
    is allowed — the service falls back to whatever's already on the profile.
    """

    model_config = ConfigDict(extra="forbid")

    current_country: Optional[str] = Field(default=None, min_length=2, max_length=2)
    current_city: Optional[str] = Field(default=None, max_length=80)
    target_country: Optional[str] = Field(default=None, min_length=2, max_length=2)
    target_city: Optional[str] = Field(default=None, max_length=80)
    open_to_alternatives: Optional[bool] = None
    alternatives: Optional[list[str]] = Field(default=None, max_length=5)

    current_job_situation: Optional[str] = Field(default=None, max_length=40)
    job_search_status: Optional[str] = Field(default=None, max_length=40)
    reason_for_moving: Optional[str] = Field(default=None, max_length=600)
    origin_constraints: Optional[str] = Field(default=None, max_length=600)

    force: bool = False  # if true, bypass the input-hash cache and run a fresh version


# ----- detail payload (the heart of the artifact) -----


class PairedScore(BaseModel):
    origin: int = Field(ge=0, le=100)
    destination: int = Field(ge=0, le=100)
    delta: int = Field(
        ge=-100,
        le=100,
        description="destination - origin; positive = destination better",
    )
    note: str = Field(min_length=1, max_length=400)


class AccessPointScores(BaseModel):
    job_market_access: PairedScore
    visa_access: PairedScore
    housing_pressure: PairedScore  # higher score = LESS pressure (i.e., easier)
    healthcare_access: PairedScore
    schooling_access: PairedScore
    cultural_fit: PairedScore
    language_fit: PairedScore


class StrengthOrBlocker(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)
    side: str = Field(pattern="^(origin|destination|both)$")


class AlternativeBrief(BaseModel):
    country: str = Field(min_length=2, max_length=2)
    headline: str = Field(min_length=1, max_length=160)
    fit_score: int = Field(ge=0, le=100)


class CountryComparisonDetail(BaseModel):
    """Strict comparison artifact rendered by the frontend's Page 4."""

    origin: dict = Field(
        description="{country, city|null} echoed for frontend convenience"
    )
    destination: dict = Field(description="{country, city|null} echoed for convenience")

    overall_comparison_score: int = Field(
        ge=0,
        le=100,
        description="How strongly the destination beats the origin overall.",
    )
    destination_suitability_score: int = Field(ge=0, le=100)
    origin_pressure_score: int = Field(
        ge=0,
        le=100,
        description="How much the origin pushes the user out (higher = stronger push).",
    )

    access_points: AccessPointScores

    strengths: list[StrengthOrBlocker] = Field(min_length=1, max_length=8)
    blockers: list[StrengthOrBlocker] = Field(default_factory=list, max_length=8)

    comparison_summary: str = Field(min_length=1, max_length=900)

    alternatives_considered: list[AlternativeBrief] = Field(
        default_factory=list, max_length=5
    )
