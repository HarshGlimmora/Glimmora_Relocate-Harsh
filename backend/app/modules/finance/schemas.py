"""Financial Feasibility contracts.

All money values are integer **whole units** in the destination's currency
unless explicitly noted. The frontend formats per-locale. We deliberately
keep the structure flat: a few clear cards with concrete numbers beats a
nested model the user has to decode.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class FinanceInputs(BaseModel):
    """Body for POST /finance/run."""

    model_config = ConfigDict(extra="forbid")

    current_salary: Optional[int] = Field(default=None, ge=0)
    expected_salary: Optional[int] = Field(default=None, ge=0)
    current_currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    salary_currency: Optional[str] = Field(default=None, min_length=3, max_length=3)

    target_country: Optional[str] = Field(default=None, min_length=2, max_length=2)
    target_city: Optional[str] = Field(default=None, max_length=80)

    monthly_budget: Optional[int] = Field(default=None, ge=0)
    savings: Optional[int] = Field(default=None, ge=0)
    family_size: Optional[int] = Field(default=None, ge=1, le=12)
    rent_expectation: Optional[int] = Field(default=None, ge=0)
    cost_sensitivity: Optional[str] = Field(
        default=None, pattern="^(low|medium|high)$"
    )

    force: bool = False


# ----- detail payload -----


class MonthlyNet(BaseModel):
    """Take-home estimate after tax and statutory deductions."""

    gross_monthly: int = Field(ge=0)
    estimated_tax_monthly: int = Field(ge=0)
    take_home_monthly: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)
    effective_tax_rate_pct: int = Field(ge=0, le=80)
    note: str = Field(min_length=1, max_length=300)


class CostLine(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    amount: int = Field(ge=0)
    note: Optional[str] = Field(default=None, max_length=240)


class MonthlyCost(BaseModel):
    """Cost breakdown for the destination, family-size aware."""

    housing: CostLine
    utilities: CostLine
    food: CostLine
    transport: CostLine
    healthcare: CostLine
    childcare_or_education: CostLine
    other: CostLine
    total_monthly: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)


class RiskFlag(BaseModel):
    severity: str = Field(pattern="^(low|medium|high)$")
    label: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)


class FxNote(BaseModel):
    pair: str = Field(
        min_length=7,
        max_length=10,
        description="e.g. 'INR/EUR' — origin currency / destination currency",
    )
    direction: str = Field(
        pattern="^(strengthens_buying_power|weakens_buying_power|broadly_neutral|unknown)$"
    )
    note: str = Field(min_length=1, max_length=400)


class FinanceDetail(BaseModel):
    """Strict financial-feasibility artifact rendered by the frontend's Page 8."""

    monthly_net: MonthlyNet
    monthly_cost: MonthlyCost

    surplus_or_deficit_monthly: int = Field(
        ge=-10_000_000,
        le=10_000_000,
        description="take_home_monthly - total_monthly_cost; negative = deficit",
    )
    affordability_score: int = Field(ge=0, le=100)
    salary_to_expense_ratio: float = Field(ge=0.0, le=10.0)

    savings_runway_months: int = Field(
        ge=0,
        le=600,
        description="how many months current savings would cover a deficit; "
        "if surplus is positive this returns 0",
    )

    fx_note: FxNote
    risk_flags: list[RiskFlag] = Field(default_factory=list, max_length=10)

    headline_finding: str = Field(min_length=1, max_length=400)
