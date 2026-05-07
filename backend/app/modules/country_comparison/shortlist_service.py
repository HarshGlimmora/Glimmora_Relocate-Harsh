"""Country shortlist scoring + drilldowns + switchability + fingerprint.

Pure computation, no I/O, no LLM. Fast enough to run on every weight
slider change. Backed by the curated CountryMetrics dataset.

Design choices
==============
- Weighted score is an explicit linear combo of metrics grouped by
  lever (career / cost / family / lifestyle / speed). The grouping is
  visible in `_lever_score()` so the UI can explain "why this won".
- For every shortlisted country we compute a *drilldown* payload —
  five sensitivity curves (one per lever), score components, transition
  curve, and per-country thresholds — so the frontend can paint
  rich line charts instantly without a second round-trip.
- The switchability matrix exposes EVERY (challenger × lever ×
  direction) threshold so the UI can render a complete sensitivity
  picture, not just headline counterfactuals.
- Decision fingerprint is a deterministic classification of the
  normalised weight vector, so the same weights always produce the
  same fingerprint.
"""

from __future__ import annotations

import logging
from typing import Iterable

from app.modules.country_comparison.shortlist_data import (
    COUNTRY_METRICS,
    LAST_UPDATED,
    SOURCE_NAME,
    CountryMetrics,
    get_country,
)
from app.modules.country_comparison.shortlist_schemas import (
    SHORTLIST_MAX,
    ComparisonSeries,
    Counterfactual,
    CountryDrilldown,
    DataSourceMeta,
    DecisionFingerprint,
    DimensionContributingMetric,
    DimensionScore,
    DimensionWinner,
    FinalRecommendation,
    LeverScores,
    LeverThreshold,
    RankedCountry,
    ScoreBreakdown,
    ScoreComponent,
    SensitivityCurve,
    SensitivityPoint,
    ShortlistRequest,
    ShortlistResponse,
    ShortlistWeights,
    SwitchabilityRow,
    TransitionCurvePoint,
    TransitionDelta,
    TransitionStrip,
)

logger = logging.getLogger(__name__)


# ---- Lever decomposition ---------------------------------------------------
# Each "lever" is a weighted aggregation of the underlying metrics.
# Tuned so each lever is in [0, 100]. Coefficients sum to 1.0 per lever.
# `_LEVER_COMPONENTS` is the source of truth for both lever scores AND
# the dimension drilldown chart data.

_LEVERS: tuple[str, ...] = ("career", "cost", "family", "lifestyle", "speed")

_LEVER_COMPONENTS: dict[str, list[tuple[str, float]]] = {
    "career": [
        ("job_market", 0.40),
        ("salary_power", 0.35),
        ("employer_sponsor_density", 0.25),
    ],
    "cost": [
        ("cost_of_living", 0.55),
        ("housing_pressure", 0.45),
    ],
    "family": [
        ("family_fit", 0.50),
        ("quality_of_life", 0.25),
        ("housing_pressure", 0.25),
    ],
    "lifestyle": [
        ("quality_of_life", 0.45),
        ("language_fit", 0.30),
        ("cost_of_living", 0.25),
    ],
    "speed": [
        ("speed_to_land", 0.55),
        ("visa_friction", 0.45),
    ],
}

_LEVER_LABELS: dict[str, str] = {
    "career": "Career",
    "cost": "Cost",
    "family": "Family",
    "lifestyle": "Lifestyle",
    "speed": "Speed",
    "visa": "Visa friendliness",
}

_LEVER_REASON_LINE: dict[str, str] = {
    "career": "Aggregates job-market depth, salary power, and sponsor density.",
    "cost": "Cost of living + housing pressure index combined.",
    "family": "Family fit, quality-of-life, and housing slack combined.",
    "lifestyle": "Quality of life, language usability, and cost combined.",
    "speed": "Speed to land + visa friction (lower friction = higher speed).",
    "visa": "Visa friendliness only — independent of the speed lever.",
}


def _lever_score(m: CountryMetrics, lever: str) -> int:
    if lever == "visa":
        # Visa is exposed as a 6th radar axis but isn't a user-weighted lever.
        return m.visa_friction
    components = _LEVER_COMPONENTS.get(lever)
    if not components:
        raise ValueError(f"unknown lever: {lever}")
    return round(sum(coeff * getattr(m, key) for key, coeff in components))


