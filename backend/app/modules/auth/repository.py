"""DB queries for the auth module."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.storage.models import RefreshToken, User


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --- users ---

    async def get_user_by_email(self, email: str) -> User | None:
        res = await self.session.execute(select(User).where(User.email == email.lower()))
        return res.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> User | None:
        return await self.session.get(User, user_id)

    async def create_user(self, *, email: str, password_hash: str, name: str) -> User:
        user = User(email=email.lower(), password_hash=password_hash, name=name)
        self.session.add(user)
        await self.session.flush()
        return user

    async def update_password_hash(self, user_id: str, password_hash: str) -> None:
        await self.session.execute(
            update(User).where(User.id == user_id).values(password_hash=password_hash)
        )

    # --- refresh tokens ---

    async def store_refresh(
        self, *, user_id: str, token_hash: str, expires_at: datetime
    ) -> RefreshToken:
        rt = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.session.add(rt)
        await self.session.flush()
        return rt

    async def find_refresh(self, token_hash: str) -> RefreshToken | None:
        res = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return res.scalar_one_or_none()

    async def revoke_refresh(self, token_id: str, *, rotated_to: str | None = None) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(revoked_at=datetime.now(timezone.utc), rotated_to=rotated_to)
        )

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
