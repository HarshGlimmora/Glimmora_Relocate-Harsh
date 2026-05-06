"""Profile service — orchestrates merge logic + persistence + dependency map."""

from __future__ import annotations

from typing import Any

from app.modules.profile.merge import (
    apply_user_patch,
    merge_resume_into_profile,
    required_missing,
)
from app.modules.profile.repository import ProfileRepository
from app.orchestration.dependency_map import impacted_modules
from app.schemas.profile import FieldSource, ResumeExtraction, UserProfile
from app.storage.models import UserProfile as UserProfileORM


class ProfileService:
    def __init__(self, repo: ProfileRepository) -> None:
        self.repo = repo

    # --- read ---

    async def get_profile(self, user_id: str) -> UserProfile:
        row = await self.repo.upsert_blank(user_id)
        return _orm_to_pydantic(row)

    async def required_missing(self, user_id: str) -> list[str]:
        return required_missing(await self.get_profile(user_id))

    # --- create ---

    async def ensure_empty_profile(self, user_id: str) -> UserProfile:
        row = await self.repo.upsert_blank(user_id)
        return _orm_to_pydantic(row)

    # --- updates ---

    async def apply_patch(
        self, *, user_id: str, patch_values: dict[str, Any]
    ) -> tuple[UserProfile, set[str]]:
        """Apply a user-driven patch. Returns (new_profile, changed_keys)."""
        current = await self.get_profile(user_id)
        new, changed = apply_user_patch(profile=current, patch_values=patch_values)
        await self._write(user_id, new)
        return new, changed

    async def apply_resume_extraction(
        self, *, user_id: str, extraction: ResumeExtraction
    ) -> tuple[UserProfile, dict[str, FieldSource]]:
        """Auto-fill profile from a resume parse without overriding user values."""
        current = await self.get_profile(user_id)
        new, delta = merge_resume_into_profile(profile=current, extraction=extraction)
        await self._write(user_id, new)
        return new, delta

    # --- helpers ---

    @staticmethod
    def impact(changed_keys: set[str]) -> list[str]:
        return [m.value for m in impacted_modules(changed_keys)]

    async def _write(self, user_id: str, profile: UserProfile) -> None:
        row = await self.repo.upsert_blank(user_id)
        d = profile.model_dump(mode="python")
        # Map the pydantic model into ORM columns explicitly.
        for key in _PROFILE_PERSISTED_COLUMNS:
            setattr(row, key, d.get(key))
        # field_sources stored as {field: "resume"|"user"|"merged"}
        row.field_sources = {k: v for k, v in d.get("field_sources", {}).items()}


# Single source of truth: every column that round-trips between the ORM
# and the Pydantic UserProfile. Adding a profile field requires touching
# only this list + the schema + the migration.
_PROFILE_PERSISTED_COLUMNS: tuple[str, ...] = (
    # identity
    "full_name",
    "phone",
    "current_role",
    "target_role",
    "current_employer",
    "industry",
    "seniority",
    "years_experience",
    "skills",
    "education",
    "companies",
    "certifications",
    "languages_known",
    "destination_language_confidence",
    # relocation
    "current_country",
    "current_city",
    "target_country",
    "target_city",
    "nationality",
    "current_visa_status",
    "open_to_alternatives",
    "alternatives",
    "relocation_goal",
    "reason_for_moving",
    # finance
    "current_salary",
    "expected_salary",
    "salary_currency",
    "monthly_budget",
    "savings",
    "rent_expectation",
    "cost_sensitivity",
    # intent + ranking
    "move_urgency",
    "work_preference",
    "relocation_budget",
    "needs_visa_sponsorship",
    "priority_ranking",
    # household
    "family_status",
    "moving_with_family",
    "children_count",
    "parents_moving",
    "family_budget_impact",
    "housing_requirement",
    "school_requirement",
    # readiness
    "readiness_level",
    "move_clarity_score",
    # documents
    "current_document_status",
    # meta
    "completion_percentage",
)


def _orm_to_pydantic(row: UserProfileORM) -> UserProfile:
    payload: dict[str, Any] = {}
    for key in _PROFILE_PERSISTED_COLUMNS:
        v = getattr(row, key, None)
        if isinstance(v, list):
            payload[key] = list(v)
        elif isinstance(v, dict):
            payload[key] = dict(v)
        else:
            payload[key] = v
    # JSON columns can come back as None on a fresh row; coerce.
    for list_field in (
        "skills",
        "education",
        "companies",
        "certifications",
        "languages_known",
        "alternatives",
        "priority_ranking",
    ):
        if payload.get(list_field) is None:
            payload[list_field] = []
    if payload.get("current_document_status") is None:
        payload["current_document_status"] = {}
    payload["field_sources"] = row.field_sources or {}
    payload["completion_percentage"] = row.completion_percentage or 0
    return UserProfile.model_validate(payload)