def _lever_scores(m: CountryMetrics) -> LeverScores:
    return LeverScores(
        career=_lever_score(m, "career"),
        cost=_lever_score(m, "cost"),
        family=_lever_score(m, "family"),
        lifestyle=_lever_score(m, "lifestyle"),
        speed=_lever_score(m, "speed"),
        visa=_lever_score(m, "visa"),
    )


def _normalize_weights(w: ShortlistWeights) -> dict[str, float]:
    raw = {
        "career": w.career,
        "cost": w.cost,
        "family": w.family,
        "lifestyle": w.lifestyle,
        "speed": w.speed,
    }
    total = sum(raw.values())
    if total == 0:
        # If user zeroed everything, fall back to balanced.
        return {k: 0.2 for k in raw}
    return {k: v / total for k, v in raw.items()}


def _weighted_score(m: CountryMetrics, normalized: dict[str, float]) -> int:
    s = 0.0
    for lever, w in normalized.items():
        s += w * _lever_score(m, lever)
    return max(0, min(100, round(s)))


def _weighted_score_from_dict(m: CountryMetrics, w: dict[str, float]) -> float:
    return sum(w[lever] * _lever_score(m, lever) for lever in _LEVERS)


# ---- Per-country narrative ----------------------------------------------


_METRIC_LABELS: dict[str, str] = {
    "job_market": "Job market depth",
    "salary_power": "Salary power",
    "employer_sponsor_density": "Sponsor density",
    "visa_friction": "Visa ease",
    "speed_to_land": "Speed to land",
    "cost_of_living": "Cost of living",
    "housing_pressure": "Housing slack",
    "quality_of_life": "Quality of life",
    "family_fit": "Family fit",
    "language_fit": "English usability",
}


def _top_strength(m: CountryMetrics) -> str:
    pairs = [(k, getattr(m, k)) for k in _METRIC_LABELS]
    pairs.sort(key=lambda x: -x[1])
    label, score = pairs[0]
    return f"{_METRIC_LABELS[label]} ({score}/100)"


def _top_risk(m: CountryMetrics) -> str:
    pairs = [(k, getattr(m, k)) for k in _METRIC_LABELS]
    pairs.sort(key=lambda x: x[1])
    label, score = pairs[0]
    return f"{_METRIC_LABELS[label]} ({score}/100)"


def _breakdown(m: CountryMetrics) -> ScoreBreakdown:
    return ScoreBreakdown(
        job_market=m.job_market,
        salary_power=m.salary_power,
        employer_sponsor_density=m.employer_sponsor_density,
        visa_friction=m.visa_friction,
        speed_to_land=m.speed_to_land,
        cost_of_living=m.cost_of_living,
        housing_pressure=m.housing_pressure,
        quality_of_life=m.quality_of_life,
        family_fit=m.family_fit,
        language_fit=m.language_fit,
    )


# ---- Dimension winners (replaces flat category_winners) -------------------


def _dimension_winners(metrics: list[CountryMetrics]) -> list[DimensionWinner]:
    """One DimensionWinner per lever (+ visa) with a full reasoning trail."""
    out: list[DimensionWinner] = []
    # 5 user-weighted levers + 1 visa axis = 6 dimensions.
    for dim in (*_LEVERS, "visa"):
        scored: list[tuple[CountryMetrics, int]] = [
            (m, _lever_score(m, dim)) for m in metrics
        ]
        scored.sort(key=lambda x: -x[1])
        top, top_score = scored[0]
        runner = scored[1] if len(scored) > 1 else None
        runner_country, runner_score = runner if runner else (None, 0)

        # Per-country bar chart series.
        series = [
            DimensionScore(code=m.code, name=m.name, score=s)
            for (m, s) in scored
        ]

        # Sub-metric reasoning. Visa surfaces just `visa_friction`.
        if dim == "visa":
            contributing = [
                DimensionContributingMetric(
                    metric_key="visa_friction",
                    metric_label=_METRIC_LABELS["visa_friction"],
                    weight=1.0,
                    series=[
                        DimensionScore(code=m.code, name=m.name, score=m.visa_friction)
                        for m, _ in scored
                    ],
                )
            ]
        else:
            contributing = [
                DimensionContributingMetric(
                    metric_key=key,
                    metric_label=_METRIC_LABELS[key],
                    weight=coeff,
                    series=[
                        DimensionScore(
                            code=m.code, name=m.name, score=getattr(m, key),
                        )
                        for m, _ in scored
                    ],
                )
                for key, coeff in _LEVER_COMPONENTS[dim]
            ]

        margin = top_score - runner_score
        out.append(
            DimensionWinner(
                dimension=dim,
                label=_LEVER_LABELS[dim],
                winner_code=top.code,
                winner_name=top.name,
                winning_score=top_score,
                runner_up_code=runner_country.code if runner_country else None,
                runner_up_name=runner_country.name if runner_country else None,
                margin=margin,
                series=series,
                contributing_metrics=contributing,
                reason_one_line=_LEVER_REASON_LINE[dim],
            )
        )
    return out


