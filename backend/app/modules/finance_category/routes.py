"""Finance Category HTTP surface.

POST /api/v1/case/{case_id}/finance/category/{category}/run — generate
GET  /api/v1/case/{case_id}/finance/category/{category}      — latest row

`category` ∈ { housing | utilities | food | transport | healthcare }.
Each category gets its own (kind, input_hash) row so cache + freshness
work per-category without cross-talk.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, SessionDep
from app.middleware.error_handler import NotFound
from app.modules.finance_category.schemas import FinanceCategoryInputs
from app.modules.finance_category.service import FinanceCategoryService

router = APIRouter(
    prefix="/api/v1/case/{case_id}/finance/category",
    tags=["finance-category"],
)


@router.post("/{category}/run")
async def run(
    case_id: str,
    category: str,
    body: FinanceCategoryInputs,
    user: CurrentUser,
    session: SessionDep,
) -> dict:
    return await FinanceCategoryService(session).run(
        user_id=user.id, case_id=case_id, category=category, body=body
    )


@router.get("/{category}")
async def latest(
    case_id: str, category: str, user: CurrentUser, session: SessionDep
) -> dict:
    out = await FinanceCategoryService(session).latest(
        user_id=user.id, case_id=case_id, category=category
    )
    if out is None:
        raise NotFound(f"no {category} deep-dive yet for this case")
    return out
