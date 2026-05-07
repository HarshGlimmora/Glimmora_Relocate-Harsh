"""Country shortlist comparison contracts.

Powers the /country-comparison/shortlist endpoint. Designed for a
visual decision board: ranking + per-country drilldowns + dimension
reasoning + switchability matrix + decision fingerprint. No prose —
every text field is one short line.

Hard caps
---------
- The shortlist is capped at **3 countries**. The frontend enforces
  the same cap; the backend rejects requests with more so the API
  contract is the single source of truth.
- Every chart payload (sensitivity curves, comparison series, etc.)
  is plain numeric arrays — no "TBD" / placeholder strings allowed.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Hard cap on simultaneous shortlist size — keep this in sync with the
# frontend constant in `apps/consumer/app/app/country/decision-board.tsx`.
SHORTLIST_MAX = 3


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
        max_length=SHORTLIST_MAX,
        description=f"ISO-2 codes (uppercase). 2–{SHORTLIST_MAX} destinations to compare.",
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
        if len(out) > SHORTLIST_MAX:
            raise ValueError(
                f"shortlist exceeds the {SHORTLIST_MAX}-country cap; remove a country first.",
            )
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


class LeverScores(BaseModel):
    """Per-country aggregated lever scores (the 5 axes the user weights).

    Used by the radar / composition chart on each country drilldown.
    """

    career: int = Field(ge=0, le=100)
    cost: int = Field(ge=0, le=100)
    family: int = Field(ge=0, le=100)
    lifestyle: int = Field(ge=0, le=100)
    speed: int = Field(ge=0, le=100)
    visa: int = Field(
        ge=0, le=100,
        description="Visa friendliness — distinct from `speed` for the radar chart.",
    )


class SensitivityPoint(BaseModel):
    """One x/y point on a sensitivity curve."""

    weight: float = Field(
        ge=0.0, le=1.0,
        description="The lever's weight share, 0.0 → 1.0 of the total budget.",
    )
    score: int = Field(
        ge=0, le=100,
        description="Country's resulting weighted score at that weight.",
    )
    rank: int = Field(
        ge=1, le=SHORTLIST_MAX,
        description="Rank among the shortlist at that weight.",
    )


class SensitivityCurve(BaseModel):
    """How a country's score / rank moves as ONE lever's weight sweeps."""

    lever: str = Field(pattern="^(career|cost|family|lifestyle|speed)$")
    points: list[SensitivityPoint] = Field(min_length=3)
    crossover_weight: Optional[float] = Field(
        default=None,
        ge=0.0, le=1.0,
        description=(
            "If the country's rank flips inside the sweep, the lever-weight "
            "value at which the flip happens (e.g. 0.42). None if no flip."
        ),
    )


class ComparisonSeries(BaseModel):
    """One country's series for the cross-shortlist comparison line chart."""

    code: str
    name: str
    values: list[int] = Field(
        min_length=10, max_length=10,
        description="One score per dimension, in the same order as `dimension_labels`.",
    )


class TransitionCurvePoint(BaseModel):
    """One point on the origin → destination transition line chart."""

    metric: str
    origin: int = Field(ge=0, le=100)
    destination: int = Field(ge=0, le=100)


class CountryDrilldown(BaseModel):
    """Chart-ready, per-country deep dive payload.

    The frontend renders one of these per ranked country, behind an
    "expand" interaction. Everything inside is a value — no template
    strings, no client-side fabrication.
    """

    code: str
    summary_one_line: str = Field(max_length=140)
    biggest_advantage: str = Field(max_length=80)
    biggest_risk: str = Field(max_length=80)

    lever_scores: LeverScores
    breakdown: ScoreBreakdown

    sensitivity_curves: list[SensitivityCurve] = Field(min_length=5, max_length=5)
    transition_curve: list[TransitionCurvePoint] = Field(default_factory=list)

    # Threshold table — for the country's own switchability story. Each
    # entry is "if X moves by N%, this country's rank changes." Empty
    # for the current #1.
    rank_change_thresholds: list["LeverThreshold"] = Field(default_factory=list)

    score_components: list["ScoreComponent"] = Field(min_length=5, max_length=5)


class ScoreComponent(BaseModel):
    """One bar in the score-composition chart for a country."""

    lever: str = Field(pattern="^(career|cost|family|lifestyle|speed)$")
    raw_score: int = Field(ge=0, le=100)
    weight: float = Field(ge=0.0, le=1.0)
    contribution: int = Field(
        ge=0, le=100,
        description="raw_score * weight (rounded). Sums roughly to weighted_score.",
    )


class LeverThreshold(BaseModel):
    """How much the user must shift one lever for this country to change rank."""

    lever: str = Field(pattern="^(career|cost|family|lifestyle|speed)$")
    direction: str = Field(pattern="^(increase|decrease)$")
    threshold_pct: int = Field(ge=1, le=200)
    flips_to_rank: int = Field(ge=1, le=SHORTLIST_MAX)
    one_line: str = Field(max_length=160)


