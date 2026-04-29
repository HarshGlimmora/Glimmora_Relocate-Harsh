"""Family schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.family.schemas import (
    ChildOutlook,
    FamilyImpactDetail,
    FamilyInputs,
    FamilySuggestion,
    FamilyWarning,
    HousingFit,
    ParentsOutlook,
    SpouseOutlook,
)


def _solo_detail(**overrides) -> FamilyImpactDetail:
    base = dict(
        mode="solo",
        household_complexity_score=10,
        family_friendly_destination_fit=90,
        spouse=SpouseOutlook(
            moving=False,
            career_outlook="not_applicable",
            visa_pathway="N/A.",
            language_pressure="low",
            support_needs=[],
            note="Solo move.",
        ),
        children=[],
        parents=ParentsOutlook(
            moving=False,
            dependency_level="none",
            healthcare_fit="not_applicable",
            visa_options=[],
            care_recommendations=[],
            note="No parents relocating.",
        ),
        housing_fit=HousingFit(
            pressure="low",
            recommendation="1BR is achievable in 2–4 weeks.",
            typical_lead_time_weeks=4,
        ),
        warnings=[],
        suggestions=[],
    )
    base.update(overrides)
    return FamilyImpactDetail.model_validate(base)


def test_solo_detail_validates() -> None:
    d = _solo_detail()
    assert d.mode == "solo"
    assert d.children == []


def test_with_family_detail_validates() -> None:
    d = _solo_detail(
        mode="with_family",
        household_complexity_score=55,
        family_friendly_destination_fit=72,
        children=[
            ChildOutlook(
                age=7,
                schooling_recommendation="Bilingual primary near Mitte.",
                school_options=["International school", "Bilingual public"],
                language_pressure="medium",
                integration_estimate_months=9,
            )
        ],
        warnings=[
            FamilyWarning(
                severity="medium",
                label="School windows",
                detail="Admissions cap 4 months ahead.",
                affects="children",
            )
        ],
        suggestions=[
            FamilySuggestion(
                label="Pre-register schools",
                detail="Submit 4–6 months ahead.",
                urgency="this_month",
            )
        ],
    )
    assert d.mode == "with_family"
    assert d.children[0].age == 7


def test_mode_constrained_to_known_values() -> None:
    with pytest.raises(ValidationError):
        _solo_detail(mode="duo")


def test_warning_affects_constrained() -> None:
    with pytest.raises(ValidationError):
        FamilyWarning(severity="medium", label="x", detail="y", affects="extended_family")


def test_suggestion_urgency_constrained() -> None:
    with pytest.raises(ValidationError):
        FamilySuggestion(label="x", detail="y", urgency="next_year")


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        FamilyInputs.model_validate(
            {"moving_with_family": True, "random_field": "x"}
        )


def test_input_child_age_range() -> None:
    with pytest.raises(ValidationError):
        FamilyInputs.model_validate(
            {"children": [{"age": 99, "schooling_need": "primary"}]}
        )
