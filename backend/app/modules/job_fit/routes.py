"""Job Fit HTTP surface.

POST /api/v1/case/{case_id}/job-fit/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/job-fit         — latest current row
GET  /api/v1/case/{case_id}/job-fit/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.job_fit.schemas import JobFitInputs
from app.modules.job_fit.service import JobFitService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/job-fit",
    tags=["job-fit"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: JobFitInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await JobFitService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await JobFitService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no job-fit analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await JobFitService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
