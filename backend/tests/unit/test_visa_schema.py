"""Visa-direction schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.visa.schemas import (
    AlternativeRoute,
    Blocker,
    Dependency,
    PrimaryRoute,
    RouteRequirement,
    VisaDirectionDetail,
)


def _route() -> PrimaryRoute:
    return PrimaryRoute(
        name="EU Blue Card",
        code="2009/50/EC",
        difficulty="medium",
        typical_processing_weeks_min=8,
        typical_processing_weeks_max=14,
        sponsor_required=True,
        family_friendly=True,
        requirements=[
            RouteRequirement(
                label="Valid passport",
                detail="12 months validity required.",
                user_meets="unknown",
            )
        ],
        rationale="Standard route for skilled non-EU workers.",
    )


def _detail(**overrides) -> VisaDirectionDetail:
    base = dict(
        primary_route=_route(),
        route_difficulty="medium",
        typical_processing_time_label="8–14 weeks",
        alternative_routes=[
            AlternativeRoute(
                name="National skilled-worker visa",
                difficulty="medium",
                why_consider="Lower threshold.",
            )
        ],
        blockers=[
            Blocker(
                label="No employer offer",
                severity="high",
                detail="Sponsor-driven route.",
                fixable=True,
                fixable_in_weeks=12,
            )
        ],
        fixable_blockers=[
            Blocker(
                label="No employer offer",
                severity="high",
                detail="Sponsor-driven route.",
                fixable=True,
                fixable_in_weeks=12,
            )
        ],
        dependencies=[
            Dependency(
                requirement="Sponsor offer",
                depends_on="Job-fit pipeline",
                status="need",
            )
        ],
        legal_disclaimer=(
            "This is directional guidance, not legal advice. Consult a licensed adviser."
        ),
    )
    base.update(overrides)
    return VisaDirectionDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.primary_route.name == "EU Blue Card"
    assert d.legal_disclaimer.startswith("This is directional")


def test_legal_disclaimer_required_min_length() -> None:
    with pytest.raises(ValidationError):
        _detail(legal_disclaimer="too short")


def test_difficulty_enum_constrained() -> None:
    with pytest.raises(ValidationError):
        _detail(route_difficulty="extreme")


def test_route_requirement_user_meets_constrained() -> None:
    with pytest.raises(ValidationError):
        RouteRequirement(label="x", detail="y", user_meets="maybe")


def test_dependency_status_constrained() -> None:
    with pytest.raises(ValidationError):
        Dependency(requirement="x", depends_on="y", status="possibly")


def test_primary_route_requires_at_least_one_requirement() -> None:
    with pytest.raises(ValidationError):
        PrimaryRoute(
            name="x",
            difficulty="low",
            typical_processing_weeks_min=4,
            typical_processing_weeks_max=8,
            sponsor_required=False,
            family_friendly=True,
            requirements=[],
            rationale="x",
        )
