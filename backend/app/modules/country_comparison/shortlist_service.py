"""Country shortlist scoring + ranking + counterfactual + fingerprint.

Pure computation, no I/O, no LLM. Fast enough to run on every weight
slider change. Backed by the curated CountryMetrics dataset.

Design choices
==============
- Weighted score is an explicit linear combo of metrics grouped by
  lever (career / cost / family / lifestyle / speed). The grouping is
  visible in `_lever_score()` so the UI can explain "why this won".
- Counterfactuals are computed by brute-forcing the smallest weight
  bump on each lever that flips ranking — always concrete, never
  hand-waving.
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
    CategoryWinner,
    Counterfactual,
    DataSourceMeta,
    DecisionFingerprint,
    FinalRecommendation,
    RankedCountry,
    ScoreBreakdown,
    ShortlistRequest,
    ShortlistResponse,
    ShortlistWeights,
    TransitionDelta,
    TransitionStrip,
)

logger = logging.getLogger(__name__)


# ---- Lever decomposition ---------------------------------------------------
# Each "lever" is a weighted aggregation of the underlying metrics.
# Tuned so each lever is in [0, 100]. Coefficients sum to 1.0 per lever.

_LEVERS = ("career", "cost", "family", "lifestyle", "speed")


def _lever_score(m: CountryMetrics, lever: str) -> int:
    if lever == "career":
        # Career: roles available + salary power + sponsor density.
        return round(
            0.40 * m.job_market
            + 0.35 * m.salary_power
            + 0.25 * m.employer_sponsor_density
        )
    if lever == "cost":
        return round(0.55 * m.cost_of_living + 0.45 * m.housing_pressure)
    if lever == "family":
        return round(
            0.50 * m.family_fit
            + 0.25 * m.quality_of_life
            + 0.25 * m.housing_pressure
        )
    if lever == "lifestyle":
        return round(
            0.45 * m.quality_of_life
            + 0.30 * m.language_fit
            + 0.25 * m.cost_of_living
        )
    if lever == "speed":
        return round(0.55 * m.speed_to_land + 0.45 * m.visa_friction)
    raise ValueError(f"unknown lever: {lever}")


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


# ---- Category winners ------------------------------------------------------


_CATEGORIES: dict[str, str] = {
    "Career": "career",  # uses lever score
    "Cost": "cost",
    "Family": "family",
    "Lifestyle": "lifestyle",
    "Speed": "speed",
    "Visa friendliness": "visa_friction_metric",
}


def _category_winners(metrics: list[CountryMetrics]) -> list[CategoryWinner]:
    out: list[CategoryWinner] = []
    for label, key in _CATEGORIES.items():
        scored: list[tuple[CountryMetrics, int]] = []
        for m in metrics:
            if key == "visa_friction_metric":
                v = m.visa_friction
            else:
                v = _lever_score(m, key)
            scored.append((m, v))
        scored.sort(key=lambda x: -x[1])
        top = scored[0]
        runner = scored[1] if len(scored) > 1 else None
        out.append(
            CategoryWinner(
                category=label,
                winner_code=top[0].code,
                winner_name=top[0].name,
                winning_score=top[1],
                runner_up_name=runner[0].name if runner else None,
                margin=top[1] - (runner[1] if runner else 0),
            )
        )
    return out


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
        # Pick headlines: the largest positive delta + largest negative delta.
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


def _transition_note(label: str, o: int, d: int, diff: int) -> str:
    if abs(diff) <= 4:
        return f"≈ {o}/100"
    if diff > 0:
        return f"{o} → {d}"
    return f"{o} → {d}"


# ---- Counterfactual simulator ---------------------------------------------


def _counterfactuals(
    metrics: list[CountryMetrics],
    weights: ShortlistWeights,
) -> list[Counterfactual]:
    """Find the smallest weight perturbation per lever that flips the ranking.

    For each pair (winner, challenger) where challenger is currently
    ranked below winner, we sweep each lever's weight upward (or another
    lever's weight downward) until the challenger's weighted score
    exceeds the winner's. The smallest such bump becomes the
    counterfactual for that pair.

    We surface up to 4 counterfactuals — typically (#1 vs #2),
    (#1 vs #3), and one or two cross-lever swaps.
    """
    if len(metrics) < 2:
        return []
    base = _normalize_weights(weights)
    ranked = sorted(
        metrics,
        key=lambda m: -_weighted_score_from_dict(m, base),
    )
    winner = ranked[0]
    out: list[Counterfactual] = []

    for challenger in ranked[1:]:
        # First pass: single-lever bump (direct, easiest to explain).
        best: tuple[int, str, str] | None = None
        for lever in _LEVERS:
            cf = _smallest_bump(winner, challenger, base, lever)
            if cf is None:
                continue
            pct, direction = cf
            if best is None or pct < best[0]:
                best = (pct, lever, direction)

        # Second pass: if no single-lever flip exists, find the smallest
        # paired swap — bump the challenger's best lever AND demote the
        # winner's best lever. This is the realistic case when one country
        # dominates a heavily-weighted dimension.
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


def _smallest_swap(
    winner: CountryMetrics,
    challenger: CountryMetrics,
    base: dict[str, float],
) -> tuple[int, str, str] | None:
    """Find the smallest paired swap that flips ranking.

    A swap moves weight from the winner's strongest lever to the
    challenger's strongest lever. This is what most "what would change
    the result?" answers are in practice — "give cost more weight than
    career and X wins."
    """
    # Pick the lever where the challenger has the largest delta over the winner.
    deltas = sorted(
        ((lever, _lever_score(challenger, lever) - _lever_score(winner, lever))
         for lever in _LEVERS),
        key=lambda x: -x[1],
    )
    if not deltas or deltas[0][1] <= 0:
        return None
    challenger_lever = deltas[0][0]
    # Step the swap from 5% → 200%.
    for pct in range(5, 205, 5):
        new = _perturb(base, challenger_lever, "increase", pct)
        if (
            _weighted_score_from_dict(challenger, new)
            > _weighted_score_from_dict(winner, new)
        ):
            return pct, challenger_lever, "increase"
    # If even doubling weights doesn't flip, try also zeroing the winner's lever.
    winner_lever = max(_LEVERS, key=lambda l: _lever_score(winner, l) - _lever_score(challenger, l))
    if winner_lever != challenger_lever:
        new = dict(base)
        new[winner_lever] = 0.0
        new[challenger_lever] *= 3.0
        total = sum(new.values())
        if total > 0:
            new = {k: v / total for k, v in new.items()}
            if _weighted_score_from_dict(challenger, new) > _weighted_score_from_dict(winner, new):
                return 100, challenger_lever, "increase"
    return None


def _weighted_score_from_dict(m: CountryMetrics, w: dict[str, float]) -> float:
    return sum(w[lever] * _lever_score(m, lever) for lever in _LEVERS)


def _smallest_bump(
    winner: CountryMetrics,
    challenger: CountryMetrics,
    base: dict[str, float],
    lever: str,
) -> tuple[int, str] | None:
    """Find the smallest single-lever perturbation that flips the ranking.

    We check both directions: increase this lever's relative weight
    (taking from the others proportionally) and decrease it. Step size
    is 5 percentage points; we stop at 200% perturbation.
    """
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
    """Bump one lever by `pct` % (relative to its current weight) and
    re-normalise so all weights sum to 1.0.
    """
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
    """Classify the weighted vector into a discrete style."""
    items = sorted(weights.items(), key=lambda x: -x[1])
    top, top_w = items[0]
    second, second_w = items[1]

    # If top dominates ( ≥ 0.40 AND ≥ 1.5x the next ), pick a single style.
    if top_w >= 0.40 and top_w >= 1.5 * second_w:
        style, label = _STYLES_BY_TOP[top]
    elif top_w - items[-1][1] < 0.08:
        style, label = "balanced", "Balanced mover"
    else:
        # Hybrid styles when top + second dominate together.
        pair = frozenset((top, second))
        style, label = _PAIR_STYLES.get(
            pair, _STYLES_BY_TOP[top]
        )

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
    # Pick the next action based on which lever drove the win.
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
    """Spread tells us how confident we should be in the score.

    Tight metrics (everything bunched in one band) means low confidence
    — there's no clear differentiator. Wide spread = the country has a
    strong identity, so the score is meaningful.
    """
    values = [
        m.job_market, m.salary_power, m.employer_sponsor_density,
        m.visa_friction, m.speed_to_land,
        m.cost_of_living, m.housing_pressure,
        m.quality_of_life, m.family_fit, m.language_fit,
    ]
    spread = max(values) - min(values)
    # Map spread 0..80 → 0.55..0.95
    return round(0.55 + min(0.40, spread / 200.0), 2)


# ---- Top-level entrypoint -------------------------------------------------


def compute_shortlist(
    request: ShortlistRequest,
    *,
    origin_country_code: str | None = None,
) -> ShortlistResponse:
    """Score, rank, and explain a 2–5 country shortlist."""
    metrics = _resolve_metrics(request.countries)
    if len(metrics) < 2:
        raise ValueError(
            "Need at least 2 known countries in the shortlist; got "
            f"{len(metrics)} after resolving."
        )

    weights = _normalize_weights(request.weights)
    scored: list[tuple[CountryMetrics, int]] = [
        (m, _weighted_score(m, weights)) for m in metrics
    ]
    scored.sort(key=lambda x: -x[1])

    ranked: list[RankedCountry] = [
        RankedCountry(
            code=m.code,
            name=m.name,
            region=m.region,
            rank=i + 1,
            weighted_score=score,
            breakdown=_breakdown(m),
            top_strength=_top_strength(m),
            top_risk=_top_risk(m),
            confidence=_country_confidence(m),
        )
        for i, (m, score) in enumerate(scored)
    ]

    origin = get_country(origin_country_code) if origin_country_code else None
    transitions = _transitions(origin, [m for m, _ in scored])

    counterfactuals = _counterfactuals(metrics, request.weights)
    fingerprint = _fingerprint(weights)
    final = _final(ranked, weights)

    assumptions: list[str] = [
        "Scores aggregate curated 2026-Q1 country metrics; cost-of-living is a relative index, not absolute amounts.",
        "Visa-ease is a heuristic from public processing-time tables — not legal advice.",
    ]
    if origin is None:
        assumptions.append(
            "Origin → destination transitions skipped because no current_country is set on the profile.",
        )

    return ShortlistResponse(
        countries=ranked,
        category_winners=_category_winners([m for m, _ in scored]),
        transitions=transitions,
        counterfactuals=counterfactuals,
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
