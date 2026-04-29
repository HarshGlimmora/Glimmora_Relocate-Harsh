"""Document Checklist contracts.

The artifact is the most "deterministic-feeling" of the analyses: a list of
checklist items, each with status, urgency, and a `required_for` mapping
that tells the user *which part of the move depends on this document*.
The frontend renders it as a checkbox list with progress bar.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- inputs (route body) -----


class DocumentStatusInput(BaseModel):
    """Per-document self-report.

    Allowed shapes from the frontend's documents page:
      {has: bool, expires_at?: ISO date, notes?: str}
    """

    model_config = ConfigDict(extra="forbid")

    has: Optional[bool] = None
    expires_at: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=240)


class DocumentsInputs(BaseModel):
    """Body for POST /documents/run.

    `current_document_status` is a free-form mapping of `kind -> status`. The
    user's profile already stores this; if the body provides a different
    map, body wins for this run.
    """

    model_config = ConfigDict(extra="forbid")

    current_document_status: Optional[dict[str, DocumentStatusInput]] = Field(
        default=None,
        description="self-reported per-document status; overrides profile when provided",
    )

    force: bool = False


# ----- detail payload -----


class ChecklistItem(BaseModel):
    kind: str = Field(
        min_length=1,
        max_length=80,
        description="canonical document key (e.g., 'PASSPORT', 'BIRTH_CERT')",
    )
    label: str = Field(min_length=1, max_length=120)
    status: str = Field(
        pattern="^(have|need|expiring|unknown)$",
        description="have = user has it; need = missing; expiring = present but expiring within ~12mo",
    )
    urgency: str = Field(
        pattern="^(now|30d|90d|6m|later)$",
        description="when the user should act on this item",
    )
    required_for: list[str] = Field(
        default_factory=list,
        max_length=8,
        description="purposes this document gates, e.g. ['visa', 'family_visa', 'school_admission']",
    )
    expires_at: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=300)


class NextToHandle(BaseModel):
    kind: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=120)
    why: str = Field(min_length=1, max_length=300)


class DocumentChecklistDetail(BaseModel):
    """Strict checklist artifact rendered by the frontend's Page 9."""

    items: list[ChecklistItem] = Field(min_length=1, max_length=40)
    readiness_percentage: int = Field(ge=0, le=100)
    have_count: int = Field(ge=0)
    need_count: int = Field(ge=0)
    expiring_count: int = Field(ge=0)
    total_count: int = Field(ge=1)

    missing_items: list[ChecklistItem] = Field(default_factory=list, max_length=40)
    expiring_items: list[ChecklistItem] = Field(default_factory=list, max_length=40)

    required_for_summary: dict[str, list[str]] = Field(
        default_factory=dict,
        description="purpose -> list of doc kinds that gate it (e.g. {'visa': ['PASSPORT', 'CV']})",
    )

    next_to_handle: NextToHandle
    headline_finding: str = Field(min_length=1, max_length=400)
