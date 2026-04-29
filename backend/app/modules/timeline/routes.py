"""Timeline HTTP surface.

POST /api/v1/case/{case_id}/timeline/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/timeline         — latest current row
GET  /api/v1/case/{case_id}/timeline/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.timeline.schemas import TimelineInputs
from app.modules.timeline.service import TimelineService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/timeline",
    tags=["timeline"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: TimelineInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await TimelineService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await TimelineService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no timeline analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await TimelineService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
