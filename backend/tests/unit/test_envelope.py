"""AnalysisEnvelope contract tests."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.envelope import (
    AnalysisEnvelope,
    AnalysisStatus,
    Assumption,
    AssumptionSource,
    EnvelopeMetadata,
    NextAction,
    Risk,
    RiskSeverity,
)


class _DummyDetail(BaseModel):
    score: int


def _envelope(**overrides) -> dict:
    base = {
        "status": AnalysisStatus.READY,
        "score": 80,
        "summary": "ok",
        "reasoning": "because reasons",
        "risks": [Risk(severity=RiskSeverity.LOW, label="x", detail="y").model_dump()],
        "next_actions": [NextAction(label="a", urgency="now", why="b").model_dump()],
        "confidence": 0.9,
        "metadata": EnvelopeMetadata(
            generated_at=datetime.now(timezone.utc), model="m", prompt_version="v1"
        ).model_dump(),
        "detail": {"score": 1},
        "analysis_version": 1,
        "stale": False,
        "recompute_required": False,
        "stale_reason": None,
        "input_hash": "abcdef12",
        "assumptions": [
            Assumption(
                label="x", source=AssumptionSource.INFERRED, confidence=0.5
            ).model_dump()
        ],
    }
    base.update(overrides)
    return base


def test_envelope_validates_with_assumptions() -> None:
    env = AnalysisEnvelope[_DummyDetail].model_validate(_envelope())
    assert env.status == AnalysisStatus.READY
    assert env.detail.score == 1
    assert env.assumptions[0].source == AssumptionSource.INFERRED


def test_envelope_rejects_empty_assumptions() -> None:
    with pytest.raises(ValidationError):
        AnalysisEnvelope[_DummyDetail].model_validate(_envelope(assumptions=[]))


def test_envelope_score_range() -> None:
    with pytest.raises(ValidationError):
        AnalysisEnvelope[_DummyDetail].model_validate(_envelope(score=120))
    with pytest.raises(ValidationError):
        AnalysisEnvelope[_DummyDetail].model_validate(_envelope(confidence=2.0))