# ---- Comparison series (cross-shortlist line chart) ------------------------


def _comparison_series(metrics: list[CountryMetrics]) -> tuple[list[str], list[ComparisonSeries]]:
    keys = list(_METRIC_LABELS.keys())
    labels = [_METRIC_LABELS[k] for k in keys]
    series = [
        ComparisonSeries(
            code=m.code,
            name=m.name,
            values=[getattr(m, k) for k in keys],
        )
        for m in metrics
    ]
    return labels, series


# ---- Transition deltas ----------------------------------------------------


def _transitions(
    origin: CountryMetrics | None,
    destinations: list[CountryMetrics],
) -> list[TransitionStrip]:
    if origin is None:
        return []
    strips: list[TransitionStrip] = []
    for dest in destinations:
        deltas: list[TransitionDelta] = []
        for key, label in _METRIC_LABELS.items():
            o = getattr(origin, key)
            d = getattr(dest, key)
            diff = d - o
            direction = "gain" if diff > 4 else ("loss" if diff < -4 else "same")
            deltas.append(
                TransitionDelta(
                    metric=label,
                    origin_score=o,
                    destination_score=d,
                    delta=diff,
                    direction=direction,
                    note=_transition_note(label, o, d, diff),
                )
            )
        positives = sorted(deltas, key=lambda x: -x.delta)
        negatives = sorted(deltas, key=lambda x: x.delta)
        gain = positives[0]
        loss = negatives[0]
        strips.append(
            TransitionStrip(
                origin_code=origin.code,
                origin_name=origin.name,
                destination_code=dest.code,
                destination_name=dest.name,
                deltas=deltas,
                headline_gain=(
                    f"+{gain.delta} on {gain.metric}"
                    if gain.delta > 0
                    else "No clear category gain"
                ),
                headline_loss=(
                    f"{loss.delta} on {loss.metric}"
                    if loss.delta < 0
                    else "No major loss vs origin"
                ),
            )
        )
    return strips


def _transition_curve(
    origin: CountryMetrics | None,
    destination: CountryMetrics,
) -> list[TransitionCurvePoint]:
    if origin is None:
        return []
    return [
        TransitionCurvePoint(
            metric=_METRIC_LABELS[k],
            origin=getattr(origin, k),
            destination=getattr(destination, k),
        )
        for k in _METRIC_LABELS
    ]


def _transition_note(label: str, o: int, d: int, diff: int) -> str:
    if abs(diff) <= 4:
        return f"≈ {o}/100"
    if diff > 0:
        return f"{o} → {d}"
    return f"{o} → {d}"


# ---- Sensitivity curves --------------------------------------------------


