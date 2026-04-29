"""Realistic case fixtures for the job-fit module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class JobFitFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


STRONG_MATCH = JobFitFixture(
    name="strong_role_match",
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
            {"name": "Airflow"},
        ],
        "current_country": "IN",
        "current_city": "Bengaluru",
        "target_country": "DE",
        "target_city": "Berlin",
        "expected_salary": 85000,
        "salary_currency": "EUR",
        "move_urgency": "6m",
        "work_preference": "hybrid",
        "needs_visa_sponsorship": True,
        "priority_ranking": ["career", "cost"],
    },
    run_body={
        "current_role": "Senior Data Engineer",
        "target_role": "Senior Data Engineer",
        "preferred_industry": "Fintech",
        "years_experience": 7,
        "salary_range_min": 80000,
        "salary_range_max": 95000,
        "salary_currency": "EUR",
        "work_mode": "hybrid",
        "needs_visa_sponsorship": True,
        "open_to_role_change": False,
    },
)


ROLE_MISMATCH = JobFitFixture(
    name="role_mismatch",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Civil Engineer",
        "industry": "Construction",
        "years_experience": 6,
        "seniority": "mid",
        "skills": [{"name": "AutoCAD"}, {"name": "Project Management"}],
        "current_country": "IN",
        "current_city": "Mumbai",
        "target_country": "CA",
        "target_city": "Toronto",
        "expected_salary": 95000,
        "salary_currency": "CAD",
        "move_urgency": "12m",
        "work_preference": "onsite",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "current_role": "Civil Engineer",
        "target_role": "Software Engineer",
        "preferred_industry": "Software",
        "years_experience": 6,
        "salary_range_min": 90000,
        "salary_range_max": 110000,
        "salary_currency": "CAD",
        "work_mode": "hybrid",
        "needs_visa_sponsorship": True,
        "open_to_role_change": True,
    },
)


HIGH_EXP_LOW_REALISM = JobFitFixture(
    name="high_exp_low_salary_realism",
    profile_patch={
        "full_name": "Marcus Stein",
        "current_role": "Staff Engineer",
        "industry": "AdTech",
        "years_experience": 12,
        "seniority": "staff",
        "skills": [{"name": "Distributed Systems"}, {"name": "Go"}],
        "current_country": "DE",
        "current_city": "Berlin",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "expected_salary": 220000,
        "salary_currency": "EUR",
        "needs_visa_sponsorship": False,
    },
    run_body={
        "current_role": "Staff Engineer",
        "target_role": "Staff Engineer",
        "preferred_industry": "AdTech",
        "years_experience": 12,
        "salary_range_min": 200000,
        "salary_range_max": 240000,
        "salary_currency": "EUR",
        "work_mode": "hybrid",
        "needs_visa_sponsorship": False,
        "open_to_role_change": False,
    },
)


VISA_SPONSORSHIP_REQUIRED = JobFitFixture(
    name="visa_sponsorship_required",
    profile_patch={
        "full_name": "Ngozi Okafor",
        "current_role": "Backend Engineer",
        "industry": "Fintech",
        "years_experience": 4,
        "seniority": "mid",
        "skills": [{"name": "Java"}, {"name": "Kafka"}, {"name": "AWS"}],
        "current_country": "NG",
        "current_city": "Lagos",
        "target_country": "GB",
        "target_city": "London",
        "expected_salary": 70000,
        "salary_currency": "GBP",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "current_role": "Backend Engineer",
        "target_role": "Senior Backend Engineer",
        "preferred_industry": "Fintech",
        "years_experience": 4,
        "salary_range_min": 65000,
        "salary_range_max": 80000,
        "salary_currency": "GBP",
        "work_mode": "hybrid",
        "needs_visa_sponsorship": True,
        "open_to_role_change": False,
    },
)


OPEN_TO_ROLE_CHANGE = JobFitFixture(
    name="open_to_role_change",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "QA Engineer",
        "industry": "Software",
        "years_experience": 5,
        "seniority": "mid",
        "skills": [{"name": "Selenium"}, {"name": "Python"}, {"name": "TestRail"}],
        "current_country": "CN",
        "current_city": "Shanghai",
        "target_country": "AU",
        "target_city": "Sydney",
        "expected_salary": 100000,
        "salary_currency": "AUD",
        "needs_visa_sponsorship": True,
    },
    run_body={
        "current_role": "QA Engineer",
        # No target_role: model must infer
        "preferred_industry": "Software",
        "years_experience": 5,
        "salary_range_min": 95000,
        "salary_range_max": 120000,
        "salary_currency": "AUD",
        "work_mode": "hybrid",
        "needs_visa_sponsorship": True,
        "open_to_role_change": True,
    },
)


ALL_FIXTURES = [
    STRONG_MATCH,
    ROLE_MISMATCH,
    HIGH_EXP_LOW_REALISM,
    VISA_SPONSORSHIP_REQUIRED,
    OPEN_TO_ROLE_CHANGE,
]
