"""Dependency map tests."""

from __future__ import annotations

from app.orchestration.dependency_map import (
    TOPOLOGICAL_ORDER,
    all_known_input_keys,
    impacted_modules,
)
from app.schemas.envelope import AnalysisKind


def test_salary_change_only_finance_plus_synthesis() -> None:
    out = impacted_modules({"current_salary"})
    assert out == [AnalysisKind.FINANCE, AnalysisKind.SYNTHESIS]


def test_target_country_change_invalidates_widely() -> None:
    out = impacted_modules({"target_country"})
    assert AnalysisKind.COUNTRY_COMPARISON in out
    assert AnalysisKind.VISA in out
    assert AnalysisKind.JOBFIT in out
    assert AnalysisKind.DOCUMENTS in out
    assert AnalysisKind.CULTURE in out
    assert AnalysisKind.WORKFLOW in out
    assert AnalysisKind.TIMELINE in out
    assert AnalysisKind.SYNTHESIS in out
    # Topological order preserved.
    assert out == [m for m in TOPOLOGICAL_ORDER if m in out]


def test_family_change_invalidates_family_finance_docs_workflow_timeline_synthesis() -> None:
    out = impacted_modules({"moving_with_family"})
    assert set(out) == {
        AnalysisKind.FAMILY,
        AnalysisKind.FINANCE,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
        AnalysisKind.SYNTHESIS,
    }


def test_unknown_key_no_impact() -> None:
    assert impacted_modules({"random_field_we_dont_track"}) == []


def test_priority_only_synthesis() -> None:
    assert impacted_modules({"priority_ranking"}) == [AnalysisKind.SYNTHESIS]


def test_keys_set_is_non_trivial() -> None:
    assert len(all_known_input_keys()) > 15
