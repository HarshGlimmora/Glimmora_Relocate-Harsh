"""Shared analysis envelope contracts.

Every analysis produced by the system — country comparison, job fit, visa,
family, finance, documents, workflow, culture, timeline, synthesis — returns
an `AnalysisEnvelope[T]` with a typed `detail` payload. The frontend renders
the same card chrome from these fields regardless of analysis kind.

Freshness fields (analysis_version, stale, recompute_required, stale_reason,
input_hash) make partial reruns observable. The mandatory `assumptions[]`
block is enforced by the AI gateway; an empty list is a contract violation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

DetailT = TypeVar("DetailT", bound=BaseModel)


class AnalysisStatus(StrEnum):
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


class AnalysisKind(StrEnum):
    """Closed set of analyses the system produces. New kinds added explicitly."""

    COUNTRY_COMPARISON = "country_comparison"
    JOBFIT = "jobfit"
    VISA = "visa"
    FAMILY = "family"
    FINANCE = "finance"
    DOCUMENTS = "documents"
    WORKFLOW = "workflow"
    CULTURE = "culture"
    TIMELINE = "timeline"
    SYNTHESIS = "synthesis"


class RiskSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Risk(BaseModel):
    severity: RiskSeverity
    label: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=600)


class NextAction(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    urgency: str = Field(min_length=1, max_length=40)
    why: str = Field(min_length=1, max_length=400)


class AssumptionSource(StrEnum):
    """Where an assumption came from. Frontend uses this to colour-code disclosure."""

    INFERRED = "inferred"  # model derived from inputs
    DEFAULT = "default"  # system fallback (e.g., capital city)
    USER = "user"  # confirmed user input
    MODEL = "model"  # LLM asserts a fact from training data — treat with care


class Assumption(BaseModel):
    label: str = Field(min_length=1, max_length=160)
    detail: str | None = Field(default=None, max_length=400)
    source: AssumptionSource
    confidence: float = Field(ge=0.0, le=1.0)


class EnvelopeMetadata(BaseModel):
    generated_at: datetime
    model: str | None = None
    prompt_version: str | None = None
    tokens_in: int | None = None
    tokens_out: int | None = None
    latency_ms: int | None = None

    model_config = ConfigDict(extra="allow")


class AnalysisEnvelope(BaseModel, Generic[DetailT]):
    """The single shape every analysis returns to the frontend."""

    # --- core ---
    status: AnalysisStatus
    score: int | None = Field(default=None, ge=0, le=100)
    summary: str = Field(min_length=1, max_length=400)
    reasoning: str = Field(min_length=1, max_length=4000)
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: EnvelopeMetadata
    detail: DetailT

    # --- freshness ---
    analysis_version: int = Field(ge=1)
    stale: bool = False
    recompute_required: bool = False
    stale_reason: str | None = Field(default=None, max_length=240)
    input_hash: str = Field(min_length=8, max_length=128)

    # --- transparency ---
    assumptions: list[Assumption] = Field(default_factory=list)

    @field_validator("assumptions")
    @classmethod
    def _assumptions_non_empty(cls, v: list[Assumption]) -> list[Assumption]:
        if not v:
            raise ValueError(
                "assumptions must contain at least one item; the gateway should "
                "auto-inject one if the model omitted them."
            )
        return v

    @classmethod
    def now_utc(cls) -> datetime:
        return datetime.now(timezone.utc)


class FailedEnvelope(BaseModel):
    """Sent to the client when the gateway gives up after retries.

    Distinct from AnalysisEnvelope so the frontend can branch on shape, not on
    a status field that might still carry a stale `detail`.
    """

    status: AnalysisStatus = AnalysisStatus.FAILED
    kind: AnalysisKind
    error_code: str
    user_message: str
    metadata: dict[str, Any] = Field(default_factory=dict)
