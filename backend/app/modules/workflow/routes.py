"""Workflow & Dependencies HTTP surface.

POST /api/v1/case/{case_id}/workflow/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/workflow         — latest current row
GET  /api/v1/case/{case_id}/workflow/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.workflow.schemas import WorkflowInputs
from app.modules.workflow.service import WorkflowService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/workflow",
    tags=["workflow"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: WorkflowInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await WorkflowService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await WorkflowService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no workflow analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await WorkflowService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
