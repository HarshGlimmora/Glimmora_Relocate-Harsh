"""Case service.

Owns:
  - one active case per user (creates on first login if missing)
  - state transitions (delegating to orchestration.state_machine for validity)
  - snapshotting current profile inputs into the case
  - bumping inputs_revision when monitored fields change
"""

from __future__ import annotations

from typing import Any

from app.middleware.error_handler import BadRequest
from app.modules.case.repository import CaseRepository
from app.modules.case.schemas import CaseOut
from app.orchestration.dependency_map import all_known_input_keys
from app.orchestration.state_machine import InvalidTransition, transition
from app.schemas.case import CaseState
from app.schemas.profile import UserProfile
from app.storage.models import RelocationCase as CaseORM


class CaseService:
    def __init__(self, repo: CaseRepository) -> None:
        self.repo = repo

    # --- read / create ---

    async def get_or_create_active_case(self, user_id: str) -> CaseORM:
        row = await self.repo.get_active(user_id)
        if row is not None:
            return row
        return await self.repo.create_initial(user_id)

    async def create_initial_case(self, user_id: str) -> CaseORM:
        existing = await self.repo.get_active(user_id)
        if existing is not None:
            return existing
        return await self.repo.create_initial(user_id)

    # --- transitions ---

    async def transition(self, *, case_id: str, target: CaseState) -> CaseORM:
        row = await self.repo.get_by_id(case_id)
        if row is None:
            raise BadRequest(f"case {case_id} not found")
        try:
            target = transition(CaseState(row.state), target)
        except InvalidTransition as e:
            raise BadRequest(str(e)) from e
        await self.repo.set_state(case_id, target.value)
        await self.repo.session.refresh(row)
        return row

    # --- snapshots / revision ---

    async def snapshot_inputs(self, *, case_id: str, profile: UserProfile) -> None:
        snapshot = _profile_snapshot(profile)
        await self.repo.write_snapshot(case_id, snapshot=snapshot)

    async def maybe_bump_revision(
        self, *, case_id: str, changed_keys: set[str]
    ) -> int:
        """Bump the case's inputs_revision iff a known dependency-mapped key changed.

        Returns the (possibly unchanged) current revision.
        """
        row = await self.repo.get_by_id(case_id)
        if row is None:
            raise BadRequest(f"case {case_id} not found")

        relevant = changed_keys & all_known_input_keys()
        if not relevant:
            return row.inputs_revision

        return await self.repo.bump_revision(case_id)

    # --- output ---

    @staticmethod
    def to_dto(row: CaseORM) -> CaseOut:
        return CaseOut(
            id=row.id,
            user_id=row.user_id,
            state=CaseState(row.state),
            state_changed_at=row.state_changed_at,
            inputs_revision=row.inputs_revision,
            inputs_snapshot=row.inputs_snapshot or {},
            active=row.active,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


def _profile_snapshot(profile: UserProfile) -> dict[str, Any]:
    """Snapshot only the input fields that drive analyses.

    Skipping derived/meta fields (field_sources, completion_percentage) keeps
    the snapshot stable — those move on every PATCH and would otherwise
    create spurious revision bumps.
    """
    d = profile.model_dump()
    d.pop("field_sources", None)
    d.pop("completion_percentage", None)
    return d
