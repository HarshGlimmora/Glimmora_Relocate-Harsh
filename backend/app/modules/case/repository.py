"""Case DB queries."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import RelocationCase as CaseORM


class CaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_active(self, user_id: str) -> CaseORM | None:
        res = await self.session.execute(
            select(CaseORM)
            .where(CaseORM.user_id == user_id, CaseORM.active.is_(True))
            .order_by(CaseORM.created_at.desc())
        )
        return res.scalars().first()

    async def get_by_id(self, case_id: str) -> CaseORM | None:
        return await self.session.get(CaseORM, case_id)

    async def create_initial(self, user_id: str) -> CaseORM:
        now = datetime.now(timezone.utc)
        row = CaseORM(
            user_id=user_id,
            state="draft",
            state_changed_at=now,
            inputs_revision=1,
            inputs_snapshot={},
            active=True,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def set_state(self, case_id: str, state: str) -> None:
        await self.session.execute(
            update(CaseORM)
            .where(CaseORM.id == case_id)
            .values(state=state, state_changed_at=datetime.now(timezone.utc))
        )

    async def write_snapshot(
        self, case_id: str, *, snapshot: dict, revision: int | None = None
    ) -> None:
        values: dict = {"inputs_snapshot": snapshot}
        if revision is not None:
            values["inputs_revision"] = revision
        await self.session.execute(update(CaseORM).where(CaseORM.id == case_id).values(**values))

    async def bump_revision(self, case_id: str) -> int:
        row = await self.get_by_id(case_id)
        if row is None:
            raise ValueError(f"case {case_id} not found")
        new = row.inputs_revision + 1
        await self.session.execute(
            update(CaseORM).where(CaseORM.id == case_id).values(inputs_revision=new)
        )
        return new
