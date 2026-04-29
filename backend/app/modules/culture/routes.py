"""Culture & Language HTTP surface.

POST /api/v1/case/{case_id}/culture/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/culture         — latest current row
GET  /api/v1/case/{case_id}/culture/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.culture.schemas import CultureInputs
from app.modules.culture.service import CultureService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/culture",
    tags=["culture"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: CultureInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await CultureService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await CultureService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no culture analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await CultureService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
