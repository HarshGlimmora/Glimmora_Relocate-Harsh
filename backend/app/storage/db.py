"""Async SQLAlchemy engine and session factory.

Single engine per process. Sessions are dependency-injected via FastAPI.

SQLite concurrency note
-----------------------
Every analysis module follows the same pattern: INSERT a `status=generating`
row, call Gemini (which can take 2–3 minutes for the Pro tier), then UPDATE
to `status=ready`. In SQLite's default rollback-journal mode that INSERT
holds the database-wide write lock until the request handler returns, so a
single in-flight analysis blocks every other writer for the entire LLM call.

We address this in two places:

  1. Here: on every new SQLite connection we set `journal_mode=WAL`
     (readers no longer block writers and vice-versa), a generous
     `busy_timeout` (writers wait instead of immediately raising
     "database is locked"), `synchronous=NORMAL`, and turn foreign keys on.

  2. In `app.storage.analyses.AnalysesRepository.create_generating` we
     commit the row before the LLM call so the write lock is released for
     the duration of the gateway round-trip.

Postgres uses MVCC and is unaffected; the PRAGMA hook short-circuits.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Any, AsyncIterator
from uuid import UUID

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def _json_default(o: Any) -> Any:
    """JSON encoder for types SQLAlchemy's default `json.dumps` rejects.

    Resume parsing yields `datetime.date` for education start/end, and other
    modules surface `Decimal` and `UUID` values inside JSON-typed columns.
    Without this, every write involving such a value throws TypeError mid-
    transaction and poisons the async session.
    """
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return str(o)
    if isinstance(o, UUID):
        return str(o)
    raise TypeError(f"Object of type {type(o).__name__} is not JSON serializable")


def _json_serializer(value: Any) -> str:
    return json.dumps(value, default=_json_default, ensure_ascii=False)


_settings = get_settings()
engine = create_async_engine(
    _settings.async_database_url,
    echo=False,
    future=True,
    pool_pre_ping=not _settings.is_sqlite,
    json_serializer=_json_serializer,
)

# ---- SQLite-only: enable WAL + busy_timeout on every new connection.
# Registering on the engine's underlying sync_engine is the canonical way
# to attach connect-time PRAGMAs to an async engine.
if _settings.is_sqlite:

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, _connection_record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        try:
            # WAL = readers don't block writers, writers don't block readers.
            cursor.execute("PRAGMA journal_mode=WAL")
            # Wait up to 15s for a contended lock instead of raising immediately.
            cursor.execute("PRAGMA busy_timeout=15000")
            # NORMAL is the safe sweet spot under WAL (FULL is sync-fsync
            # paranoid, OFF risks corruption on power loss).
            cursor.execute("PRAGMA synchronous=NORMAL")
            # SQLite ships with FKs off by default — turn them on so our
            # ON DELETE CASCADE constraints are actually enforced.
            cursor.execute("PRAGMA foreign_keys=ON")
        finally:
            cursor.close()


SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency."""
    async with session_scope() as session:
        yield session
