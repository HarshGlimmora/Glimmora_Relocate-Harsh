"""Profile HTTP surface."""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.modules.case.repository import CaseRepository
from app.modules.case.service import CaseService
from app.modules.profile.merge import required_missing
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.schemas import (
    ProfilePatch,
    ProfilePatchResult,
    ProfileResponse,
)
from app.modules.profile.service import ProfileService
from app.orchestration.dependency_map import impacted_modules
from app.storage.analyses import AnalysesRepository

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


def _service(session) -> ProfileService:
    return ProfileService(ProfileRepository(session))


@router.get("", response_model=ProfileResponse)
async def get_profile(user: CurrentUser, session: SessionDep) -> ProfileResponse:
    profile = await _service(session).get_profile(user.id)
    return ProfileResponse(
        profile=profile,
        field_sources={k: v for k, v in profile.field_sources.items()},
        completion_percentage=profile.completion_percentage,
        required_missing=required_missing(profile),
    )


@router.patch("", response_model=ProfilePatchResult)
async def patch_profile(
    body: ProfilePatch, user: CurrentUser, session: SessionDep
) -> ProfilePatchResult:
    patch_values = body.model_dump(exclude_unset=True)
    profile_service = _service(session)
    new_profile, changed = await profile_service.apply_patch(
        user_id=user.id, patch_values=patch_values
    )

    cases = CaseService(CaseRepository(session))
    case = await cases.get_or_create_active_case(user.id)
    await cases.snapshot_inputs(case_id=case.id, profile=new_profile)
    revision = await cases.maybe_bump_revision(case_id=case.id, changed_keys=changed)

    # Stale-mark any current analysis rows whose modules are impacted.
    impacted = [m.value for m in impacted_modules(changed)]
    if impacted:
        sample_key = next(iter(changed))
        sample_value = patch_values.get(sample_key)
        reason = f"{sample_key} changed → {sample_value!r} (revision {revision})"
        await AnalysesRepository(session).mark_stale(
            case_id=case.id, kinds=impacted, reason=reason
        )

    return ProfilePatchResult(
        profile=new_profile,
        field_sources={k: v for k, v in new_profile.field_sources.items()},
        completion_percentage=new_profile.completion_percentage,
        required_missing=required_missing(new_profile),
        changed_keys=sorted(changed),
        impacted_modules=ProfileService.impact(changed),
        inputs_revision=revision,
    )
