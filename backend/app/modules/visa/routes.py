"""Visa Direction HTTP surface.

POST /api/v1/case/{case_id}/visa/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/visa         — latest current row
GET  /api/v1/case/{case_id}/visa/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.visa.schemas import VisaInputs
from app.modules.visa.service import VisaService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/visa",
    tags=["visa"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: VisaInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await VisaService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await VisaService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no visa-direction analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await VisaService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
