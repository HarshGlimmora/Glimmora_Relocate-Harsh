"""Profile merge logic — pure functions, no I/O.

Two callers:
  - resume parse → produces a ResumeExtraction; we want to fill *empty* profile
    fields without overriding values the user has already entered.
  - user PATCH → user values always win; if the field had a resume value before,
    the source flips to "user" (or "merged" if both contributed to a list).

Keeping this pure makes it trivially testable and reusable from both flows.
"""

from __future__ import annotations

from typing import Any

from app.schemas.profile import (
    PROFILE_REQUIRED_FOR_ANALYSIS,
    Education,
    FieldSource,
    ResumeExtraction,
    Skill,
    UserProfile,
)


# Fields counted toward completion %. Kept explicit so changes are deliberate.
# Now includes the data-first intake fields collected during the multi-step
# onboarding (destination, jobs, family, visa, budget). The user is gated
# off the analysis pages until completion is high enough.
COMPLETION_FIELDS: tuple[str, ...] = (
    # identity (resume-fillable)
    "full_name",
    "current_role",
    "target_role",
    "industry",
    "years_experience",
    "seniority",
    "skills",
    "languages_known",
    # location
    "current_country",
    "target_country",
    "nationality",
    # finance
    "current_salary",
    "expected_salary",
    "salary_currency",
    "savings",
    "cost_sensitivity",
    # intent
    "relocation_goal",
    "reason_for_moving",
    "move_urgency",
    "work_preference",
    "needs_visa_sponsorship",
    "priority_ranking",
    # household
    "family_status",
    "moving_with_family",
    # readiness
    "readiness_level",
)


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    if isinstance(value, (list, dict)) and len(value) == 0:
        return True
    return False


def merge_resume_into_profile(
    *, profile: UserProfile, extraction: ResumeExtraction
) -> tuple[UserProfile, dict[str, FieldSource]]:
    """Fill empty profile fields from the resume extraction.

    Never overwrites user-entered fields. Returns the new profile and the
    delta to apply to field_sources (only fields actually filled by resume).
    """
    data = profile.model_dump()
    sources: dict[str, FieldSource] = dict(profile.field_sources)
    delta: dict[str, FieldSource] = {}

    def fill(key: str, new_value: Any) -> None:
        if _is_empty(new_value):
            return
        existing = data.get(key)
        existing_source = sources.get(key)
        if _is_empty(existing) and existing_source != FieldSource.USER:
            data[key] = new_value
            sources[key] = FieldSource.RESUME
            delta[key] = FieldSource.RESUME

    fill("full_name", extraction.full_name)
    fill("current_role", extraction.current_role)
    # `inferred_job_category` is the LLM's guess at where this person could
    # next role-shift to. Treat that as a soft target_role hint when the user
    # hasn't said otherwise.
    fill("target_role", extraction.inferred_job_category)
    fill("current_employer", extraction.current_company)
    fill("industry", extraction.inferred_industry)
    fill("years_experience", extraction.years_experience)
    fill("seniority", extraction.seniority.value if extraction.seniority else None)

    # Contact info that the resume frequently has.
    if extraction.phones:
        fill("phone", extraction.phones[0])

    # Lists: fill if empty.
    if _is_empty(data.get("skills")) and extraction.skills:
        data["skills"] = [s.model_dump() for s in extraction.skills]
        sources["skills"] = FieldSource.RESUME
        delta["skills"] = FieldSource.RESUME

    if _is_empty(data.get("education")) and extraction.education:
        data["education"] = [e.model_dump() for e in extraction.education]
        sources["education"] = FieldSource.RESUME
        delta["education"] = FieldSource.RESUME

    if _is_empty(data.get("companies")) and extraction.experience:
        data["companies"] = [exp.company for exp in extraction.experience if exp.company]
        sources["companies"] = FieldSource.RESUME
        delta["companies"] = FieldSource.RESUME

    if _is_empty(data.get("certifications")) and extraction.certifications:
        # Profile stores a flat list of names — that's what the UI shows in
        # one line. Detail (issuer, date) lives on the resume parse only.
        data["certifications"] = [c.name for c in extraction.certifications if c.name]
        if data["certifications"]:
            sources["certifications"] = FieldSource.RESUME
            delta["certifications"] = FieldSource.RESUME

    if _is_empty(data.get("languages_known")) and extraction.languages:
        data["languages_known"] = [
            (lang.name + (f" ({lang.level})" if lang.level else ""))
            for lang in extraction.languages
            if lang.name
        ]
        if data["languages_known"]:
            sources["languages_known"] = FieldSource.RESUME
            delta["languages_known"] = FieldSource.RESUME

    data["field_sources"] = sources
    new_profile = UserProfile.model_validate(data)
    new_profile = with_completion(new_profile)
    return new_profile, delta


def apply_user_patch(
    *, profile: UserProfile, patch_values: dict[str, Any]
) -> tuple[UserProfile, set[str]]:
    """Apply a user-supplied patch.

    User values always win. For each touched field, the source flips to USER.
    Returns the new profile and the set of keys that actually changed.
    """
    data = profile.model_dump()
    sources: dict[str, FieldSource] = dict(profile.field_sources)
    changed: set[str] = set()

    for key, value in patch_values.items():
        if key not in data:
            continue
        old = data.get(key)
        if old != value:
            data[key] = value
            changed.add(key)
        # Even if the value is unchanged, an explicit user assertion makes
        # the source "user" — but we only stamp changed keys to keep the
        # source map honest about what *the user actively sent this turn*.
        if key in changed:
            sources[key] = FieldSource.USER

    data["field_sources"] = sources
    new_profile = UserProfile.model_validate(data)
    new_profile = with_completion(new_profile)
    return new_profile, changed


def with_completion(profile: UserProfile) -> UserProfile:
    data = profile.model_dump()
    filled = sum(1 for k in COMPLETION_FIELDS if not _is_empty(data.get(k)))
    pct = round((filled / len(COMPLETION_FIELDS)) * 100)
    data["completion_percentage"] = pct
    return UserProfile.model_validate(data)


def required_missing(profile: UserProfile) -> list[str]:
    data = profile.model_dump()
    return [k for k in PROFILE_REQUIRED_FOR_ANALYSIS if _is_empty(data.get(k))]
