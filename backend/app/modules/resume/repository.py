"""Resume parse DB queries."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import ResumeParse


class ResumeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        user_id: str,
        storage_uri: str,
        mime_type: str,
        file_size: int,
        original_filename: str | None,
    ) -> ResumeParse:
        row = ResumeParse(
            user_id=user_id,
            storage_uri=storage_uri,
            mime_type=mime_type,
            file_size=file_size,
            original_filename=original_filename,
            status="parsing",
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def get(self, parse_id: str) -> ResumeParse | None:
        return await self.session.get(ResumeParse, parse_id)

    async def latest_for_user(self, user_id: str) -> ResumeParse | None:
        res = await self.session.execute(
            select(ResumeParse)
            .where(ResumeParse.user_id == user_id)
            .order_by(ResumeParse.created_at.desc())
        )
        return res.scalars().first()

    async def mark_ready(
        self, parse_id: str, *, raw_text: str, extracted: dict[str, Any]
    ) -> None:
        await self.session.execute(
            update(ResumeParse)
            .where(ResumeParse.id == parse_id)
            .values(status="ready", raw_text=raw_text, extracted_json=extracted, error=None)
        )

    async def mark_failed(self, parse_id: str, *, error: str) -> None:
        await self.session.execute(
            update(ResumeParse)
            .where(ResumeParse.id == parse_id)
            .values(status="failed", error=error)
        )