class RankedCountry(BaseModel):
    """One row in the ranking board."""

    code: str = Field(min_length=2, max_length=2)
    name: str
    region: str
    rank: int = Field(ge=1, le=SHORTLIST_MAX)
    weighted_score: int = Field(ge=0, le=100)
    breakdown: ScoreBreakdown
    lever_scores: LeverScores
    top_strength: str = Field(max_length=80, description="Single-phrase highlight.")
    top_risk: str = Field(max_length=80, description="Single-phrase blocker.")
    confidence: float = Field(ge=0.0, le=1.0)
    drilldown: CountryDrilldown


class DimensionScore(BaseModel):
    """Per-country score on a single dimension — fuels the per-row chart."""

    code: str
    name: str
    score: int = Field(ge=0, le=100)


class DimensionWinner(BaseModel):
    """Who wins on one dimension, with the reasoning fully expanded.

    Replaces the older flat `CategoryWinner` — the frontend now expands
    each row to show the parameter-level reasoning and a small chart.
    """

    dimension: str = Field(
        pattern="^(career|cost|family|lifestyle|speed|visa)$",
        description="Which lever / dimension this row is about.",
    )
    label: str = Field(max_length=40)
    winner_code: str = Field(min_length=2, max_length=2)
    winner_name: str
    winning_score: int = Field(ge=0, le=100)
    runner_up_code: Optional[str] = None
    runner_up_name: Optional[str] = None
    margin: int = Field(ge=-100, le=100)

    # Bar-chart payload: one entry per shortlisted country.
    series: list[DimensionScore] = Field(min_length=2, max_length=SHORTLIST_MAX)

    # Reasoning: the underlying metrics that drive this dimension and
    # how each shortlisted country scores on them.
    contributing_metrics: list["DimensionContributingMetric"] = Field(min_length=1)

    reason_one_line: str = Field(max_length=160)


class DimensionContributingMetric(BaseModel):
    """One sub-metric contributing to a dimension, with per-country values."""

    metric_key: str
    metric_label: str = Field(max_length=40)
    weight: float = Field(
        ge=0.0, le=1.0,
        description="Coefficient of this metric inside the lever's lever_score.",
    )
    series: list[DimensionScore] = Field(min_length=2, max_length=SHORTLIST_MAX)


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


class SwitchabilityRow(BaseModel):
    """One row in the switchability matrix.

    For challenger X to overtake winner W, by how much does each lever
    need to shift? Returns one threshold per (challenger, lever) pair —
    so the frontend can render the entire matrix as a horizontal bar
    chart and show the sensitivity at a glance.
    """

    challenger_code: str
    challenger_name: str
    over_code: str
    over_name: str
    lever: str = Field(pattern="^(career|cost|family|lifestyle|speed)$")
    direction: str = Field(pattern="^(increase|decrease)$")
    # `null` if the threshold is unreachable in [-100%, +200%] — the
    # frontend renders these as "not reachable" so we never show a
    # fake or capped value.
    threshold_pct: Optional[int] = Field(default=None, ge=1, le=200)
    one_line: str = Field(max_length=160)


class Counterfactual(BaseModel):
    """One headline 'what would change the result?' insight.

    Always references the gap between the current top and the proposed
    challenger. Concrete + numeric — never a vibes-based recommendation.
    Surfaces the smallest threshold from the switchability matrix.
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

    countries: list[RankedCountry] = Field(min_length=2, max_length=SHORTLIST_MAX)

    # Cross-country comparison line graph fuel. Each country's value
    # array follows `dimension_labels` index-for-index.
    dimension_labels: list[str] = Field(min_length=10, max_length=10)
    comparison_series: list[ComparisonSeries] = Field(min_length=2, max_length=SHORTLIST_MAX)

    dimension_winners: list[DimensionWinner] = Field(min_length=1)
    transitions: list[TransitionStrip] = Field(default_factory=list)

    # Headline counterfactuals — the smallest single-lever flip per
    # (winner, challenger) pair. Capped at 4 (3 challengers × 1 best
    # threshold + 1 cross-lever swap if needed).
    counterfactuals: list[Counterfactual] = Field(default_factory=list, max_length=4)

    # Full switchability matrix: every (challenger, lever) threshold,
    # including unreachable ones (threshold_pct=None). The UI renders
    # this as the dedicated "switchability" panel.
    switchability: list[SwitchabilityRow] = Field(default_factory=list)

    fingerprint: DecisionFingerprint
    final: FinalRecommendation
    source: DataSourceMeta
    assumptions: list[str] = Field(default_factory=list, max_length=8)


# Resolve the forward references inside CountryDrilldown.
CountryDrilldown.model_rebuild()
DimensionWinner.model_rebuild()
