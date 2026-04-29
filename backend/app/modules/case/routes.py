"""Case HTTP surface."""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import Forbidden, NotFound
from app.modules.case.repository import CaseRepository
from app.modules.case.schemas import CaseOut, CaseTransitionIn
from app.modules.case.service import CaseService

router = APIRouter(prefix="/api/v1/case", tags=["case"])


def _service(session) -> CaseService:
    return CaseService(CaseRepository(session))


@router.get("/active", response_model=CaseOut)
async def active_case(user: CurrentUser, session: SessionDep) -> CaseOut:
    svc = _service(session)
    row = await svc.get_or_create_active_case(user.id)
    return CaseService.to_dto(row)


@router.get("/{case_id}", response_model=CaseOut)
async def get_case(case_id: str, user: CurrentUser, session: SessionDep) -> CaseOut:
    svc = _service(session)
    row = await CaseRepository(session).get_by_id(case_id)
    if row is None:
        raise NotFound("case not found")
    if row.user_id != user.id:
        raise Forbidden("not your case")
    return CaseService.to_dto(row)


@router.post("/{case_id}/transition", response_model=CaseOut)
async def transition_case(
    case_id: str,
    body: CaseTransitionIn,
    user: CurrentUser,
    session: SessionDep,
) -> CaseOut:
    row = await CaseRepository(session).get_by_id(case_id)
    if row is None:
        raise NotFound("case not found")
    if row.user_id != user.id:
        raise Forbidden("not your case")
    svc = _service(session)
    updated = await svc.transition(case_id=case_id, target=body.target_state)
    return CaseService.to_dto(updated)
