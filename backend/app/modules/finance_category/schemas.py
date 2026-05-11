"""Finance Category — deep-dive contracts.

Powers the "click a cost category, get an AI deep-dive" feature on the
finance page. One call per category (housing | utilities | food | transport
| healthcare) returns a structured envelope with:

  - cost_breakdown: itemised sub-costs that make up this category
  - market_comparison: user spend vs market percentiles for the destination
  - optimization_tips: prioritised actions to reduce or shift the spend
  - risk_indicator: low / medium / high + reasoning
  - lifestyle_impact: how it affects savings, runway, freedom
  - projection_points: 6-month projection points for the trend chart

The detail is shape-stable across categories so the same React detail
page can render any of the five.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- inputs --- ---------------------------------------------------------

class FinanceCategoryInputs(BaseModel):
    """Body for POST /finance/category/{category}/run."""

    model_config = ConfigDict(extra="forbid")

    force: bool = False


# --- sub-models --- -----------------------------------------------------


CategoryKey = Literal["housing", "utilities", "food", "transport", "healthcare"]
RiskLevel = Literal["low", "medium", "high"]


class CostBreakdownItem(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    amount: int = Field(ge=0, description="amount in the user's currency")
    share_pct: float = Field(
        ge=0.0, le=100.0, description="this item's share of the category total"
    )
    note: Optional[str] = Field(default=None, max_length=240)


class MarketComparison(BaseModel):
    """Bar-chart-ready market context for the category."""

    currency: str = Field(min_length=3, max_length=3)
    user_cost: int = Field(ge=0)
    market_low: int = Field(ge=0, description="bottom-quartile typical cost")
    market_avg: int = Field(ge=0, description="median / typical cost")
    market_high: int = Field(ge=0, description="top-quartile typical cost")
    percentile: int = Field(
        ge=0,
        le=100,
        description="where the user sits relative to the market (0 = cheapest, 100 = priciest)",
    )
    note: str = Field(min_length=1, max_length=400)


class OptimizationTip(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)
    monthly_savings_estimate: Optional[int] = Field(
        default=None,
        ge=0,
        description="estimated monthly savings in the user's currency",
    )
    effort: Literal["low", "medium", "high"]


class RiskIndicator(BaseModel):
    level: RiskLevel
    label: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)


class LifestyleImpact(BaseModel):
    share_of_take_home_pct: float = Field(
        ge=0.0,
        le=100.0,
        description="this category's share of monthly take-home pay",
    )
    annual_total: int = Field(ge=0, description="12 × monthly cost in user's currency")
    runway_months_if_eliminated: float = Field(
        ge=0.0,
        description="extra months of savings runway if this category went to zero",
    )
    narrative: str = Field(min_length=1, max_length=600)


class ProjectionPoint(BaseModel):
    """One bar on the optional projection chart (e.g. 6-month savings if optimized)."""

    label: str = Field(min_length=1, max_length=40)
    baseline: int = Field(ge=0, description="cost on the current path")
    optimized: int = Field(ge=0, description="cost if optimization tips applied")


class FinanceCategoryDetail(BaseModel):
    """Top-level detail shape returned to the frontend for one category."""

    category: CategoryKey
    currency: str = Field(min_length=3, max_length=3)
    monthly_total: int = Field(ge=0)
    cost_breakdown: list[CostBreakdownItem] = Field(min_length=1, max_length=10)
    market_comparison: MarketComparison
    optimization_tips: list[OptimizationTip] = Field(min_length=1, max_length=8)
    risk_indicator: RiskIndicator
    lifestyle_impact: LifestyleImpact
    projection: list[ProjectionPoint] = Field(min_length=2, max_length=8)
