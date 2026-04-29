"""Timeline contracts.

The artifact translates the workflow graph into a sequenced timeline that a
frontend can render as a Gantt-style bar plus a "what's blocking now" call-
out. We separate **phases** (broad chunks: pre-application, processing,
travel, arrival) from **milestones** (specific events with target weeks),
because users navigate timelines at both levels.

Distinct from workflow:
  - Workflow gives you the dependency graph.
  - Timeline turns it into time. Each phase has start_week / end_week
    relative to a `start_anchor`, plus a milestone list.

`earliest_realistic_start_date` is the date the user could realistically
START the relocation effort, not the move date.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class TimelineInputs(BaseModel):
    """Body for POST /timeline/run.

    Only `force` is exposed for now. Future knobs (e.g. target_arrival_date
    override) plug in here.
    """

    model_config = ConfigDict(extra="forbid")

    force: bool = False


# ----- detail payload -----


class TimelinePhase(BaseModel):
    """A broad chunk of the relocation. Phases are sequential by start_week."""

    id: str = Field(min_length=1, max_length=80, description="stable phase id, e.g. 'pre_application'")
    label: str = Field(min_length=1, max_length=120)
    start_week: int = Field(ge=0, le=260, description="weeks from start_anchor")
    end_week: int = Field(ge=0, le=260)
    description: str = Field(min_length=1, max_length=400)
    category: str = Field(
        min_length=1,
        max_length=40,
        description="logical bucket: pre_application | application | processing | travel | arrival | settlement",
    )


class TimelineMilestone(BaseModel):
    """A specific point-in-time event, anchored to a phase."""

    id: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=120)
    target_week: int = Field(ge=0, le=260, description="weeks from start_anchor")
    phase_id: str = Field(min_length=1, max_length=80)
    depends_on: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="ids of upstream milestones (or workflow node ids) this depends on",
    )
    why: str = Field(min_length=1, max_length=300)


class TimelineBlocker(BaseModel):
    """Something currently blocking timeline progression."""

    label: str = Field(min_length=1, max_length=120)
    detail: str = Field(min_length=1, max_length=400)
    severity: str = Field(pattern="^(low|medium|high)$")
    blocks_phase_id: Optional[str] = Field(default=None, max_length=80)
    estimated_unblock_weeks: int = Field(
        ge=0, le=104, description="weeks from now to remove the blocker"
    )


class TimelineDetail(BaseModel):
    """Strict timeline artifact rendered by the frontend's Page 11."""

    start_anchor: str = Field(
        pattern="^(today|earliest_realistic_start)$",
        description="what week 0 means for the timeline bars",
    )
    earliest_realistic_start_date: date = Field(
        description="ISO date when the user can realistically START the journey",
    )

    phases: list[TimelinePhase] = Field(min_length=2, max_length=10)
    milestones: list[TimelineMilestone] = Field(min_length=3, max_length=40)
    blockers: list[TimelineBlocker] = Field(default_factory=list, max_length=20)

    estimated_total_weeks_min: int = Field(ge=1, le=260)
    estimated_total_weeks_max: int = Field(ge=1, le=260)

    critical_milestones: list[str] = Field(
        default_factory=list,
        max_length=15,
        description="ids of milestones that sit on the critical path",
    )

    headline_finding: str = Field(min_length=1, max_length=400)
