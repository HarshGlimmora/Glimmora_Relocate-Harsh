"""Realistic case fixtures for the country-comparison module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class CaseFixture:
    """A bundle of profile-patch + run-body matching one persona."""

    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


SOLO_MOVER = CaseFixture(
    name="solo_mover",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "years_experience": 7,
        "seniority": "senior",
        "skills": [
            {"name": "Python"},
            {"name": "Spark"},
            {"name": "Postgres"},
        ],
        "current_country": "IN",
        "current_city": "Bengaluru",
        "target_country": "DE",
        "target_city": "Berlin",
        "current_salary": 4200000,
        "expected_salary": 75000,
        "salary_currency": "EUR",
        "move_urgency": "6m",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
        "priority_ranking": ["career", "cost", "lifestyle"],
    },
    run_body={
        "current_job_situation": "employed",
        "job_search_status": "active",
        "reason_for_moving": "Higher comp + better long-term residency path.",
        "origin_constraints": "Notice period of 60 days; no dependents.",
    },
)


VISA_CONCERNED = CaseFixture(
    name="visa_concerned_mover",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "industry": "Healthtech",
        "years_experience": 4,
        "seniority": "mid",
        "skills": [{"name": "Go"}, {"name": "Kubernetes"}],
        "current_country": "AR",
        "current_city": "Buenos Aires",
        "target_country": "CA",
        "target_city": "Toronto",
        "current_salary": 36000,
        "expected_salary": 110000,
        "salary_currency": "CAD",
        "move_urgency": "12m",
        "work_preference": "remote",
        "needs_visa_sponsorship": True,
        "priority_ranking": ["career", "speed"],
    },
    run_body={
        "current_job_situation": "employed",
        "job_search_status": "passive",
        "reason_for_moving": "Limited senior career opportunities locally.",
        "origin_constraints": "Concerned about the visa-sponsorship path.",
    },
)


CONSTRAINED_ORIGIN = CaseFixture(
    name="strong_origin_constraints",
    profile_patch={
        "full_name": "Zara Khan",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "years_experience": 9,
        "seniority": "senior",
        "skills": [{"name": "Product Strategy"}, {"name": "Analytics"}],
        "current_country": "PK",
        "current_city": "Lahore",
        "target_country": "AE",
        "target_city": "Dubai",
        "current_salary": 4800000,
        "expected_salary": 360000,
        "salary_currency": "AED",
        "move_urgency": "asap",
        "work_preference": "onsite",
        "needs_visa_sponsorship": True,
        "priority_ranking": ["speed", "career", "family"],
    },
    run_body={
        "current_job_situation": "employed",
        "job_search_status": "active",
        "reason_for_moving": "Career growth + family safety.",
        "origin_constraints": (
            "Aging parent at home; need a destination with reachable flights "
            "and good emergency healthcare access."
        ),
    },
)


COMPARING_TWO_COUNTRIES = CaseFixture(
    name="comparing_two_countries",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Software Engineer",
        "industry": "Cloud Infra",
        "years_experience": 11,
        "seniority": "staff",
        "skills": [{"name": "Distributed Systems"}, {"name": "Rust"}],
        "current_country": "KR",
        "current_city": "Seoul",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "current_salary": 95000000,
        "expected_salary": 110000,
        "salary_currency": "EUR",
        "move_urgency": "12m",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
        "priority_ranking": ["career", "lifestyle", "family"],
    },
    run_body={
        "current_job_situation": "employed",
        "job_search_status": "active",
        "reason_for_moving": "European base for next career chapter.",
        "origin_constraints": "Spouse open to relocation but career dependency.",
        "open_to_alternatives": True,
        "alternatives": ["DE", "IE"],
    },
)


ALL_FIXTURES = [
    SOLO_MOVER,
    VISA_CONCERNED,
    CONSTRAINED_ORIGIN,
    COMPARING_TWO_COUNTRIES,
]
