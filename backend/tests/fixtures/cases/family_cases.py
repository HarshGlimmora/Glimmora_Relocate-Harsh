"""Realistic case fixtures for the family-relocation module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class FamilyFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


SOLO_MOVER = FamilyFixture(
    name="solo_mover",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "years_experience": 7,
        "current_country": "IN",
        "current_city": "Bengaluru",
        "target_country": "DE",
        "target_city": "Berlin",
        "expected_salary": 85000,
        "salary_currency": "EUR",
    },
    run_body={
        "moving_with_family": False,
        "spouse": {"moving": False, "has_career": False},
        "children": [],
        "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
        "family_budget_impact": "low",
    },
)


SPOUSE_CAREER = FamilyFixture(
    name="spouse_with_career_pressure",
    profile_patch={
        "full_name": "Daniel Park",
        "current_role": "Staff Software Engineer",
        "industry": "Cloud Infra",
        "years_experience": 11,
        "current_country": "KR",
        "current_city": "Seoul",
        "target_country": "NL",
        "target_city": "Amsterdam",
        "expected_salary": 110000,
        "salary_currency": "EUR",
    },
    run_body={
        "moving_with_family": True,
        "spouse": {
            "moving": True,
            "has_career": True,
            "profession": "UX Designer",
            "work_visa_required": True,
        },
        "children": [],
        "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
        "housing_requirement": "2BR near transit",
        "family_budget_impact": "medium",
    },
)


FAMILY_WITH_CHILDREN = FamilyFixture(
    name="family_with_children",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "years_experience": 9,
        "current_country": "IN",
        "current_city": "Mumbai",
        "target_country": "CA",
        "target_city": "Toronto",
        "expected_salary": 130000,
        "salary_currency": "CAD",
    },
    run_body={
        "moving_with_family": True,
        "spouse": {"moving": True, "has_career": False},
        "children": [
            {"age": 5, "schooling_need": "primary"},
            {"age": 9, "schooling_need": "primary"},
        ],
        "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
        "housing_requirement": "3BR near international school",
        "family_budget_impact": "medium",
    },
)


PARENTS_DEPENDENT = FamilyFixture(
    name="parents_depending_on_move",
    profile_patch={
        "full_name": "Zara Khan",
        "current_role": "Engineering Manager",
        "industry": "Healthtech",
        "years_experience": 12,
        "current_country": "PK",
        "current_city": "Lahore",
        "target_country": "AE",
        "target_city": "Dubai",
        "expected_salary": 360000,
        "salary_currency": "AED",
    },
    run_body={
        "moving_with_family": True,
        "spouse": {"moving": True, "has_career": False},
        "children": [{"age": 3, "schooling_need": "preschool"}],
        "parents": {
            "moving": True,
            "dependency_level": "high",
            "healthcare_sensitivity": "high",
            "notes": "Aging mother with chronic medication needs.",
        },
        "housing_requirement": "3BR with parent suite",
        "family_budget_impact": "high",
    },
)


HOUSING_PRESSURE = FamilyFixture(
    name="family_with_housing_pressure",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "Backend Engineer",
        "industry": "Software",
        "years_experience": 6,
        "current_country": "CN",
        "current_city": "Shanghai",
        "target_country": "US",
        "target_city": "San Francisco",
        "expected_salary": 180000,
        "salary_currency": "USD",
    },
    run_body={
        "moving_with_family": True,
        "spouse": {"moving": True, "has_career": True, "profession": "Architect"},
        "children": [
            {"age": 8, "schooling_need": "primary"},
            {"age": 14, "schooling_need": "secondary"},
        ],
        "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
        "housing_requirement": "4BR within reach of bilingual school; SF rentals are tight.",
        "family_budget_impact": "high",
    },
)


ALL_FIXTURES = [
    SOLO_MOVER,
    SPOUSE_CAREER,
    FAMILY_WITH_CHILDREN,
    PARENTS_DEPENDENT,
    HOUSING_PRESSURE,
]
