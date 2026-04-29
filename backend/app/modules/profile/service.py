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
        for key in (
            "full_name",
            "current_role",
            "industry",
            "years_experience",
            "seniority",
            "skills",
            "education",
            "companies",
            "current_country",
            "current_city",
            "target_country",
            "target_city",
            "nationality",
            "current_visa_status",
            "current_salary",
            "expected_salary",
            "salary_currency",
            "move_urgency",
            "work_preference",
            "relocation_budget",
            "needs_visa_sponsorship",
            "priority_ranking",
            "current_document_status",
            "completion_percentage",
        ):
            setattr(row, key, d.get(key))
        # field_sources stored as {field: "resume"|"user"|"merged"}
        row.field_sources = {k: v for k, v in d.get("field_sources", {}).items()}


def _orm_to_pydantic(row: UserProfileORM) -> UserProfile:
    return UserProfile.model_validate(
        {
            "full_name": row.full_name,
            "current_role": row.current_role,
            "industry": row.industry,
            "seniority": row.seniority,
            "years_experience": row.years_experience,
            "skills": row.skills or [],
            "education": row.education or [],
            "companies": row.companies or [],
            "current_country": row.current_country,
            "current_city": row.current_city,
            "target_country": row.target_country,
            "target_city": row.target_city,
            "nationality": row.nationality,
            "current_visa_status": row.current_visa_status,
            "current_salary": row.current_salary,
            "expected_salary": row.expected_salary,
            "salary_currency": row.salary_currency,
            "move_urgency": row.move_urgency,
            "work_preference": row.work_preference,
            "relocation_budget": row.relocation_budget,
            "needs_visa_sponsorship": row.needs_visa_sponsorship,
            "priority_ranking": row.priority_ranking or [],
            "current_document_status": row.current_document_status or {},
            "field_sources": row.field_sources or {},
            "completion_percentage": row.completion_percentage or 0,
        }
    )
