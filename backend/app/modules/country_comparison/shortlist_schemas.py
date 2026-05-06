"""Country shortlist comparison contracts.

Powers the /country-comparison/shortlist endpoint. Designed for a
visual decision board: ranking + per-country score strips + transition
deltas + counterfactual ("what would change the result?") + decision
fingerprint. No prose — every text field is one short line.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---- Inputs ----------------------------------------------------------------


class ShortlistWeights(BaseModel):
    """Priority weights. All five sum to 1.0 after normalisation.

    The frontend can submit any non-negative numbers; the service
    normalises so the user can use 1–5 sliders.
    """

    model_config = ConfigDict(extra="forbid")

    career: float = Field(default=1.0, ge=0.0, le=10.0)
    cost: float = Field(default=1.0, ge=0.0, le=10.0)
    family: float = Field(default=1.0, ge=0.0, le=10.0)
    lifestyle: float = Field(default=1.0, ge=0.0, le=10.0)
    speed: float = Field(default=1.0, ge=0.0, le=10.0)


class ShortlistRequest(BaseModel):
    """Body for POST /country-comparison/shortlist."""

    model_config = ConfigDict(extra="forbid")

    countries: list[str] = Field(
        min_length=2,
        max_length=5,
        description="ISO-2 codes (uppercase). 2–5 destinations to compare.",
    )
    weights: ShortlistWeights = Field(default_factory=ShortlistWeights)

    @field_validator("countries")
    @classmethod
    def _normalize(cls, v: list[str]) -> list[str]:
        out: list[str] = []
        for s in v:
            up = s.strip().upper()
            if len(up) == 2 and up.isalpha() and up not in out:
                out.append(up)
        return out


# ---- Outputs ---------------------------------------------------------------


class ScoreBreakdown(BaseModel):
    """Per-country metric scores + weighted total."""

    job_market: int = Field(ge=0, le=100)
    salary_power: int = Field(ge=0, le=100)
    employer_sponsor_density: int = Field(ge=0, le=100)
    visa_friction: int = Field(ge=0, le=100)
    speed_to_land: int = Field(ge=0, le=100)
    cost_of_living: int = Field(ge=0, le=100)
    housing_pressure: int = Field(ge=0, le=100)
    quality_of_life: int = Field(ge=0, le=100)
    family_fit: int = Field(ge=0, le=100)
    language_fit: int = Field(ge=0, le=100)


class RankedCountry(BaseModel):
    """One row in the ranking board."""

    code: str = Field(min_length=2, max_length=2)
    name: str
    region: str
    rank: int = Field(ge=1)
    weighted_score: int = Field(ge=0, le=100)
    breakdown: ScoreBreakdown
    top_strength: str = Field(max_length=80, description="Single-phrase highlight.")
    top_risk: str = Field(max_length=80, description="Single-phrase blocker.")
    confidence: float = Field(ge=0.0, le=1.0)


class CategoryWinner(BaseModel):
    """Which country wins on a given metric category."""

    category: str
    winner_code: str
    winner_name: str
    winning_score: int = Field(ge=0, le=100)
    runner_up_name: Optional[str] = None
    margin: int = Field(ge=-100, le=100)


class TransitionDelta(BaseModel):
    """One origin → destination delta entry, per metric."""

    metric: str
    origin_score: int = Field(ge=0, le=100)
    destination_score: int = Field(ge=0, le=100)
    delta: int = Field(ge=-100, le=100, description="destination − origin")
    direction: str = Field(pattern="^(gain|loss|same)$")
    note: str = Field(max_length=120)


class TransitionStrip(BaseModel):
    """Origin → one destination, full strip of metric deltas."""

    origin_code: str
    origin_name: str
    destination_code: str
    destination_name: str
    deltas: list[TransitionDelta] = Field(min_length=1, max_length=10)
    headline_gain: str = Field(max_length=120)
    headline_loss: str = Field(max_length=120)


class Counterfactual(BaseModel):
    """One 'what would change the result?' insight.

    Always references the gap between the current top and the proposed
    challenger. Concrete + numeric — never a vibes-based recommendation.
    """

    challenger_code: str
    challenger_name: str
    over_code: str = Field(description="The country it would overtake")
    over_name: str
    lever: str = Field(
        max_length=40,
        description="Which dimension to change: career | cost | family | lifestyle | speed",
    )
    direction: str = Field(pattern="^(increase|decrease)$")
    threshold_pct: int = Field(
        ge=1,
        le=200,
        description="The smallest % change in the lever's weight that flips the ranking.",
    )
    one_line: str = Field(max_length=160)


class DecisionFingerprint(BaseModel):
    """Compact summary of how the user weights the move."""

    style: str = Field(
        pattern="^(career_first|cost_sensitive|family_heavy|speed_driven|visa_risk_averse|lifestyle_focused|balanced)$",
    )
    label: str = Field(max_length=40)
    one_line: str = Field(max_length=160)
    weight_distribution: dict[str, float] = Field(
        description="Normalised weights summing to 1.0, keyed by lever name.",
    )


class FinalRecommendation(BaseModel):
    """The "what to do next" card at the bottom of the page."""

    winner_code: str
    winner_name: str
    why_one_line: str = Field(max_length=140)
    next_action_label: str = Field(max_length=80)
    next_action_href: str = Field(max_length=80)
    margin_over_runner_up: int = Field(ge=0, le=100)


class DataSourceMeta(BaseModel):
    """Lets the UI disclose freshness / origin of the underlying metrics."""

    source: str
    last_updated: str
    confidence: float = Field(ge=0.0, le=1.0)
    availability: str = Field(pattern="^(live|cached|inferred)$")


class ShortlistResponse(BaseModel):
    """Body for the visual country decision board."""

    countries: list[RankedCountry] = Field(min_length=2, max_length=5)
    category_winners: list[CategoryWinner] = Field(min_length=1)
    transitions: list[TransitionStrip] = Field(default_factory=list)
    counterfactuals: list[Counterfactual] = Field(default_factory=list, max_length=4)
    fingerprint: DecisionFingerprint
    final: FinalRecommendation
    source: DataSourceMeta
    assumptions: list[str] = Field(default_factory=list, max_length=8)