def _sensitivity_curve(
    target: CountryMetrics,
    others: list[CountryMetrics],
    lever: str,
    base: dict[str, float],
    *,
    steps: int = 21,
) -> SensitivityCurve:
    """Sweep one lever's weight share from 0.0 → 1.0 and record what
    happens to `target`'s rank + score across `steps` samples.

    The remaining levers keep their *relative* shares, scaled to fill
    the remaining (1 - swept) budget. We catch the first crossover of
    `target`'s rank to surface as `crossover_weight`.
    """
    points: list[SensitivityPoint] = []
    starting_rank: int | None = None
    crossover: float | None = None
    others_sum = sum(base[k] for k in base if k != lever)

    for i in range(steps):
        w_lever = i / (steps - 1)  # 0.0 → 1.0
        if others_sum > 0:
            scale = (1.0 - w_lever) / others_sum
        else:
            scale = 0.0
        w = {k: base[k] * scale for k in base}
        w[lever] = w_lever
        # Score every shortlisted country at this weight.
        scored = sorted(
            ((c, _weighted_score_from_dict(c, w)) for c in [target, *others]),
            key=lambda x: -x[1],
        )
        rank = next(idx + 1 for idx, (c, _s) in enumerate(scored) if c.code == target.code)
        score = next(round(s) for c, s in scored if c.code == target.code)
        points.append(
            SensitivityPoint(
                weight=round(w_lever, 3),
                score=max(0, min(100, score)),
                rank=rank,
            )
        )
        if starting_rank is None:
            starting_rank = rank
        elif crossover is None and rank != starting_rank:
            crossover = round(w_lever, 3)

    return SensitivityCurve(
        lever=lever,
        points=points,
        crossover_weight=crossover,
    )


# ---- Per-country drilldown ------------------------------------------------


def _country_drilldown(
    target: CountryMetrics,
    others: list[CountryMetrics],
    base: dict[str, float],
    rank: int,
    weighted_score: int,
    origin: CountryMetrics | None,
) -> CountryDrilldown:
    sensitivity = [
        _sensitivity_curve(target, others, lever, base) for lever in _LEVERS
    ]
    components = [
        ScoreComponent(
            lever=lever,
            raw_score=_lever_score(target, lever),
            weight=round(base[lever], 3),
            contribution=round(_lever_score(target, lever) * base[lever]),
        )
        for lever in _LEVERS
    ]

    # Per-country thresholds: for each lever, find the smallest single-
    # lever shift (in either direction) that flips this country's rank.
    rank_thresholds: list[LeverThreshold] = []
    if rank == 1:
        # The leader: no rank change available — the user is already at #1.
        # We could compute "drop to #2" but that's the inverse of the
        # challenger thresholds covered by switchability_matrix below.
        pass
    else:
        for lever in _LEVERS:
            best = _smallest_self_flip(target, others, base, lever, target_rank=rank)
            if best is not None:
                pct, direction, new_rank = best
                rank_thresholds.append(
                    LeverThreshold(
                        lever=lever,
                        direction=direction,
                        threshold_pct=pct,
                        flips_to_rank=new_rank,
                        one_line=(
                            f"{'+' if direction == 'increase' else '−'}{pct}% on "
                            f"{lever} weight → {target.name} reaches rank {new_rank}."
                        ),
                    )
                )

    return CountryDrilldown(
        code=target.code,
        summary_one_line=_drilldown_summary(target, weighted_score, rank),
        biggest_advantage=_top_strength(target),
        biggest_risk=_top_risk(target),
        lever_scores=_lever_scores(target),
        breakdown=_breakdown(target),
        sensitivity_curves=sensitivity,
        transition_curve=_transition_curve(origin, target),
        rank_change_thresholds=rank_thresholds,
        score_components=components,
    )


def _drilldown_summary(m: CountryMetrics, score: int, rank: int) -> str:
    if rank == 1:
        return f"Ranked #1 with {score}/100. Leads on {_top_strength(m).split(' (')[0].lower()}."
    return (
        f"Ranked #{rank} with {score}/100. "
        f"Held back by {_top_risk(m).split(' (')[0].lower()}."
    )


def _smallest_self_flip(
    target: CountryMetrics,
    others: list[CountryMetrics],
    base: dict[str, float],
    lever: str,
    *,
    target_rank: int,
) -> tuple[int, str, int] | None:
    """For a non-#1 country, find the smallest single-lever bump that
    improves its rank. Returns (pct, direction, new_rank) or None.
    """
    for direction in ("increase", "decrease"):
        for pct in range(5, 205, 5):
            new = _perturb(base, lever, direction, pct)
            scored = sorted(
                ((c, _weighted_score_from_dict(c, new)) for c in [target, *others]),
                key=lambda x: -x[1],
            )
            new_rank = next(
                idx + 1 for idx, (c, _s) in enumerate(scored) if c.code == target.code
            )
            if new_rank < target_rank:
                return pct, direction, new_rank
    return None


# ---- Counterfactual simulator (headlines) ---------------------------------


