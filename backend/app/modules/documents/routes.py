"""Document Checklist HTTP surface.

POST /api/v1/case/{case_id}/documents/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/documents         — latest current row
GET  /api/v1/case/{case_id}/documents/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.documents.schemas import DocumentsInputs
from app.modules.documents.service import DocumentsService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/documents",
    tags=["documents"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: DocumentsInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await DocumentsService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await DocumentsService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no document-checklist analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await DocumentsService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
