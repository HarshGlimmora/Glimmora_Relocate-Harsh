"""Country-comparison schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.country_comparison.schemas import (
    AccessPointScores,
    CountryComparisonDetail,
    PairedScore,
    StrengthOrBlocker,
)


def _paired(o: int = 50, d: int = 60, note: str = "fine") -> PairedScore:
    return PairedScore(origin=o, destination=d, delta=d - o, note=note)


def _aps() -> AccessPointScores:
    return AccessPointScores(
        job_market_access=_paired(),
        visa_access=_paired(),
        housing_pressure=_paired(),
        healthcare_access=_paired(),
        schooling_access=_paired(),
        cultural_fit=_paired(),
        language_fit=_paired(),
    )


def test_valid_detail_constructs() -> None:
    d = CountryComparisonDetail(
        origin={"country": "IN", "city": "Bangalore"},
        destination={"country": "DE", "city": "Berlin"},
        overall_comparison_score=72,
        destination_suitability_score=75,
        origin_pressure_score=60,
        access_points=_aps(),
        strengths=[StrengthOrBlocker(title="X", detail="Y", side="destination")],
        blockers=[],
        comparison_summary="Real comparison summary.",
        alternatives_considered=[],
    )
    assert d.overall_comparison_score == 72
    assert d.access_points.visa_access.delta == 10


def test_strengths_must_be_non_empty() -> None:
    with pytest.raises(ValidationError):
        CountryComparisonDetail(
            origin={"country": "IN"},
            destination={"country": "DE"},
            overall_comparison_score=70,
            destination_suitability_score=70,
            origin_pressure_score=60,
            access_points=_aps(),
            strengths=[],
            blockers=[],
            comparison_summary="x",
        )


def test_paired_score_range_enforced() -> None:
    with pytest.raises(ValidationError):
        PairedScore(origin=120, destination=50, delta=-70, note="bad")
    with pytest.raises(ValidationError):
        PairedScore(origin=50, destination=50, delta=200, note="bad")


def test_strength_side_constrained() -> None:
    with pytest.raises(ValidationError):
        StrengthOrBlocker(title="x", detail="y", side="middle")
