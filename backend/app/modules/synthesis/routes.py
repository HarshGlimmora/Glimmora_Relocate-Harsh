"""Final Synthesis HTTP surface.

POST /api/v1/case/{case_id}/synthesis/run        — generate (or cache hit)
POST /api/v1/case/{case_id}/synthesis/run/stream — SSE progress stream
GET  /api/v1/case/{case_id}/synthesis            — latest current row
GET  /api/v1/case/{case_id}/synthesis/history    — full version history
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.synthesis.schemas import SynthesisInputs
from app.modules.synthesis.service import SynthesisService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/synthesis",
    tags=["synthesis"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: SynthesisInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await SynthesisService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.post("/run/stream")
async def run_stream(
    case_id: str,
    body: SynthesisInputs,
    user: CurrentUser,
    session: SessionDep,
) -> StreamingResponse:
    """SSE stream: progress events while the synthesis is generated.

    Events:
      - progress: {stage, pct}
      - result: full response object (same shape as POST /run)
      - error: {code, message}
    """
    service = SynthesisService(session)
    gen = service.run_sse(user_id=user.id, case_id=case_id, body=body)
    return StreamingResponse(gen, media_type="text/event-stream")


@router.get("")
async def latest(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    out = await SynthesisService(session).latest(user_id=user.id, case_id=case_id)
    if out is None:
        raise NotFound("no synthesis analysis yet for this case")
    return out


@router.get("/history")
async def history(case_id: str, user: CurrentUser, session: SessionDep) -> dict:
    items = await SynthesisService(session).history(user_id=user.id, case_id=case_id)
    return {"items": items, "count": len(items)}
