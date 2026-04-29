"""Finance schema tests (acceptance #1)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.finance.schemas import (
    CostLine,
    FinanceDetail,
    FinanceInputs,
    FxNote,
    MonthlyCost,
    MonthlyNet,
    RiskFlag,
)


def _net() -> MonthlyNet:
    return MonthlyNet(
        gross_monthly=8_000,
        estimated_tax_monthly=3_040,
        take_home_monthly=4_960,
        currency="EUR",
        effective_tax_rate_pct=38,
        note="Single filer, no deductions modelled.",
    )


def _cost() -> MonthlyCost:
    return MonthlyCost(
        housing=CostLine(label="Housing", amount=1500),
        utilities=CostLine(label="Utilities", amount=200),
        food=CostLine(label="Food", amount=500),
        transport=CostLine(label="Transport", amount=120),
        healthcare=CostLine(label="Healthcare", amount=180),
        childcare_or_education=CostLine(label="Childcare", amount=0),
        other=CostLine(label="Other", amount=300),
        total_monthly=2_800,
        currency="EUR",
    )


def _detail(**overrides) -> FinanceDetail:
    base = dict(
        monthly_net=_net(),
        monthly_cost=_cost(),
        surplus_or_deficit_monthly=2_160,
        affordability_score=85,
        salary_to_expense_ratio=1.77,
        savings_runway_months=0,
        fx_note=FxNote(
            pair="INR/EUR",
            direction="weakens_buying_power",
            note="Cost base is materially higher in EUR.",
        ),
        risk_flags=[
            RiskFlag(severity="low", label="Estimate volatility", detail="Treat as a band.")
        ],
        headline_finding="Workable with comfortable surplus.",
    )
    base.update(overrides)
    return FinanceDetail.model_validate(base)


def test_valid_detail_constructs() -> None:
    d = _detail()
    assert d.affordability_score == 85
    assert d.fx_note.pair == "INR/EUR"


def test_score_range_enforced() -> None:
    with pytest.raises(ValidationError):
        _detail(affordability_score=120)


def test_salary_to_expense_ratio_capped() -> None:
    with pytest.raises(ValidationError):
        _detail(salary_to_expense_ratio=15.0)


def test_fx_direction_constrained() -> None:
    with pytest.raises(ValidationError):
        FxNote(pair="INR/EUR", direction="goes_sideways", note="x")


def test_fx_pair_min_length() -> None:
    with pytest.raises(ValidationError):
        FxNote(pair="X", direction="unknown", note="x")


def test_risk_severity_constrained() -> None:
    with pytest.raises(ValidationError):
        RiskFlag(severity="catastrophic", label="x", detail="y")


def test_inputs_extra_forbidden() -> None:
    with pytest.raises(ValidationError):
        FinanceInputs.model_validate({"foo": 1})


def test_input_currency_must_be_3_chars() -> None:
    with pytest.raises(ValidationError):
        FinanceInputs.model_validate({"salary_currency": "EU"})


def test_input_family_size_range() -> None:
    with pytest.raises(ValidationError):
        FinanceInputs.model_validate({"family_size": 99})


def test_runway_capped() -> None:
    with pytest.raises(ValidationError):
        _detail(savings_runway_months=10_000)
