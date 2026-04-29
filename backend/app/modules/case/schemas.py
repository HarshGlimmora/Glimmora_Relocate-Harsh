"""Case API shapes."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.case import CaseState


class CaseOut(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    user_id: str
    state: CaseState
    state_changed_at: datetime
    inputs_revision: int = Field(ge=1)
    inputs_snapshot: dict[str, Any] = Field(default_factory=dict)
    active: bool
    created_at: datetime
    updated_at: datetime


class CaseTransitionIn(BaseModel):
    target_state: CaseState
