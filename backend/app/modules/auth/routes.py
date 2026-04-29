"""Auth HTTP surface."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.deps import CurrentUser, SessionDep
from app.modules.auth.schemas import (
    AuthResponse,
    LoginIn,
    LogoutIn,
    RefreshIn,
    RegisterIn,
    UserOut,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, session: SessionDep) -> AuthResponse:
    return await AuthService(session).register(
        email=body.email, password=body.password, name=body.name
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginIn, session: SessionDep) -> AuthResponse:
    return await AuthService(session).login(email=body.email, password=body.password)


@router.post("/refresh", response_model=AuthResponse)
async def refresh(body: RefreshIn, session: SessionDep) -> AuthResponse:
    return await AuthService(session).refresh(refresh_token=body.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: LogoutIn, session: SessionDep) -> None:
    await AuthService(session).logout(refresh_token=body.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> UserOut:
    return UserOut(id=user.id, email=user.email, name=user.name)
