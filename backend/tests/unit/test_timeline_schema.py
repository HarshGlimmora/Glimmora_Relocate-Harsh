"""Timeline schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from datetime import date
from pydantic import ValidationError

from app.modules.timeline.schemas import (
    TimelineBlocker,
    TimelineDetail,
    TimelineInputs,
    TimelineMilestone,
    TimelinePhase,
)


def _phase(**overrides) -> TimelinePhase:
    base = dict(
        id="pre_application",
        label="Document & route preparation",
        category="pre_application",
        start_week=0,
        end_week=4,
        description="Gather docs and confirm visa route.",
    )
    base.update(overrides)
    return TimelinePhase.model_validate(base)


def _milestone(**overrides) -> TimelineMilestone:
    base = dict(
        id="documents_complete",
        label="Documents complete",
        target_week=4,
        phase_id="pre_application",
        depends_on=[],
        why="All apostilled docs ready.",
    )
    base.update(overrides)
    return TimelineMilestone.model_validate(base)


def _detail(**overrides) -> TimelineDetail:
    sentinel = object()
    phases = overrides.pop("phases", sentinel)
    if phases is sentinel:
        phases = [
            _phase(id="p1", start_week=0, end_week=4),
            _phase(id="p2", category="application", start_week=4, end_week=6),
        ]
    milestones = overrides.pop("milestones", sentinel)
    if milestones is sentinel:
        milestones = [
            _milestone(id="m1", phase_id="p1", target_week=2),
            _milestone(id="m2", phase_id="p2", target_week=6, depends_on=["m1"]),
            _milestone(id="m3", phase_id="p2", target_week=6),
        ]
    base = dict(
        start_anchor="today",
        earliest_realistic_start_date=date.today(),
        phases=phases,
        milestones=milestones,
        blockers=[],
        estimated_total_weeks_min=20,
        estimated_total_weeks_max=30,
        critical_milestones=["m1", "m2"],
        headline_finding="Plan spans 20–30 weeks.",
    )
    base.update(overrides)
    return TimelineDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.start_anchor == "today"
    assert len(d.phases) == 2
    assert len(d.milestones) == 3


def test_start_anchor_constrained() -> None:
    with pytest.raises(ValidationError):
        _detail(start_anchor="yesterday")


def test_phases_min_two() -> None:
    with pytest.raises(ValidationError):
        _detail(phases=[_phase()])


def test_milestones_min_three() -> None:
    with pytest.raises(ValidationError):
        _detail(milestones=[_milestone(id="m1"), _milestone(id="m2")])


def test_blocker_severity_constrained() -> None:
    with pytest.raises(ValidationError):
        TimelineBlocker.model_validate(
            {
                "label": "x",
                "detail": "y",
                "severity": "extreme",
                "estimated_unblock_weeks": 1,
            }
        )


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        TimelineInputs.model_validate({"random": 1})


def test_total_weeks_must_be_at_least_one() -> None:
    with pytest.raises(ValidationError):
        _detail(estimated_total_weeks_min=0, estimated_total_weeks_max=10)
