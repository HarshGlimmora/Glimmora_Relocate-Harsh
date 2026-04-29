"""Financial Feasibility HTTP surface.

POST /api/v1/case/{case_id}/finance/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/finance         — latest current row
GET  /api/v1/case/{case_id}/finance/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.finance.schemas import FinanceInputs
from app.modules.finance.service import FinanceService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/finance",
    tags=["finance"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: FinanceInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await FinanceService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await FinanceService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no financial-feasibility analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await FinanceService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
