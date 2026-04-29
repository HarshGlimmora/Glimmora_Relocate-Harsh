"""Realistic case fixtures for the financial-feasibility module."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class FinanceFixture:
    name: str
    profile_patch: dict[str, Any]
    run_body: dict[str, Any] = field(default_factory=dict)


SOLO_STRONG_SALARY = FinanceFixture(
    name="solo_mover_strong_salary",
    profile_patch={
        "full_name": "Asha Rao",
        "current_role": "Senior Data Engineer",
        "industry": "Fintech",
        "years_experience": 7,
        "current_country": "IN",
        "current_city": "Bengaluru",
        "target_country": "DE",
        "target_city": "Berlin",
        "current_salary": 4_200_000,
        "expected_salary": 95_000,
        "salary_currency": "EUR",
    },
    run_body={
        "current_salary": 4_200_000,
        "current_currency": "INR",
        "expected_salary": 95_000,
        "salary_currency": "EUR",
        "target_country": "DE",
        "target_city": "Berlin",
        "monthly_budget": 3_500,
        "savings": 30_000,
        "family_size": 1,
        "rent_expectation": 1_400,
        "cost_sensitivity": "medium",
    },
)


FAMILY_HIGHER_RENT = FinanceFixture(
    name="family_with_higher_rent",
    profile_patch={
        "full_name": "Hina Mehta",
        "current_role": "Product Manager",
        "industry": "Edtech",
        "years_experience": 9,
        "current_country": "IN",
        "current_city": "Mumbai",
        "target_country": "CA",
        "target_city": "Toronto",
        "current_salary": 3_600_000,
        "expected_salary": 140_000,
        "salary_currency": "CAD",
    },
    run_body={
        "expected_salary": 140_000,
        "salary_currency": "CAD",
        "target_country": "CA",
        "target_city": "Toronto",
        "monthly_budget": 7_500,
        "savings": 50_000,
        "family_size": 4,
        "rent_expectation": 3_800,
        "cost_sensitivity": "medium",
    },
)


LOW_SAVINGS_HIGH_COST = FinanceFixture(
    name="low_savings_high_cost",
    profile_patch={
        "full_name": "Liu Wei",
        "current_role": "Backend Engineer",
        "industry": "Software",
        "years_experience": 5,
        "current_country": "CN",
        "current_city": "Shanghai",
        "target_country": "US",
        "target_city": "San Francisco",
        "current_salary": 600_000,
        "expected_salary": 130_000,
        "salary_currency": "USD",
    },
    run_body={
        "expected_salary": 130_000,
        "salary_currency": "USD",
        "current_currency": "CNY",
        "target_country": "US",
        "target_city": "San Francisco",
        "monthly_budget": 6_500,
        "savings": 4_000,
        "family_size": 3,
        "rent_expectation": 4_800,
        "cost_sensitivity": "high",
    },
)


STRONG_SALARY_WEAK_AFFORDABILITY = FinanceFixture(
    name="strong_salary_weak_affordability",
    profile_patch={
        "full_name": "Marcus Stein",
        "current_role": "Staff Engineer",
        "industry": "AdTech",
        "years_experience": 12,
        "current_country": "DE",
        "current_city": "Berlin",
        "target_country": "CH",
        "target_city": "Zurich",
        "current_salary": 130_000,
        "expected_salary": 180_000,
        "salary_currency": "CHF",
    },
    run_body={
        "expected_salary": 180_000,
        "salary_currency": "CHF",
        "current_currency": "EUR",
        "target_country": "CH",
        "target_city": "Zurich",
        "monthly_budget": 6_000,
        "savings": 80_000,
        "family_size": 4,
        "rent_expectation": 4_500,
        "cost_sensitivity": "low",
    },
)


CURRENCY_SENSITIVE = FinanceFixture(
    name="currency_sensitive_destination",
    profile_patch={
        "full_name": "Mateo Alvarez",
        "current_role": "Backend Engineer",
        "industry": "Healthtech",
        "years_experience": 4,
        "current_country": "AR",
        "current_city": "Buenos Aires",
        "target_country": "GB",
        "target_city": "London",
        "current_salary": 12_000_000,
        "expected_salary": 75_000,
        "salary_currency": "GBP",
    },
    run_body={
        "expected_salary": 75_000,
        "salary_currency": "GBP",
        "current_currency": "ARS",
        "target_country": "GB",
        "target_city": "London",
        "monthly_budget": 4_200,
        "savings": 8_000,
        "family_size": 2,
        "rent_expectation": 2_400,
        "cost_sensitivity": "high",
    },
)


ALL_FIXTURES = [
    SOLO_STRONG_SALARY,
    FAMILY_HIGHER_RENT,
    LOW_SAVINGS_HIGH_COST,
    STRONG_SALARY_WEAK_AFFORDABILITY,
    CURRENCY_SENSITIVE,
]
