"""RelocationCase contract + state machine.

A Case is the container for one user's relocation journey. The state column
is the single value the frontend's global chrome (status pill, CTAs, page
gating) binds to. Module statuses live on `analyses` rows; the case state is
recomputed from them by orchestration.state_machine.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID


class CaseState(StrEnum):
    DRAFT = "draft"
    PROFILE_READY = "profile_ready"
    ANALYZING = "analyzing"
    PARTIALLY_READY = "partially_ready"
    READY = "ready"
    STALE = "stale"
    FAILED = "failed"
    ARCHIVED = "archived"


# Allowed transitions (source -> set of permitted targets).
# Anything outside this is rejected by the state machine.
ALLOWED_TRANSITIONS: dict[CaseState, set[CaseState]] = {
    CaseState.DRAFT: {CaseState.PROFILE_READY, CaseState.ARCHIVED},
    CaseState.PROFILE_READY: {CaseState.ANALYZING, CaseState.ARCHIVED},
    CaseState.ANALYZING: {
        CaseState.PARTIALLY_READY,
        CaseState.READY,
        CaseState.FAILED,
        CaseState.ARCHIVED,
    },
    CaseState.PARTIALLY_READY: {
        CaseState.READY,
        CaseState.STALE,
        CaseState.FAILED,
        CaseState.ANALYZING,
        CaseState.ARCHIVED,
    },
    CaseState.READY: {CaseState.STALE, CaseState.ANALYZING, CaseState.ARCHIVED},
    CaseState.STALE: {CaseState.PARTIALLY_READY, CaseState.READY, CaseState.ARCHIVED},
    CaseState.FAILED: {CaseState.ANALYZING, CaseState.ARCHIVED},
    CaseState.ARCHIVED: set(),  # terminal
}


def can_transition(src: CaseState, dst: CaseState) -> bool:
    return dst in ALLOWED_TRANSITIONS[src]


class RelocationCase(BaseModel):
    """API contract for a relocation case row."""

    model_config = ConfigDict(use_enum_values=True)

    id: UUID
    user_id: UUID
    state: CaseState
    state_changed_at: datetime
    inputs_revision: int = Field(ge=1)
    inputs_snapshot: dict[str, Any] = Field(default_factory=dict)
    active: bool = True
    created_at: datetime
    updated_at: datetime
