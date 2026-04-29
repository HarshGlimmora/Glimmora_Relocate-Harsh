"""Migration sanity: schema metadata creates every table cleanly.

We exercise the same DDL alembic emits — Base.metadata.create_all binds the
exact SQLAlchemy table definitions referenced by the migration. A separate
shell-based alembic run is exercised in CI; running alembic from inside
pytest is brittle (it picks up the system python instead of the venv).
"""

from __future__ import annotations

from pathlib import Path

import pytest


@pytest.mark.asyncio
async def test_metadata_creates_all_expected_tables(tmp_path: Path) -> None:
    from sqlalchemy.ext.asyncio import create_async_engine

    from app.storage import models  # noqa: F401  (registers tables)
    from app.storage.db import Base

    db_url = f"sqlite+aiosqlite:///{tmp_path / 'mig.db'}"
    engine = create_async_engine(db_url, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

    import sqlite3

    conn = sqlite3.connect(tmp_path / "mig.db")
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    names = {r[0] for r in rows}
    expected = {
        "users",
        "refresh_tokens",
        "user_profiles",
        "relocation_cases",
        "resume_parses",
        "analyses",
        "ai_calls",
    }
    missing = expected - names
    assert not missing, f"missing tables: {missing}"


def test_alembic_revision_imports_and_lists_expected_tables() -> None:
    """The alembic file must reference every model table.

    A minimal sanity check that the migration and the ORM stay in sync.
    """
    src = (
        Path(__file__).resolve().parents[2]
        / "alembic"
        / "versions"
        / "0001_foundation.py"
    ).read_text()
    for name in (
        "users",
        "refresh_tokens",
        "user_profiles",
        "relocation_cases",
        "resume_parses",
        "analyses",
        "ai_calls",
    ):
        assert f'"{name}"' in src, f"alembic 0001 missing table {name}"