def _counterfactuals(
    metrics: list[CountryMetrics],
    weights: ShortlistWeights,
) -> list[Counterfactual]:
    if len(metrics) < 2:
        return []
    base = _normalize_weights(weights)
    ranked = sorted(metrics, key=lambda m: -_weighted_score_from_dict(m, base))
    winner = ranked[0]
    out: list[Counterfactual] = []

    for challenger in ranked[1:]:
        best: tuple[int, str, str] | None = None
        for lever in _LEVERS:
            cf = _smallest_bump(winner, challenger, base, lever)
            if cf is None:
                continue
            pct, direction = cf
            if best is None or pct < best[0]:
                best = (pct, lever, direction)
        if best is None:
            best = _smallest_swap(winner, challenger, base)

        if best is not None:
            pct, lever, direction = best
            out.append(
                Counterfactual(
                    challenger_code=challenger.code,
                    challenger_name=challenger.name,
                    over_code=winner.code,
                    over_name=winner.name,
                    lever=lever,
                    direction=direction,
                    threshold_pct=pct,
                    one_line=_counterfactual_phrase(
                        challenger.name, winner.name, lever, direction, pct
                    ),
                )
            )
        if len(out) >= 4:
            break
    return out


def _switchability(
    metrics: list[CountryMetrics],
    weights: ShortlistWeights,
) -> list[SwitchabilityRow]:
    """Full switchability matrix: every (challenger, lever) threshold.

    Unlike `_counterfactuals` (which surfaces only the single best
    threshold per challenger), this returns all 5 levers × N challengers
    so the UI can render a complete sensitivity panel. Unreachable
    thresholds get `threshold_pct=None`.
    """
    if len(metrics) < 2:
        return []
    base = _normalize_weights(weights)
    ranked = sorted(metrics, key=lambda m: -_weighted_score_from_dict(m, base))
    winner = ranked[0]
    rows: list[SwitchabilityRow] = []
    for challenger in ranked[1:]:
        for lever in _LEVERS:
            res = _smallest_bump(winner, challenger, base, lever)
            if res is None:
                rows.append(
                    SwitchabilityRow(
                        challenger_code=challenger.code,
                        challenger_name=challenger.name,
                        over_code=winner.code,
                        over_name=winner.name,
                        lever=lever,
                        direction="increase",
                        threshold_pct=None,
                        one_line=(
                            f"No single-lever shift on {lever} weight will let "
                            f"{challenger.name} overtake {winner.name}."
                        ),
                    )
                )
                continue
            pct, direction = res
            rows.append(
                SwitchabilityRow(
                    challenger_code=challenger.code,
                    challenger_name=challenger.name,
                    over_code=winner.code,
                    over_name=winner.name,
                    lever=lever,
                    direction=direction,
                    threshold_pct=pct,
                    one_line=_counterfactual_phrase(
                        challenger.name, winner.name, lever, direction, pct,
                    ),
                )
            )
    return rows


def _smallest_swap(
    winner: CountryMetrics,
    challenger: CountryMetrics,
    base: dict[str, float],
) -> tuple[int, str, str] | None:
    deltas = sorted(
        ((lever, _lever_score(challenger, lever) - _lever_score(winner, lever))
         for lever in _LEVERS),
        key=lambda x: -x[1],
    )
    if not deltas or deltas[0][1] <= 0:
        return None
    challenger_lever = deltas[0][0]
    for pct in range(5, 205, 5):
        new = _perturb(base, challenger_lever, "increase", pct)
        if (
            _weighted_score_from_dict(challenger, new)
            > _weighted_score_from_dict(winner, new)
        ):
            return pct, challenger_lever, "increase"
    winner_lever = max(
        _LEVERS,
        key=lambda l: _lever_score(winner, l) - _lever_score(challenger, l),
    )
    if winner_lever != challenger_lever:
        new = dict(base)
        new[winner_lever] = 0.0
        new[challenger_lever] *= 3.0
        total = sum(new.values())
        if total > 0:
            new = {k: v / total for k, v in new.items()}
            if (
                _weighted_score_from_dict(challenger, new)
                > _weighted_score_from_dict(winner, new)
            ):
                return 100, challenger_lever, "increase"
    return None


