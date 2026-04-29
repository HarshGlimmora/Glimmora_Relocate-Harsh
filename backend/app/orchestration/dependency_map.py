"""Partial-rerun dependency map skeleton.

When a profile/case input changes, only the modules listed here are
invalidated and rerun. The map is exhaustive for the input keys we care
about; unmapped keys are treated as having no analysis impact.

This file is intentionally a constant + thin helpers — runtime dependency
tracking would be extra machinery for no win at this scale. Reviewable in PR
diffs.

Note: the `synthesis` module is appended to the impact set of every change
because the final dashboard verdict must move when any module score moves.
"""

from __future__ import annotations

from app.schemas.envelope import AnalysisKind

# Topological order across the full set of modules. Used to schedule reruns
# so upstream artifacts complete before downstream ones consume them.
TOPOLOGICAL_ORDER: list[AnalysisKind] = [
    AnalysisKind.COUNTRY_COMPARISON,
    AnalysisKind.VISA,
    AnalysisKind.JOBFIT,
    AnalysisKind.FAMILY,
    AnalysisKind.FINANCE,
    AnalysisKind.DOCUMENTS,
    AnalysisKind.CULTURE,
    AnalysisKind.WORKFLOW,
    AnalysisKind.TIMELINE,
    AnalysisKind.SYNTHESIS,
]

# Input key -> modules that must be re-run when that key changes.
# Keys are profile-or-case top-level fields. Synthesis is added by
# `impacted_modules()` so it isn't repeated below.
_DEPENDENCY_MAP: dict[str, set[AnalysisKind]] = {
    # --- salary / cost group ---
    "current_salary": {AnalysisKind.FINANCE},
    "expected_salary": {AnalysisKind.FINANCE},
    "salary_currency": {AnalysisKind.FINANCE},
    "relocation_budget": {AnalysisKind.FINANCE},
    "monthly_budget": {AnalysisKind.FINANCE},
    "savings": {AnalysisKind.FINANCE},
    "rent_expectation": {AnalysisKind.FINANCE},
    "cost_sensitivity": {AnalysisKind.FINANCE},
    # --- destination group (broadest invalidation) ---
    "target_country": {
        AnalysisKind.COUNTRY_COMPARISON,
        AnalysisKind.VISA,
        AnalysisKind.JOBFIT,
        AnalysisKind.FAMILY,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.CULTURE,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "target_city": {
        AnalysisKind.COUNTRY_COMPARISON,
        AnalysisKind.FAMILY,
        AnalysisKind.CULTURE,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "open_to_alternatives": {AnalysisKind.COUNTRY_COMPARISON, AnalysisKind.JOBFIT},
    "alternatives": {AnalysisKind.COUNTRY_COMPARISON, AnalysisKind.JOBFIT},
    # --- visa-driving inputs ---
    "nationality": {
        AnalysisKind.VISA,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "current_visa_status": {
        AnalysisKind.VISA,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "needs_visa_sponsorship": {
        AnalysisKind.VISA,
        AnalysisKind.JOBFIT,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    # --- origin context ---
    "current_country": {
        AnalysisKind.COUNTRY_COMPARISON,
        AnalysisKind.FINANCE,
        AnalysisKind.TIMELINE,
    },
    "current_city": {AnalysisKind.COUNTRY_COMPARISON, AnalysisKind.FINANCE},
    "origin_constraints": {AnalysisKind.TIMELINE},
    # --- family group ---
    "moving_with_family": {
        AnalysisKind.FAMILY,
        AnalysisKind.FINANCE,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "spouse": {
        AnalysisKind.FAMILY,
        AnalysisKind.FINANCE,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "children": {
        AnalysisKind.FAMILY,
        AnalysisKind.FINANCE,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "parents": {
        AnalysisKind.FAMILY,
        AnalysisKind.FINANCE,
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    "family_budget_impact": {AnalysisKind.FAMILY, AnalysisKind.FINANCE},
    "housing_requirement": {AnalysisKind.FAMILY, AnalysisKind.FINANCE},
    # --- career group ---
    "current_role": {AnalysisKind.JOBFIT, AnalysisKind.CULTURE},
    "target_role": {AnalysisKind.JOBFIT, AnalysisKind.CULTURE},
    "industry": {AnalysisKind.JOBFIT},
    "years_experience": {AnalysisKind.JOBFIT},
    "seniority": {AnalysisKind.JOBFIT},
    "skills": {AnalysisKind.JOBFIT},
    "work_preference": {AnalysisKind.JOBFIT, AnalysisKind.CULTURE},
    "open_to_role_change": {AnalysisKind.JOBFIT},
    # --- urgency / docs ---
    "move_urgency": {AnalysisKind.WORKFLOW, AnalysisKind.TIMELINE},
    "current_document_status": {
        AnalysisKind.DOCUMENTS,
        AnalysisKind.WORKFLOW,
        AnalysisKind.TIMELINE,
    },
    # --- preferences ---
    "priority_ranking": set(),  # only synthesis cares; appended automatically
}


def impacted_modules(changed_keys: set[str]) -> list[AnalysisKind]:
    """Return modules to invalidate, in topological order, for a set of changed keys.

    Synthesis is always appended last when at least one upstream module is
    impacted, since the dashboard verdict must always reflect any score change.
    """
    modules: set[AnalysisKind] = set()
    for key in changed_keys:
        modules |= _DEPENDENCY_MAP.get(key, set())

    # Synthesis is in the impact set whenever anything changed at all that
    # we know about — even priority_ranking-only edits.
    if changed_keys & set(_DEPENDENCY_MAP.keys()):
        modules.add(AnalysisKind.SYNTHESIS)

    return [m for m in TOPOLOGICAL_ORDER if m in modules]


def all_known_input_keys() -> set[str]:
    return set(_DEPENDENCY_MAP.keys())
