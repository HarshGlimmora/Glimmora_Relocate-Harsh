"""Realistic case fixtures for the culture-language module."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any


def _far_future_iso(years: int) -> str:
    return (date.today() + timedelta(days=365 * years)).isoformat()


@dataclass
class CultureFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


# Formal workplace culture: Japan
FORMAL_WORKPLACE_JP = CultureFixture(
    name="formal_workplace_japan",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "current_country": "IN",
        "target_country": "JP",
        "target_city": "Tokyo",
        "nationality": "IN",
        "work_preference": "onsite",
        "needs_visa_sponsorship": True,
    },
    run_body={},
)


# Lighter social norms: Netherlands
LIGHT_SOCIAL_NL = CultureFixture(
    name="light_social_netherlands",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Engineer",
        "industry": "SaaS",
        "current_country": "KR",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "nationality": "KR",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
    },
    run_body={},
)


# Language barrier: Germany
LANGUAGE_BARRIER_DE = CultureFixture(
    name="language_barrier_germany",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "industry": "Logistics",
        "current_country": "AR",
        "target_country": "DE",
        "target_city": "Berlin",
        "nationality": "AR",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
    },
    run_body={},
)


# Strong English workplace: UK
STRONG_ENGLISH_GB = CultureFixture(
    name="strong_english_uk",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "Engineering Manager",
        "industry": "Fintech",
        "current_country": "CN",
        "target_country": "GB",
        "target_city": "London",
        "nationality": "CN",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
    },
    run_body={},
)


# Family mover adaptation: Canada
FAMILY_MOVER_CA = CultureFixture(
    name="family_mover_canada",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "current_country": "IN",
        "target_country": "CA",
        "target_city": "Toronto",
        "nationality": "IN",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
        "current_document_status": {
            "MARRIAGE_CERT": {"has": True},
            "CHILD_BIRTH_CERT": {"has": True},
        },
    },
    run_body={},
    # When the family analysis is run for this fixture, pass this body so the
    # prior-summary signals "moving with family / household" to downstream culture.
    # (Stored as an ad-hoc attribute via a class-level helper below.)
)
FAMILY_MOVER_CA_FAMILY_RUN_BODY = {
    "moving_with_family": True,
    "spouse": {"moving": True, "has_career": True, "profession": "Architect"},
    "children": [{"age": 8, "schooling_need": "primary"}],
    "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
    "housing_requirement": "3BR near school",
    "family_budget_impact": "medium",
}


ALL_FIXTURES = [
    FORMAL_WORKPLACE_JP,
    LIGHT_SOCIAL_NL,
    LANGUAGE_BARRIER_DE,
    STRONG_ENGLISH_GB,
    FAMILY_MOVER_CA,
]
