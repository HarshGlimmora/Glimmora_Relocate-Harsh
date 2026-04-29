"""Workflow & Dependencies contracts.

The artifact is a directed graph of relocation tasks. Each node is a discrete
piece of work with a duration estimate, owner, status, and category. Edges
express ordering / blocking relationships, with a short reason explaining
*why* the dependency exists. The frontend renders this as a Gantt-ish
timeline plus a "what's next" call-to-action, so we surface the critical
path, the blocked nodes, and the user's current stage explicitly.

Schema design notes:
  - `kind` and `category` are open-ish strings (we don't want the LLM to
    invent enum members and fail validation), but length-bounded.
  - Edge `from_node`/`to_node` references must point to declared node ids;
    the schema does not enforce that (Pydantic can't easily reason about
    cross-field references), but the service-level helper does.
  - Critical path is a list of node ids (validated as strings only — the
    service can re-walk and verify if needed).
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class WorkflowInputs(BaseModel):
    """Body for POST /workflow/run.

    No user-supplied parameters today: the workflow is fully derived from
    profile + case + prior analyses. We keep this object so that future
    knobs (e.g. "exclude_visa_path") can be added without breaking the
    route contract.
    """

    model_config = ConfigDict(extra="forbid")

    force: bool = False


# ----- detail payload -----


class WorkflowNode(BaseModel):
    """One unit of work in the relocation workflow."""

    id: str = Field(min_length=1, max_length=80, description="stable id, e.g. 'visa_application'")
    label: str = Field(min_length=1, max_length=120)
    category: str = Field(
        min_length=1,
        max_length=40,
        description="logical bucket: visa | documents | jobs | family | finance | logistics | arrival",
    )
    status: str = Field(
        pattern="^(not_started|in_progress|done|blocked|skipped)$",
    )
    estimated_duration_days_min: int = Field(ge=0, le=720)
    estimated_duration_days_max: int = Field(ge=0, le=720)
    owner: str = Field(
        pattern="^(user|spouse|employer|adviser|government|landlord|school|none)$",
        description="who actually does the work",
    )
    description: Optional[str] = Field(default=None, max_length=400)
    blocked_reason: Optional[str] = Field(
        default=None,
        max_length=240,
        description="present iff status=blocked",
    )


class WorkflowEdge(BaseModel):
    """`to_node` cannot start until `from_node` is done (or in_progress)."""

    from_node: str = Field(min_length=1, max_length=80)
    to_node: str = Field(min_length=1, max_length=80)
    reason: str = Field(
        min_length=1,
        max_length=240,
        description="why the dependency exists, in plain language",
    )
    hard: bool = Field(
        default=True,
        description="hard=true means the downstream cannot start at all; hard=false means it can start but is risky",
    )


class WorkflowNextAction(BaseModel):
    """The next concrete user-facing action — distinct from envelope-level NextAction.

    We keep a separate type because workflow next actions reference graph
    node ids and carry an `effort_hours` hint that helps the frontend pick
    UI affordance (a 30-minute task vs a 6-hour task).
    """

    node_id: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=160)
    why: str = Field(min_length=1, max_length=400)
    effort_hours: float = Field(ge=0.0, le=200.0)


class WorkflowDetail(BaseModel):
    """Strict workflow artifact rendered by the frontend's Page 10."""

    nodes: list[WorkflowNode] = Field(min_length=2, max_length=60)
    edges: list[WorkflowEdge] = Field(default_factory=list, max_length=200)

    current_stage_node_id: str = Field(
        min_length=1,
        max_length=80,
        description="id of the node the user is currently on",
    )
    critical_path: list[str] = Field(
        min_length=1,
        max_length=40,
        description="ordered list of node ids forming the longest dependency chain",
    )
    blocked_node_ids: list[str] = Field(default_factory=list, max_length=40)

    total_estimated_days_min: int = Field(ge=0, le=1825)
    total_estimated_days_max: int = Field(ge=0, le=1825)

    headline_finding: str = Field(min_length=1, max_length=400)
