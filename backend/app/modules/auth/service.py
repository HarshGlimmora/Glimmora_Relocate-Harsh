"""Auth business logic.

On register: creates user, empty profile, an active relocation case (state=draft).
On login/refresh: rotates refresh tokens (one-shot use), reissues access token.
On logout: revokes the supplied refresh token (no-op if missing).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import Conflict, Unauthorized
from app.modules.auth import security
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import AuthResponse, TokenPair, UserOut
from app.modules.case.repository import CaseRepository
from app.modules.case.service import CaseService
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = AuthRepository(session)
        self.profiles = ProfileService(ProfileRepository(session))
        self.cases = CaseService(CaseRepository(session))

    # --- register ---

    async def register(self, *, email: str, password: str, name: str) -> AuthResponse:
        existing = await self.repo.get_user_by_email(email)
        if existing is not None:
            raise Conflict("An account with that email already exists.")

        user = await self.repo.create_user(
            email=email,
            password_hash=security.hash_password(password),
            name=name,
        )
        await self.profiles.ensure_empty_profile(user.id)
        case = await self.cases.create_initial_case(user.id)

        tokens = await self._issue_token_pair(user_id=user.id, email=user.email)
        return AuthResponse(
            user=UserOut(id=user.id, email=user.email, name=user.name),
            case_id=case.id,
            tokens=tokens,
        )

    # --- login ---

    async def login(self, *, email: str, password: str) -> AuthResponse:
        user = await self.repo.get_user_by_email(email)
        if not user or not security.verify_password(password, user.password_hash):
            raise Unauthorized("Invalid email or password.")
        if user.status != "ACTIVE":
            raise Unauthorized("Account is not active.")

        if security.needs_rehash(user.password_hash):
            await self.repo.update_password_hash(user.id, security.hash_password(password))

        case = await self.cases.get_or_create_active_case(user.id)
        tokens = await self._issue_token_pair(user_id=user.id, email=user.email)
        return AuthResponse(
            user=UserOut(id=user.id, email=user.email, name=user.name),
            case_id=case.id,
            tokens=tokens,
        )

    # --- refresh ---

    async def refresh(self, *, refresh_token: str) -> AuthResponse:
        digest = security.hash_refresh(refresh_token)
        record = await self.repo.find_refresh(digest)
        now = datetime.now(timezone.utc)

        if not record or record.revoked_at is not None or _aware(record.expires_at) <= now:
            raise Unauthorized("Refresh token is invalid or expired.")

        user = await self.repo.get_user_by_id(record.user_id)
        if not user or user.status != "ACTIVE":
            raise Unauthorized("Account is not active.")

        # One-shot use: revoke this token and issue a fresh pair pointing back.
        new_raw, new_digest, new_exp = security.new_refresh_token()
        new_record = await self.repo.store_refresh(
            user_id=user.id, token_hash=new_digest, expires_at=new_exp
        )
        await self.repo.revoke_refresh(record.id, rotated_to=new_record.id)

        access, access_exp = security.issue_access_token(user_id=user.id, email=user.email)
        case = await self.cases.get_or_create_active_case(user.id)
        return AuthResponse(
            user=UserOut(id=user.id, email=user.email, name=user.name),
            case_id=case.id,
            tokens=TokenPair(
                access_token=access,
                access_expires_at=access_exp,
                refresh_token=new_raw,
                refresh_expires_at=new_exp,
            ),
        )

    # --- logout ---

    async def logout(self, *, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        digest = security.hash_refresh(refresh_token)
        record = await self.repo.find_refresh(digest)
        if record and record.revoked_at is None:
            await self.repo.revoke_refresh(record.id)

    # --- helpers ---

    async def _issue_token_pair(self, *, user_id: str, email: str) -> TokenPair:
        access, access_exp = security.issue_access_token(user_id=user_id, email=email)
        raw, digest, exp = security.new_refresh_token()
        await self.repo.store_refresh(user_id=user_id, token_hash=digest, expires_at=exp)
        return TokenPair(
            access_token=access,
            access_expires_at=access_exp,
            refresh_token=raw,
            refresh_expires_at=exp,
        )


def _aware(dt: datetime) -> datetime:
    """SQLite drops tzinfo; coerce to UTC-aware for comparison."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
