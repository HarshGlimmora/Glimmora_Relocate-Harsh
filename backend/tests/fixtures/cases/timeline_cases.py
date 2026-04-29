"""Realistic case fixtures for the timeline module."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any


def _far_future_iso(years: int) -> str:
    return (date.today() + timedelta(days=365 * years)).isoformat()


@dataclass
class TimelineFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


URGENT_MOVE = TimelineFixture(
    name="urgent_move",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "current_country": "IN",
        "target_country": "DE",
        "target_city": "Berlin",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "move_urgency": "asap",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(5)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "CV": {"has": True},
        },
    },
    run_body={},
)


VISA_HEAVY = TimelineFixture(
    name="visa_heavy_move",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "QA Engineer",
        "industry": "SaaS",
        "current_country": "CN",
        "target_country": "US",
        "target_city": "San Francisco",
        "nationality": "CN",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(3)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
        },
    },
    run_body={},
)


FAMILY_DELAYED = TimelineFixture(
    name="family_with_dependency_delays",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "current_country": "IN",
        "target_country": "CA",
        "target_city": "Toronto",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(4)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "MARRIAGE_CERT": {"has": True},
            "CHILD_BIRTH_CERT": {"has": True},
        },
    },
    run_body={},
)


SLOW_FEASIBLE = TimelineFixture(
    name="slow_feasible_relocation",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Engineer",
        "industry": "SaaS",
        "current_country": "KR",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "nationality": "KR",
        "needs_visa_sponsorship": True,
        "move_urgency": "exploring",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(6)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "CV": {"has": True},
        },
    },
    run_body={},
)


BLOCKED_CASE = TimelineFixture(
    name="blocked_relocation",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "industry": "Logistics",
        "current_country": "AR",
        "target_country": "GB",
        "target_city": "London",
        "nationality": "AR",
        "needs_visa_sponsorship": True,
        "move_urgency": "6m",
        "current_document_status": {
            # Passport not held → blocker on application phase
            "PASSPORT": {"has": False},
            "CV": {"has": True},
        },
    },
    run_body={},
)


FAMILY_RUN_BODY_FOR_FAMILY_DELAYED = {
    "moving_with_family": True,
    "spouse": {"moving": True, "has_career": True, "profession": "Architect"},
    "children": [
        {"age": 5, "schooling_need": "primary"},
        {"age": 9, "schooling_need": "primary"},
    ],
    "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
    "housing_requirement": "3BR near international school",
    "family_budget_impact": "medium",
}


ALL_FIXTURES = [
    URGENT_MOVE,
    VISA_HEAVY,
    FAMILY_DELAYED,
    SLOW_FEASIBLE,
    BLOCKED_CASE,
]
