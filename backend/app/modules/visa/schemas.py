"""Visa Direction contracts.

Direction-only — never legal advice. Every detail payload carries a
mandatory `legal_disclaimer` string that the frontend renders verbatim
under the artifact.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class VisaInputs(BaseModel):
    """Body for POST /visa/run.

    Body > case snapshot > profile precedence. None of the fields are
    required in the body — the service falls back to the profile + case
    snapshot. The minimum to *generate* is `target_country` + `nationality`.
    """

    model_config = ConfigDict(extra="forbid")

    target_country: Optional[str] = Field(default=None, min_length=2, max_length=2)
    nationality: Optional[str] = Field(default=None, min_length=2, max_length=2)
    current_visa_status: Optional[str] = Field(default=None, max_length=80)
    sponsor_required: Optional[bool] = None
    employment_status: Optional[str] = Field(default=None, max_length=40)
    family_relocation: Optional[bool] = None

    force: bool = False


# ----- detail payload -----


class RouteRequirement(BaseModel):
    label: str = Field(min_length=1, max_length=140)
    detail: str = Field(min_length=1, max_length=400)
    user_meets: str = Field(
        pattern="^(yes|partial|no|unknown)$",
        description="best-effort assessment of whether the user already meets this requirement",
    )


class PrimaryRoute(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    code: Optional[str] = Field(default=None, max_length=40, description="local statute / programme code if known")
    difficulty: str = Field(pattern="^(low|medium|high|very_high)$")
    typical_processing_weeks_min: int = Field(ge=1, le=104)
    typical_processing_weeks_max: int = Field(ge=1, le=156)
    sponsor_required: bool
    family_friendly: bool = Field(
        description="route allows accompanying spouse / dependents under reasonable terms"
    )
    requirements: list[RouteRequirement] = Field(min_length=1, max_length=12)
    rationale: str = Field(min_length=1, max_length=600)


class AlternativeRoute(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    difficulty: str = Field(pattern="^(low|medium|high|very_high)$")
    why_consider: str = Field(min_length=1, max_length=400)


class Blocker(BaseModel):
    label: str = Field(min_length=1, max_length=140)
    severity: str = Field(pattern="^(low|medium|high)$")
    detail: str = Field(min_length=1, max_length=400)
    fixable: bool
    fixable_in_weeks: Optional[int] = Field(default=None, ge=0, le=156)


class Dependency(BaseModel):
    requirement: str = Field(min_length=1, max_length=140)
    depends_on: str = Field(min_length=1, max_length=140)
    status: str = Field(pattern="^(have|need|in_progress|unknown)$")
    note: Optional[str] = Field(default=None, max_length=300)


class VisaDirectionDetail(BaseModel):
    """Strict visa-direction artifact rendered by the frontend's Page 6.

    `legal_disclaimer` is **always** populated — the prompt enforces this
    and the validator will reject empty strings.
    """

    primary_route: PrimaryRoute
    route_difficulty: str = Field(pattern="^(low|medium|high|very_high)$")
    typical_processing_time_label: str = Field(
        min_length=1,
        max_length=80,
        description="human-readable processing window, e.g. '8–14 weeks'",
    )
    alternative_routes: list[AlternativeRoute] = Field(default_factory=list, max_length=5)

    blockers: list[Blocker] = Field(default_factory=list, max_length=10)
    fixable_blockers: list[Blocker] = Field(default_factory=list, max_length=10)
    dependencies: list[Dependency] = Field(default_factory=list, max_length=12)

    legal_disclaimer: str = Field(
        min_length=20,
        max_length=600,
        description="non-removable advisory text the frontend renders verbatim",
    )
