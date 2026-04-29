"""End-to-end alembic apply test.

Runs `alembic upgrade head` against a fresh SQLite file via subprocess, then
inspects the resulting schema. This is the same command Render and DO run
during deploy. The previous metadata-based test exercises the SQLAlchemy
side; this one exercises the actual alembic plumbing — env loading,
revision graph, and DDL emission.

We invoke alembic from the venv binary explicitly so this works regardless
of which python the test harness was launched from.
"""

from __future__ import annotations

import os
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

import pytest


_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _alembic_bin() -> str:
    """Resolve alembic from the same venv as the running interpreter.

    sys.executable points at the venv python; alembic lives next to it on
    Linux, so the binary path is deterministic.
    """
    candidate = Path(sys.executable).parent / "alembic"
    if not candidate.exists():
        # Fall back to whatever's on PATH.
        which = shutil.which("alembic")
        if which is None:
            pytest.skip("alembic not installed in this venv")
        return which
    return str(candidate)


def test_alembic_upgrade_head_applies_clean(tmp_path) -> None:
    db_file = tmp_path / "alembic.db"
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_file}"
    env["JWT_SECRET"] = "x" * 40
    env["AI_PROVIDER"] = "stub"
    env.pop("GCP_SERVICE_ACCOUNT_JSON_B64", None)

    result = subprocess.run(
        [_alembic_bin(), "upgrade", "head"],
        cwd=_BACKEND_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, (
        f"alembic upgrade failed:\nstdout={result.stdout}\nstderr={result.stderr}"
    )

    # Schema sanity
    conn = sqlite3.connect(db_file)
    try:
        names = {
            r[0]
            for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            ).fetchall()
        }
    finally:
        conn.close()

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
    assert not missing, f"alembic upgrade did not create: {missing}"

    # Newer migrations: profile fields exist
    conn = sqlite3.connect(db_file)
    try:
        cols = {
            r[1]
            for r in conn.execute("PRAGMA table_info(user_profiles)").fetchall()
        }
    finally:
        conn.close()

    for col in ("nationality", "current_visa_status", "current_document_status"):
        assert col in cols, f"alembic missed column {col} on user_profiles"
