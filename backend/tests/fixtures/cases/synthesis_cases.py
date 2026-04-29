"""Realistic case fixtures for the final synthesis module."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any


def _far_future_iso(years: int) -> str:
    return (date.today() + timedelta(days=365 * years)).isoformat()


@dataclass
class SynthesisFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)
    family_run_body: dict[str, Any] | None = None


STRONG_MOVER = SynthesisFixture(
    name="strong_mover",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "current_country": "IN",
        "target_country": "DE",
        "target_city": "Berlin",
        "nationality": "IN",
        "needs_visa_sponsorship": True,
        "move_urgency": "12m",
        "work_preference": "hybrid",
        "current_salary": 35000,
        "expected_salary": 85000,
        "salary_currency": "EUR",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(5)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "CV": {"has": True},
        },
    },
    run_body={},
)


BLOCKED_MOVER = SynthesisFixture(
    name="blocked_mover",
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
        "current_salary": 25000,
        "expected_salary": 65000,
        "salary_currency": "GBP",
        "current_document_status": {
            "PASSPORT": {"has": False},
            "CV": {"has": True},
        },
    },
    run_body={},
)


FAMILY_RELOCATION = SynthesisFixture(
    name="family_relocation",
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
        "work_preference": "hybrid",
        "current_salary": 4500000,
        "expected_salary": 130000,
        "salary_currency": "CAD",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(4)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "MARRIAGE_CERT": {"has": True},
            "CHILD_BIRTH_CERT": {"has": True},
        },
    },
    run_body={},
    family_run_body={
        "moving_with_family": True,
        "spouse": {"moving": True, "has_career": True, "profession": "Architect"},
        "children": [{"age": 8, "schooling_need": "primary"}],
        "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
        "housing_requirement": "3BR near school",
        "family_budget_impact": "medium",
    },
)


VISA_CHALLENGING = SynthesisFixture(
    name="visa_challenging",
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
        "current_salary": 250000,
        "expected_salary": 140000,
        "salary_currency": "USD",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(3)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
        },
    },
    run_body={},
)


HIGH_CONFIDENCE = SynthesisFixture(
    name="high_confidence_relocation",
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
        "work_preference": "hybrid",
        "current_salary": 90000000,
        "expected_salary": 110000,
        "salary_currency": "EUR",
        "current_document_status": {
            "PASSPORT": {"has": True, "expires_at": _far_future_iso(7)},
            "EDUCATION_TRANSCRIPTS": {"has": True},
            "CV": {"has": True},
            "EMPLOYMENT_LETTER": {"has": True},
            "BANK_STATEMENT": {"has": True},
        },
    },
    run_body={},
)


ALL_FIXTURES = [
    STRONG_MOVER,
    BLOCKED_MOVER,
    FAMILY_RELOCATION,
    VISA_CHALLENGING,
    HIGH_CONFIDENCE,
]
