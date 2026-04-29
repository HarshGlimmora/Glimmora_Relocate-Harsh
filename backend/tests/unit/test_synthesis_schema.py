"""Synthesis schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.synthesis.schemas import (
    ModuleScore,
    NextBestAction,
    RecommendedDestination,
    RecommendedJobPath,
    SynthesisDetail,
    SynthesisInputs,
    TopBlocker,
)


def _ms(**overrides) -> ModuleScore:
    base = dict(
        kind="visa",
        label="Visa direction",
        score=70,
        confidence=0.8,
        summary="Path is workable.",
    )
    base.update(overrides)
    return ModuleScore.model_validate(base)


def _detail(**overrides) -> SynthesisDetail:
    sentinel = object()
    module_scores = overrides.pop("module_scores", sentinel)
    if module_scores is sentinel:
        module_scores = [_ms(), _ms(kind="finance", label="Financial feasibility", score=65)]
    nbas = overrides.pop("next_best_actions", sentinel)
    if nbas is sentinel:
        nbas = [
            {
                "label": "Confirm visa route",
                "why": "Locks the assumption.",
                "urgency": "this week",
                "effort_hours": 2.0,
            }
        ]
    base = dict(
        feasibility_score=70,
        verdict="go_with_conditions",
        one_line_reasoning="The case is workable with a few conditions.",
        recommended_destination={
            "country": "DE",
            "city": "Berlin",
            "confidence": 0.8,
            "rationale": "Aligned with profile.",
        },
        recommended_job_path={
            "title": "Senior Data Engineer",
            "industry": "Fintech",
            "confidence": 0.7,
            "rationale": "Echoed from profile.",
        },
        module_scores=module_scores,
        module_summaries={"visa": "Path is workable."},
        top_blockers=[],
        next_best_actions=nbas,
        explanation="Long-form explanation goes here.",
        headline_finding="Go with conditions on DE.",
    )
    base.update(overrides)
    return SynthesisDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.verdict == "go_with_conditions"
    assert len(d.module_scores) == 2


def test_verdict_constrained() -> None:
    with pytest.raises(ValidationError):
        _detail(verdict="maybe")


def test_blocker_severity_constrained() -> None:
    with pytest.raises(ValidationError):
        TopBlocker.model_validate(
            {"label": "x", "detail": "y", "severity": "extreme", "source_module": "visa"}
        )


def test_destination_country_two_chars() -> None:
    with pytest.raises(ValidationError):
        RecommendedDestination.model_validate(
            {"country": "DEU", "confidence": 0.5, "rationale": "x"}
        )


def test_module_scores_min_one() -> None:
    with pytest.raises(ValidationError):
        _detail(module_scores=[])


def test_next_best_actions_min_one() -> None:
    with pytest.raises(ValidationError):
        _detail(next_best_actions=[])


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        SynthesisInputs.model_validate({"random": 1})


def test_feasibility_score_bounded() -> None:
    with pytest.raises(ValidationError):
        _detail(feasibility_score=120)
