"""Case state machine.

Pure function over (current_state, new_state) for transition validation, plus
a deterministic recomputation rule used after analysis status changes.

The actual database write happens in the case repository — this module only
computes the target state.
"""

from __future__ import annotations

from collections import Counter

from app.schemas.case import ALLOWED_TRANSITIONS, CaseState
from app.schemas.envelope import AnalysisStatus


class InvalidTransition(Exception):
    pass


def transition(src: CaseState, dst: CaseState) -> CaseState:
    if dst not in ALLOWED_TRANSITIONS[src]:
        raise InvalidTransition(f"{src.value} -> {dst.value} not allowed")
    return dst


def recompute_state(
    current: CaseState,
    module_statuses: list[AnalysisStatus],
    any_stale: bool,
) -> CaseState:
    """Derive the case state from module statuses and stale flags.

    Inputs:
      - current: the case's existing state (used to gate transitions away
        from terminal-ish states like ARCHIVED).
      - module_statuses: list of AnalysisStatus for the modules the system
        cares about (the 9 analyses + synthesis). Empty list means no
        analyses have been run yet.
      - any_stale: true if at least one current module row has stale=true.
    """
    if current == CaseState.ARCHIVED:
        return current

    if not module_statuses:
        # No analyses yet. The only valid pre-analysis states are draft,
        # profile_ready, and (rarely) failed if the kickoff itself blew up.
        return current if current in (CaseState.DRAFT, CaseState.PROFILE_READY) else current

    counts = Counter(module_statuses)
    n_total = len(module_statuses)
    n_ready = counts.get(AnalysisStatus.READY, 0)
    n_failed = counts.get(AnalysisStatus.FAILED, 0)
    n_generating = counts.get(AnalysisStatus.GENERATING, 0)

    if any_stale and n_generating == 0:
        return CaseState.STALE
    if any_stale and n_generating > 0:
        return CaseState.PARTIALLY_READY
    if n_ready == n_total:
        return CaseState.READY
    if n_generating > 0 and n_ready == 0 and n_failed == 0:
        return CaseState.ANALYZING
    if n_failed == n_total:
        return CaseState.FAILED
    return CaseState.PARTIALLY_READY
