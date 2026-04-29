"""Family Relocation HTTP surface.

POST /api/v1/case/{case_id}/family/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/family         — latest current row
GET  /api/v1/case/{case_id}/family/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.family.schemas import FamilyInputs
from app.modules.family.service import FamilyService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/family",
    tags=["family"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: FamilyInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await FamilyService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await FamilyService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no family-relocation analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await FamilyService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
