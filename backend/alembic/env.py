"""Alembic environment.

Loads the app's Settings + Base, runs migrations against the configured DB.
Supports both sync and async URLs by stripping the +async driver suffix for
the sync engine alembic actually uses to apply migrations.
"""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import get_settings
from app.storage.db import Base
from app.storage import models  # noqa: F401  (register models on Base.metadata)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _sync_url(url: str) -> str:
    """Convert async URLs to sync drivers for alembic's engine.

    SQLAlchemy defaults plain `postgresql://` to psycopg2 — which we don't
    install. Force psycopg (v3) explicitly so the build only needs one
    Postgres driver pinned in requirements.txt.
    """
    url = url.replace("+aiosqlite", "")
    url = url.replace("postgresql+asyncpg", "postgresql+psycopg")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


settings = get_settings()
config.set_main_option("sqlalchemy.url", _sync_url(settings.database_url))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
