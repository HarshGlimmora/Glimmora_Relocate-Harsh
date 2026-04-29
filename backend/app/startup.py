"""Boot-time bootstrap.

Runs once when the FastAPI app is imported. Exists so a fresh deploy on Render
(or any platform without shell access) self-configures: applies all alembic
migrations and logs a one-line env summary so misconfigurations surface in the
deploy log instead of as a 500 on first request.
"""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_ALEMBIC_INI = _BACKEND_ROOT / "alembic.ini"


def _summary_line(s: Settings) -> str:
    db = "sqlite" if s.is_sqlite else "postgres"
    has_creds = "yes" if s.gcp_credentials else "no"
    return (
        f"env={s.env} db={db} ai={s.llm_backend} "
        f"gcp_creds={has_creds} project={s.gcp_project or '-'}"
    )


def run_migrations() -> None:
    """Apply all pending alembic migrations against the configured DB."""
    if not _ALEMBIC_INI.exists():
        logger.warning("alembic.ini not found at %s; skipping migrations", _ALEMBIC_INI)
        return
    cfg = Config(str(_ALEMBIC_INI))
    cfg.set_main_option("script_location", str(_BACKEND_ROOT / "alembic"))
    command.upgrade(cfg, "head")
    logger.info("alembic: migrations up to date")


def bootstrap() -> None:
    s = get_settings()
    logger.info("startup: %s", _summary_line(s))
    try:
        run_migrations()
    except Exception:
        logger.exception("startup: alembic upgrade failed")
        raise
