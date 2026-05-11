"""Shared analysis envelope contracts.

Every analysis produced by the system — country comparison, job fit, visa,
family, finance, documents, workflow, culture, timeline, synthesis — returns
an `AnalysisEnvelope[T]` with a typed `detail` payload. The frontend renders
the same card chrome from these fields regardless of analysis kind.

Freshness fields (analysis_version, stale, recompute_required, stale_reason,
input_hash) make partial reruns observable. The mandatory `assumptions[]`
block is enforced by the AI gateway; an empty list is a contract violation.

String-length policy
--------------------
LLMs do not reliably honour exact character limits even when instructed; a
prompt that says "summary <= 400 chars" can yield 463 chars on a flaky
generation. Letting Pydantic reject the response would turn a soft overrun
into a hard 500 for the user. Instead, every user-visible string field uses
the `_truncated(...)` factory: limits are bumped to a generous ceiling AND a
`BeforeValidator` truncates with an ellipsis if the model still overshoots.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated, Any, Generic, TypeVar

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator

DetailT = TypeVar("DetailT", bound=BaseModel)


def _truncate_string(max_len: int):
    """Pydantic BeforeValidator: cap a string at `max_len` with a trailing ellipsis.

    Run BEFORE the standard string validation, so the value Pydantic
    eventually sees is already in-bounds and length constraints can never
    raise. Empty / non-string inputs are passed through untouched.
    """
    def _impl(value: Any) -> Any:
        if not isinstance(value, str):
            return value
        if len(value) <= max_len:
            return value
        # Trim to (max_len - 1) and append a single ellipsis so the visible
        # length is exactly max_len. We strip first to avoid awkward "
        # …" results from trailing whitespace.
        trimmed = value[: max_len - 1].rstrip()
        return f"{trimmed}…"
    return _impl


def _TruncatedStr(max_length: int, *, min_length: int = 0):
    """Annotated string type with auto-truncation BEFORE length validation.

    The schema still ADVERTISES `max_length` in OpenAPI so the prompt-side
    instructions remain accurate; the truncator just absorbs the slack.
    """
    return Annotated[
        str,
        BeforeValidator(_truncate_string(max_length)),
        Field(min_length=min_length, max_length=max_length),
    ]


def _OptionalTruncatedStr(max_length: int):
    """Optional version of `_TruncatedStr` — safe with `None` values.

    Pydantic 2.13's `max_length_validator` raises `TypeError` if it ever
    encounters `None`, even when the field type is `str | None`. So instead
    of stacking a `Field(max_length=...)` constraint on an Optional[str], we
    rely on the `BeforeValidator` alone to enforce the cap (it short-circuits
    on non-string inputs). The cap is therefore enforced via truncation
    only — there is no validation step that can reject `None`.
    """
    return Annotated[
        str | None,
        BeforeValidator(_truncate_string(max_length)),
        Field(default=None),
    ]


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
    label: _TruncatedStr(160, min_length=1) = Field(...)
    detail: _TruncatedStr(800, min_length=1) = Field(...)


class NextAction(BaseModel):
    label: _TruncatedStr(160, min_length=1) = Field(...)
    urgency: _TruncatedStr(60, min_length=1) = Field(...)
    why: _TruncatedStr(600, min_length=1) = Field(...)


class AssumptionSource(StrEnum):
    """Where an assumption came from. Frontend uses this to colour-code disclosure."""

    INFERRED = "inferred"  # model derived from inputs
    DEFAULT = "default"  # system fallback (e.g., capital city)
    USER = "user"  # confirmed user input
    MODEL = "model"  # LLM asserts a fact from training data — treat with care


class Assumption(BaseModel):
    label: _TruncatedStr(200, min_length=1) = Field(...)
    detail: _OptionalTruncatedStr(600)
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
    summary: _TruncatedStr(600, min_length=1) = Field(...)
    reasoning: _TruncatedStr(6000, min_length=1) = Field(...)
    risks: list[Risk] = Field(default_factory=list)
    next_actions: list[NextAction] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: EnvelopeMetadata
    detail: DetailT

    # --- freshness ---
    analysis_version: int = Field(ge=1)
    stale: bool = False
    recompute_required: bool = False
    stale_reason: _OptionalTruncatedStr(320)
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
