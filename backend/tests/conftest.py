"""Pytest config: per-test SQLite engine, dependency-overridden FastAPI app."""

from __future__ import annotations

import os
from pathlib import Path
from typing import AsyncIterator

import pytest
import pytest_asyncio


# --- env: must be set BEFORE any app import so settings pick them up ---
os.environ.setdefault("ENV", "test")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("JWT_SECRET", "test-secret-32-characters-min-padding-1234567890")
os.environ.setdefault("AI_PROVIDER", "stub")
os.environ.setdefault("RESUME_STORAGE_BACKEND", "local")
os.environ.setdefault("GEMINI_MODEL", "gemini-2.5-flash")
os.environ.setdefault("GEMINI_MODEL_PRO", "gemini-2.5-pro")


@pytest.fixture
def tmp_db_url(tmp_path: Path) -> str:
    return f"sqlite+aiosqlite:///{tmp_path / 'test.db'}"


@pytest.fixture
def tmp_storage_dir(tmp_path: Path) -> str:
    d = tmp_path / "storage"
    d.mkdir()
    os.environ["RESUME_STORAGE_LOCAL_DIR"] = str(d)
    return str(d)


@pytest_asyncio.fixture
async def app_client(tmp_db_url: str, tmp_storage_dir: str) -> AsyncIterator:
    """Yields (httpx.AsyncClient, fastapi_app) wired to a fresh DB + stub AI."""
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.ai.gateway import reset_ai_gateway
    from app.main import create_app
    from app.storage import models  # noqa: F401  (registers tables)
    from app.storage.db import Base, get_session

    reset_ai_gateway()

    engine = create_async_engine(tmp_db_url, future=True)
    SessionMaker = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override_session():
        async with SessionMaker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app = create_app()
    app.dependency_overrides[get_session] = _override_session

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, app

    app.dependency_overrides.clear()
    await engine.dispose()
