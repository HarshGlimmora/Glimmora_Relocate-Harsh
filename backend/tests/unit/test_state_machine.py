"""Case state machine tests."""

from __future__ import annotations

import pytest

from app.orchestration.state_machine import (
    InvalidTransition,
    recompute_state,
    transition,
)
from app.schemas.case import CaseState
from app.schemas.envelope import AnalysisStatus


def test_valid_transitions() -> None:
    assert transition(CaseState.DRAFT, CaseState.PROFILE_READY) == CaseState.PROFILE_READY
    assert transition(CaseState.PROFILE_READY, CaseState.ANALYZING) == CaseState.ANALYZING
    assert transition(CaseState.ANALYZING, CaseState.READY) == CaseState.READY
    assert transition(CaseState.READY, CaseState.STALE) == CaseState.STALE
    assert transition(CaseState.STALE, CaseState.READY) == CaseState.READY


def test_invalid_transition_blocks() -> None:
    with pytest.raises(InvalidTransition):
        transition(CaseState.DRAFT, CaseState.READY)
    with pytest.raises(InvalidTransition):
        transition(CaseState.ARCHIVED, CaseState.DRAFT)


def test_recompute_no_modules_returns_current() -> None:
    assert recompute_state(CaseState.DRAFT, [], any_stale=False) == CaseState.DRAFT
    assert (
        recompute_state(CaseState.PROFILE_READY, [], any_stale=False)
        == CaseState.PROFILE_READY
    )


def test_recompute_all_ready() -> None:
    statuses = [AnalysisStatus.READY] * 3
    assert recompute_state(CaseState.ANALYZING, statuses, any_stale=False) == CaseState.READY


def test_recompute_partial() -> None:
    statuses = [AnalysisStatus.READY, AnalysisStatus.GENERATING, AnalysisStatus.READY]
    assert (
        recompute_state(CaseState.ANALYZING, statuses, any_stale=False)
        == CaseState.PARTIALLY_READY
    )


def test_recompute_stale_inflight() -> None:
    statuses = [AnalysisStatus.READY, AnalysisStatus.GENERATING]
    assert (
        recompute_state(CaseState.READY, statuses, any_stale=True)
        == CaseState.PARTIALLY_READY
    )


def test_recompute_stale_idle() -> None:
    statuses = [AnalysisStatus.READY, AnalysisStatus.READY]
    assert recompute_state(CaseState.READY, statuses, any_stale=True) == CaseState.STALE


def test_recompute_archived_pinned() -> None:
    statuses = [AnalysisStatus.READY]
    assert (
        recompute_state(CaseState.ARCHIVED, statuses, any_stale=False) == CaseState.ARCHIVED
    )