def _smallest_bump(
    winner: CountryMetrics,
    challenger: CountryMetrics,
    base: dict[str, float],
    lever: str,
) -> tuple[int, str] | None:
    for direction in ("increase", "decrease"):
        for pct in range(5, 205, 5):
            new = _perturb(base, lever, direction, pct)
            if (
                _weighted_score_from_dict(challenger, new)
                > _weighted_score_from_dict(winner, new)
            ):
                return pct, direction
    return None


def _perturb(
    base: dict[str, float], lever: str, direction: str, pct: int,
) -> dict[str, float]:
    multiplier = 1.0 + pct / 100.0 if direction == "increase" else max(
        0.0, 1.0 - pct / 100.0
    )
    new_raw = {k: v * (multiplier if k == lever else 1.0) for k, v in base.items()}
    total = sum(new_raw.values())
    if total == 0:
        return base
    return {k: v / total for k, v in new_raw.items()}


_LEVER_PHRASE: dict[str, str] = {
    "career": "career weight",
    "cost": "cost weight",
    "family": "family weight",
    "lifestyle": "lifestyle weight",
    "speed": "speed weight",
}


def _counterfactual_phrase(
    challenger: str, winner: str, lever: str, direction: str, pct: int,
) -> str:
    word = "raise" if direction == "increase" else "lower"
    return f"{word} your {_LEVER_PHRASE[lever]} ~{pct}% and {challenger} overtakes {winner}."


# ---- Decision fingerprint --------------------------------------------------


def _fingerprint(weights: dict[str, float]) -> DecisionFingerprint:
    items = sorted(weights.items(), key=lambda x: -x[1])
    top, top_w = items[0]
    second, second_w = items[1]

    if top_w >= 0.40 and top_w >= 1.5 * second_w:
        style, label = _STYLES_BY_TOP[top]
    elif top_w - items[-1][1] < 0.08:
        style, label = "balanced", "Balanced mover"
    else:
        pair = frozenset((top, second))
        style, label = _PAIR_STYLES.get(pair, _STYLES_BY_TOP[top])

    one_line = _FINGERPRINT_LINE[style]
    return DecisionFingerprint(
        style=style,
        label=label,
        one_line=one_line,
        weight_distribution={k: round(v, 3) for k, v in weights.items()},
    )


_STYLES_BY_TOP: dict[str, tuple[str, str]] = {
    "career": ("career_first", "Career-first mover"),
    "cost": ("cost_sensitive", "Cost-sensitive mover"),
    "family": ("family_heavy", "Family-led mover"),
    "lifestyle": ("lifestyle_focused", "Lifestyle-led mover"),
    "speed": ("speed_driven", "Speed-driven mover"),
}

_PAIR_STYLES: dict[frozenset, tuple[str, str]] = {
    frozenset(("career", "cost")): ("career_first", "Career-first, cost-aware"),
    frozenset(("speed", "career")): ("speed_driven", "Career + speed"),
    frozenset(("family", "cost")): ("family_heavy", "Family + cost-aware"),
    frozenset(("family", "lifestyle")): ("family_heavy", "Family + lifestyle"),
    frozenset(("speed", "cost")): ("speed_driven", "Speed + cost"),
}

_FINGERPRINT_LINE: dict[str, str] = {
    "career_first": "Optimising for role, salary, and sponsor density.",
    "cost_sensitive": "Lower cost of living and housing pressure dominate.",
    "family_heavy": "Schooling, healthcare, and household stability lead.",
    "lifestyle_focused": "Quality of life and culture-fit lead.",
    "speed_driven": "Fastest path to land beats long-term optimisation.",
    "balanced": "No single lever dominates — every dimension matters.",
}


# ---- Final recommendation -------------------------------------------------


def _final(
    ranked: list[RankedCountry],
    weights_normalized: dict[str, float],
) -> FinalRecommendation:
    winner = ranked[0]
    runner = ranked[1] if len(ranked) > 1 else None
    margin = winner.weighted_score - (runner.weighted_score if runner else 0)
    top_lever = max(weights_normalized.items(), key=lambda x: x[1])[0]
    next_label, next_href = _next_action_for_lever(top_lever)
    why = (
        f"Leads on {winner.top_strength.split(' (')[0]}"
        + (f" by {margin} pts over {runner.name}." if runner else ".")
    )
    return FinalRecommendation(
        winner_code=winner.code,
        winner_name=winner.name,
        why_one_line=why[:140],
        next_action_label=next_label,
        next_action_href=next_href,
        margin_over_runner_up=margin,
    )


