"""Profile DB queries — thin layer over the ORM."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import UserProfile as UserProfileORM


class ProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, user_id: str) -> UserProfileORM | None:
        res = await self.session.execute(
            select(UserProfileORM).where(UserProfileORM.user_id == user_id)
        )
        return res.scalar_one_or_none()

    async def upsert_blank(self, user_id: str) -> UserProfileORM:
        existing = await self.get(user_id)
        if existing is not None:
            return existing
        row = UserProfileORM(
            user_id=user_id,
            skills=[],
            education=[],
            companies=[],
            priority_ranking=[],
            field_sources={},
            completion_percentage=0,
        )
        self.session.add(row)
        await self.session.flush()
        return row
