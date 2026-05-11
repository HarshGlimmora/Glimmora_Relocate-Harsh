"""Finance Category repository.

Each of the five categories (housing, utilities, food, transport,
healthcare) is stored as its own `kind` so the standard
`AnalysesRepository.get_current(kind=...)` lookup just works — no JSON-
field filtering required. The kind string is `finance_cat_<category>`.

This is intentionally not a new `AnalysisKind` enum value: those drive the
workflow / dependency map, and this module is a side-feature ("click a row
to dive in"), not a workflow step.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.analyses import AnalysesRepository
from app.storage.models import Analysis

CATEGORIES = ("housing", "utilities", "food", "transport", "healthcare")


def kind_for(category: str) -> str:
    """Stable kind-column value used for caching + supersedes."""
    if category not in CATEGORIES:
        raise ValueError(f"unknown finance category: {category}")
    return f"finance_cat_{category}"


class FinanceCategoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self._repo = AnalysesRepository(session)

    async def latest(self, case_id: str, category: str) -> Analysis | None:
        return await self._repo.get_current(case_id=case_id, kind=kind_for(category))

    async def history(
        self, case_id: str, category: str, limit: int = 20
    ) -> list[Analysis]:
        return await self._repo.history(
            case_id=case_id, kind=kind_for(category), limit=limit
        )

    async def find_cached(
        self, case_id: str, category: str, input_hash: str
    ) -> Analysis | None:
        cached = await self._repo.find_cached(
            case_id=case_id, kind=kind_for(category), input_hash=input_hash
        )
        if cached and cached.superseded_by is None and not cached.stale:
            return cached
        return None

    async def next_version(self, case_id: str, category: str) -> int:
        return await self._repo.next_version(case_id=case_id, kind=kind_for(category))

    async def create_generating(
        self,
        *,
        case_id: str,
        category: str,
        input_hash: str,
        analysis_version: int,
        inputs_revision_at_gen: int,
        model: str,
        prompt_version: str,
    ) -> Analysis:
        return await self._repo.create_generating(
            case_id=case_id,
            kind=kind_for(category),
            input_hash=input_hash,
            analysis_version=analysis_version,
            inputs_revision_at_gen=inputs_revision_at_gen,
            model=model,
            prompt_version=prompt_version,
        )

    async def mark_ready(self, **kwargs) -> None:
        await self._repo.mark_ready(**kwargs)

    async def mark_failed(self, **kwargs) -> None:
        await self._repo.mark_failed(**kwargs)

    async def supersede(self, *, old_id: str, new_id: str) -> None:
        await self._repo.supersede(old_id=old_id, new_id=new_id)
