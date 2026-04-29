"""Job-fit schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.job_fit.schemas import (
    AlternativeRole,
    JobFitDetail,
    JobPathway,
    KeyGap,
    RoleMatchDetail,
    SalaryRange,
    SalaryRealismDetail,
    SkillItem,
    TransferableSkill,
    VisaEmployabilityDetail,
)


def _detail(**overrides) -> JobFitDetail:
    base = dict(
        overall_job_fit_score=80,
        role_match=RoleMatchDetail(
            score=82,
            target_role_inferred="Senior Data Engineer",
            confidence=0.7,
            rationale="Profile fits.",
        ),
        salary_realism=SalaryRealismDetail(
            score=70,
            user_expectation=SalaryRange(min=80000, p50=87500, max=95000, currency="EUR"),
            market_estimate=SalaryRange(min=78000, p50=88000, max=110000, currency="EUR"),
            gap_pct=0,
            note="In line.",
        ),
        visa_employability=VisaEmployabilityDetail(
            score=72,
            sponsor_friendly_employer_density="medium",
            typical_sponsor_titles=["Senior Data Engineer"],
            note="OK.",
        ),
        skill_alignment={
            "aligned": [SkillItem(name="Python", why="On resume.").model_dump()],
            "missing": [SkillItem(name="German A2", why="Often expected.").model_dump()],
            "transferable": [
                TransferableSkill(
                    name="Airflow", transfers_to="Workflow orchestration", note="Maps."
                ).model_dump()
            ],
        },
        inferred_target_roles=["Senior Data Engineer"],
        alternative_roles=[
            AlternativeRole(role="Analytics Engineer", fit_score=70, why="Adjacent.")
        ],
        pathways=[
            JobPathway(
                name="Direct sponsor pipeline",
                steps=["List sponsors", "Apply 10/wk"],
                time_to_offer_weeks=12,
                confidence=0.6,
            )
        ],
        estimated_time_to_offer_weeks=14,
        key_gaps=[
            KeyGap(
                label="Local language",
                severity="medium",
                fixable_in_weeks=24,
                detail="Soft blocker.",
            )
        ],
    )
    base.update(overrides)
    return JobFitDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.overall_job_fit_score == 80
    assert d.role_match.target_role_inferred == "Senior Data Engineer"
    assert d.pathways[0].time_to_offer_weeks == 12


def test_pathways_must_be_non_empty() -> None:
    with pytest.raises(ValidationError):
        _detail(pathways=[])


def test_score_ranges_enforced() -> None:
    with pytest.raises(ValidationError):
        _detail(overall_job_fit_score=120)


def test_salary_realism_gap_range_enforced() -> None:
    with pytest.raises(ValidationError):
        SalaryRealismDetail(
            score=10,
            user_expectation=SalaryRange(min=1, p50=2, max=3, currency="EUR"),
            market_estimate=SalaryRange(min=1, p50=2, max=3, currency="EUR"),
            gap_pct=999,
            note="bad",
        )


def test_key_gap_severity_constrained() -> None:
    with pytest.raises(ValidationError):
        KeyGap(label="x", severity="extreme", fixable_in_weeks=4, detail="bad")
