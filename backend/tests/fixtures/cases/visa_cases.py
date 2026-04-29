"""Realistic case fixtures for the visa-direction module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class VisaFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


SPONSOR_REQUIRED = VisaFixture(
    name="sponsor_required",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "years_experience": 7,
        "seniority": "senior",
        "current_country": "IN",
        "current_city": "Bengaluru",
        "target_country": "DE",
        "target_city": "Berlin",
        "nationality": "IN",
        "current_visa_status": None,
        "expected_salary": 85000,
        "salary_currency": "EUR",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "target_country": "DE",
        "nationality": "IN",
        "sponsor_required": True,
        "employment_status": "employed",
        "family_relocation": False,
    },
)


NO_CURRENT_VISA = VisaFixture(
    name="no_current_visa_status",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "industry": "Healthtech",
        "years_experience": 4,
        "seniority": "mid",
        "current_country": "AR",
        "current_city": "Buenos Aires",
        "target_country": "GB",
        "target_city": "London",
        "nationality": "AR",
        "expected_salary": 65000,
        "salary_currency": "GBP",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "target_country": "GB",
        "nationality": "AR",
        "current_visa_status": None,
        "sponsor_required": True,
        "employment_status": "employed",
        "family_relocation": False,
    },
)


FAMILY_RELOCATION = VisaFixture(
    name="family_relocation",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Software Engineer",
        "industry": "Cloud Infra",
        "years_experience": 11,
        "seniority": "staff",
        "current_country": "KR",
        "current_city": "Seoul",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "nationality": "KR",
        "expected_salary": 110000,
        "salary_currency": "EUR",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "target_country": "NL",
        "nationality": "KR",
        "sponsor_required": True,
        "employment_status": "employed",
        "family_relocation": True,
    },
)


HIGH_DIFFICULTY = VisaFixture(
    name="high_difficulty_destination",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "QA Engineer",
        "industry": "Software",
        "years_experience": 5,
        "seniority": "mid",
        "current_country": "CN",
        "current_city": "Shanghai",
        "target_country": "US",
        "target_city": "San Francisco",
        "nationality": "CN",
        "current_visa_status": None,
        "expected_salary": 140000,
        "salary_currency": "USD",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "target_country": "US",
        "nationality": "CN",
        "sponsor_required": True,
        "employment_status": "employed",
        "family_relocation": False,
    },
)


LOW_DIFFICULTY = VisaFixture(
    name="low_difficulty_route",
    profile_patch={
        "full_name": "Marcus Stein",
        "current_role": "Staff Engineer",
        "industry": "AdTech",
        "years_experience": 12,
        "seniority": "staff",
        "current_country": "DE",
        "current_city": "Berlin",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "nationality": "DE",
        # Already holds a Dutch residence permit (e.g., from prior stint)
        "current_visa_status": "NL Long-Term Resident",
        "expected_salary": 130000,
        "salary_currency": "EUR",
        "needs_visa_sponsorship": False,
    },
    run_body={
        "target_country": "NL",
        "nationality": "DE",
        "current_visa_status": "NL Long-Term Resident",
        "sponsor_required": False,
        "employment_status": "employed",
        "family_relocation": False,
    },
)


ALL_FIXTURES = [
    SPONSOR_REQUIRED,
    NO_CURRENT_VISA,
    FAMILY_RELOCATION,
    HIGH_DIFFICULTY,
    LOW_DIFFICULTY,
]
