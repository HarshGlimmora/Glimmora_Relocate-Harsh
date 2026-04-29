"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import Unauthorized
from app.modules.auth import security
from app.storage.db import get_session
from app.storage.models import User


SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def current_user(
    session: SessionDep,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise Unauthorized("Missing bearer token.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = security.decode_access_token(token)
    except jwt.ExpiredSignatureError as e:
        raise Unauthorized("Access token expired.") from e
    except jwt.InvalidTokenError as e:
        raise Unauthorized("Invalid access token.") from e

    user_id = payload.get("sub")
    if not user_id:
        raise Unauthorized("Token missing subject.")
    user = await session.get(User, user_id)
    if not user or user.status != "ACTIVE":
        raise Unauthorized("Account is not active.")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