def _next_action_for_lever(lever: str) -> tuple[str, str]:
    if lever == "career":
        return ("See your job angle", "/app/jobs")
    if lever == "cost":
        return ("Stress-test the budget", "/app/finance")
    if lever == "family":
        return ("See family impact", "/app/family")
    if lever == "speed":
        return ("See the timeline", "/app/timeline")
    return ("Open visa direction", "/app/visa")


# ---- Confidence ----------------------------------------------------------


def _country_confidence(m: CountryMetrics) -> float:
    values = [
        m.job_market, m.salary_power, m.employer_sponsor_density,
        m.visa_friction, m.speed_to_land,
        m.cost_of_living, m.housing_pressure,
        m.quality_of_life, m.family_fit, m.language_fit,
    ]
    spread = max(values) - min(values)
    return round(0.55 + min(0.40, spread / 200.0), 2)


# ---- Top-level entrypoint -------------------------------------------------


def compute_shortlist(
    request: ShortlistRequest,
    *,
    origin_country_code: str | None = None,
) -> ShortlistResponse:
    """Score, rank, and explain a 2–3 country shortlist with full drilldowns."""
    metrics = _resolve_metrics(request.countries)
    if len(metrics) < 2:
        raise ValueError(
            "Need at least 2 known countries in the shortlist; got "
            f"{len(metrics)} after resolving."
        )
    if len(metrics) > SHORTLIST_MAX:
        raise ValueError(
            f"Shortlist exceeds the {SHORTLIST_MAX}-country cap; "
            "remove a country first."
        )

    weights = _normalize_weights(request.weights)
    scored: list[tuple[CountryMetrics, int]] = [
        (m, _weighted_score(m, weights)) for m in metrics
    ]
    scored.sort(key=lambda x: -x[1])

    origin = get_country(origin_country_code) if origin_country_code else None

    ranked: list[RankedCountry] = []
    for i, (m, score) in enumerate(scored):
        rank = i + 1
        others = [other for other, _s in scored if other.code != m.code]
        ranked.append(
            RankedCountry(
                code=m.code,
                name=m.name,
                region=m.region,
                rank=rank,
                weighted_score=score,
                breakdown=_breakdown(m),
                lever_scores=_lever_scores(m),
                top_strength=_top_strength(m),
                top_risk=_top_risk(m),
                confidence=_country_confidence(m),
                drilldown=_country_drilldown(
                    m, others, weights, rank, score, origin,
                ),
            )
        )

    transitions = _transitions(origin, [m for m, _ in scored])
    counterfactuals = _counterfactuals(metrics, request.weights)
    switchability = _switchability(metrics, request.weights)
    fingerprint = _fingerprint(weights)
    final = _final(ranked, weights)

    dimension_labels, comparison_series = _comparison_series(
        [m for m, _ in scored],
    )

    assumptions: list[str] = [
        "Scores aggregate curated 2026-Q1 country metrics; cost-of-living is a relative index, not absolute amounts.",
        "Visa-ease is a heuristic from public processing-time tables — not legal advice.",
        f"Shortlist is capped at {SHORTLIST_MAX} countries to keep the comparison readable.",
    ]
    if origin is None:
        assumptions.append(
            "Origin → destination transitions skipped because no current_country is set on the profile.",
        )

    return ShortlistResponse(
        countries=ranked,
        dimension_labels=dimension_labels,
        comparison_series=comparison_series,
        dimension_winners=_dimension_winners([m for m, _ in scored]),
        transitions=transitions,
        counterfactuals=counterfactuals,
        switchability=switchability,
        fingerprint=fingerprint,
        final=final,
        source=DataSourceMeta(
            source=SOURCE_NAME,
            last_updated=LAST_UPDATED,
            confidence=0.7,
            availability="cached",
        ),
        assumptions=assumptions,
    )


def _resolve_metrics(codes: Iterable[str]) -> list[CountryMetrics]:
    out: list[CountryMetrics] = []
    for c in codes:
        m = COUNTRY_METRICS.get(c.upper())
        if m is None:
            logger.info("shortlist: skipping unknown country code %r", c)
            continue
        out.append(m)
    return out
