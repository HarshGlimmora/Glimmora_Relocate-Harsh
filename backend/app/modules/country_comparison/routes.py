"""Country Comparison HTTP surface.

POST /api/v1/case/{case_id}/country-comparison/run     — generate (or cache hit)
GET  /api/v1/case/{case_id}/country-comparison         — latest current row
GET  /api/v1/case/{case_id}/country-comparison/history — full version history
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.country_comparison.schemas import CountryComparisonInputs
from app.modules.country_comparison.service import CountryComparisonService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/country-comparison",
    tags=["country-comparison"],
)


@router.post("/run")
async def run(
    case_id: str,
    body: CountryComparisonInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await CountryComparisonService(session).run(
        user_id=user.id, case_id=case_id, body=body
    )


@router.get("")
async def latest(
    case_id: str, user: CurrentUser, session: SessionDep
) -> dict:
    out = await CountryComparisonService(session).latest(
        user_id=user.id, case_id=case_id
    )
    if out is None:
        raise NotFound("no country-comparison analysis yet for this case")
    return out


@router.get("/history")
async def history(
    case_id: str, user: CurrentUser, session: SessionDep
) -> dict:
    items = await CountryComparisonService(session).history(
        user_id=user.id, case_id=case_id
    )
    return {"items": items, "count": len(items)}
