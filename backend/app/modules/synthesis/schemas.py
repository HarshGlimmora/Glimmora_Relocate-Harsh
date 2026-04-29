"""Final Synthesis contracts.

The artifact is the dashboard verdict. It compresses every upstream
analysis (country comparison, job fit, visa, family, finance, documents,
workflow, culture, timeline) into a single decision-grade payload:

  - `feasibility_score` (0–100): the headline number on the dashboard.
  - `verdict`: a closed enum the frontend uses to colour the verdict
    chip — go / go_with_conditions / wait / reconsider / blocked.
  - `one_line_reasoning`: the elevator-pitch sentence under the chip.
  - `recommended_destination` and `recommended_job_path` echo the user's
    case so the verdict feels personal rather than abstract.
  - `module_scores` + `module_summaries` form the dashboard tile data.
  - `top_blockers` and `next_best_actions` carry the prioritized work.
  - `explanation`: long-form reasoning the user can read on demand.

Consistency with the upstream analyses is enforced at the service level
(see `synthesis/service.py::_validate_synthesis_consistency`).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class SynthesisInputs(BaseModel):
    """Body for POST /synthesis/run.

    No user-facing parameters. All inputs are derived from the case's
    upstream analyses + profile.
    """

    model_config = ConfigDict(extra="forbid")

    force: bool = False


# ----- detail payload -----


class ModuleScore(BaseModel):
    """One row of the dashboard scoreboard."""

    kind: str = Field(
        min_length=1,
        max_length=40,
        description="canonical AnalysisKind value (e.g. 'visa', 'finance')",
    )
    label: str = Field(min_length=1, max_length=80)
    score: int = Field(ge=0, le=100)
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str = Field(min_length=1, max_length=400)
    available: bool = Field(
        default=True,
        description="false when the upstream module hasn't been generated yet for this case",
    )


class TopBlocker(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)
    severity: str = Field(pattern="^(low|medium|high)$")
    source_module: str = Field(
        min_length=1,
        max_length=40,
        description="which upstream analysis kind raised this blocker",
    )


class NextBestAction(BaseModel):
    label: str = Field(min_length=1, max_length=160)
    why: str = Field(min_length=1, max_length=400)
    urgency: str = Field(min_length=1, max_length=40)
    effort_hours: float = Field(ge=0.0, le=200.0)


class RecommendedDestination(BaseModel):
    country: str = Field(min_length=2, max_length=2, description="ISO-3166-1 alpha-2")
    city: Optional[str] = Field(default=None, max_length=80)
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(min_length=1, max_length=400)


class RecommendedJobPath(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    industry: Optional[str] = Field(default=None, max_length=80)
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(min_length=1, max_length=400)


class SynthesisDetail(BaseModel):
    """Strict synthesis artifact rendered by the dashboard."""

    feasibility_score: int = Field(ge=0, le=100)
    verdict: str = Field(
        pattern="^(go|go_with_conditions|wait|reconsider|blocked)$",
        description="dashboard verdict chip",
    )
    one_line_reasoning: str = Field(min_length=1, max_length=240)

    recommended_destination: RecommendedDestination
    recommended_job_path: RecommendedJobPath

    module_scores: list[ModuleScore] = Field(min_length=1, max_length=12)
    module_summaries: dict[str, str] = Field(
        default_factory=dict,
        description="kind -> 1–2 sentence summary; mirrors module_scores for legacy renderers",
    )

    top_blockers: list[TopBlocker] = Field(default_factory=list, max_length=10)
    next_best_actions: list[NextBestAction] = Field(min_length=1, max_length=10)

    explanation: str = Field(min_length=1, max_length=4000)
    headline_finding: str = Field(min_length=1, max_length=400)
