"""Country Comparison HTTP surface.

POST /api/v1/case/{case_id}/country-comparison/run        — single-country deep dive (Vertex)
GET  /api/v1/case/{case_id}/country-comparison            — latest current row
GET  /api/v1/case/{case_id}/country-comparison/history    — full version history

POST /api/v1/case/{case_id}/country-comparison/shortlist  — multi-country decision board
                                                            (deterministic, no Vertex)
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.country_comparison.schemas import CountryComparisonInputs
from app.modules.country_comparison.service import CountryComparisonService
from app.modules.country_comparison.shortlist_schemas import (
    ShortlistRequest,
    ShortlistResponse,
)
from app.modules.country_comparison.shortlist_service import compute_shortlist
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService

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


@router.post("/shortlist", response_model=ShortlistResponse)
async def shortlist(
    case_id: str,
    body: ShortlistRequest,
    user: CurrentUser,
    session: SessionDep,
) -> ShortlistResponse:
    """Run the deterministic country shortlist scoring engine.

    Reads the user's `current_country` to power the origin → destination
    transition deltas. The user_id + case_id pair is required for
    permission checks but the engine itself is stateless — this endpoint
    can be hit on every weight slider change without paying for Vertex.
    """
    # case_id is captured for permission scoping (the auth middleware
    # already enforces user.id matches the case owner upstream); we just
    # need the profile to derive `origin_country_code`.
    _ = case_id  # kept as path param so the URL stays consistent
    profile_service = ProfileService(ProfileRepository(session))
    profile = await profile_service.get_profile(user.id)
    return compute_shortlist(
        body, origin_country_code=profile.current_country
    )
