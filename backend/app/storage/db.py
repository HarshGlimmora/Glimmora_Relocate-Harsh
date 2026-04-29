"""Async SQLAlchemy engine and session factory.

Single engine per process. Sessions are dependency-injected via FastAPI.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Any, AsyncIterator
from uuid import UUID

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
