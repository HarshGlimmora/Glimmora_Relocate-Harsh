"""Country-comparison repository — composes the shared analyses repo."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.envelope import AnalysisKind
from app.storage.analyses import AnalysesRepository
from app.storage.models import Analysis

KIND = AnalysisKind.COUNTRY_COMPARISON.value


class CountryComparisonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self._repo = AnalysesRepository(session)

    async def latest(self, case_id: str) -> Analysis | None:
        return await self._repo.get_current(case_id=case_id, kind=KIND)

    async def history(self, case_id: str, limit: int = 20) -> list[Analysis]:
        return await self._repo.history(case_id=case_id, kind=KIND, limit=limit)

    async def find_cached(self, case_id: str, input_hash: str) -> Analysis | None:
        cached = await self._repo.find_cached(
            case_id=case_id, kind=KIND, input_hash=input_hash
        )
        if cached and cached.superseded_by is None and not cached.stale:
            return cached
        return None

    async def next_version(self, case_id: str) -> int:
        return await self._repo.next_version(case_id=case_id, kind=KIND)

    async def create_generating(
        self,
        *,
        case_id: str,
        input_hash: str,
        analysis_version: int,
        inputs_revision_at_gen: int,
        model: str,
        prompt_version: str,
    ) -> Analysis:
        return await self._repo.create_generating(
            case_id=case_id,
            kind=KIND,
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

    async def mark_stale(self, case_id: str, reason: str) -> int:
        return await self._repo.mark_stale(
            case_id=case_id, kinds=[KIND], reason=reason
        )
