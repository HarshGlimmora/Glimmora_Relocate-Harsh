"""Resume API shapes."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.profile import ResumeExtraction


ResumeStatus = Literal["parsing", "ready", "failed"]


class ResumeUploadOut(BaseModel):
    parse_id: str
    status: ResumeStatus
    storage_uri: str
    file_size: int = Field(ge=0)
    mime_type: str


class ResumeStatusOut(BaseModel):
    parse_id: str
    status: ResumeStatus
    extracted: ResumeExtraction | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class ResumeApplyOut(BaseModel):
    parse_id: str
    profile_completion: int = Field(ge=0, le=100)
    fields_filled_from_resume: list[str]
    field_sources: dict[str, str]
