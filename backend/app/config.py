"""Runtime configuration.

Single source of truth for env. Render and DigitalOcean both inject these as
platform env vars; locally we read them from .env. Required values fail fast
when missing — never silently default a credential or model id.
"""

from __future__ import annotations

import base64
import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- runtime ---
    env: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"
    app_port: int = 8000

    # --- database ---
    # SQLite locally; Postgres URL on Render/DO. We accept both `sqlite:///` and
    # `sqlite+aiosqlite:///` — the resolver below normalises to the async driver.
    database_url: str = "sqlite:///glimmora.db"

    # --- auth ---
    jwt_secret: str = Field(min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # --- file storage ---
    resume_storage_backend: Literal["local", "gcs"] = "local"
    resume_storage_local_dir: str = "./.local-storage/resumes"
    resume_storage_gcs_bucket: str = "glimmora-resumes-dev"
    resume_max_bytes: int = 10 * 1024 * 1024

    # --- AI provider selection ---
    # auto = pick vertex if a service-account blob is present, else stub.
    ai_provider: Literal["auto", "stub", "vertex"] = "auto"

    # --- Vertex / Gemini ---
    gcp_service_account_json_b64: str | None = None
    gcp_project: str | None = None
    gcp_location: str = "us-central1"
    gemini_model: str = "gemini-2.5-flash"
    gemini_model_pro: str | None = None  # optional override for reasoning tier

    # --- LLM retry budget ---
    llm_max_retries: int = 1
    llm_initial_backoff: float = 1.0
    # 120s default: Gemini 2.5 Flash routinely takes 25–30s per call on
    # structured-JSON resume work, and the gateway issues one validation-retry
    # on top of the initial call. 60s was killing requests that would have
    # succeeded a couple seconds later.
    llm_request_timeout_s: float = 120.0

    # --- effective state populated by validators ---
    llm_backend: Literal["stub", "vertex"] = "stub"
    gcp_credentials: dict | None = None  # decoded service-account JSON

    # ---- validators ----

    @model_validator(mode="after")
    def _normalize(self) -> "Settings":
        # Decode the service-account blob once and derive project_id + backend.
        if self.gcp_service_account_json_b64:
            try:
                decoded = json.loads(
                    base64.b64decode(self.gcp_service_account_json_b64).decode("utf-8")
                )
            except Exception as e:  # noqa: BLE001
                raise ValueError(
                    f"GCP_SERVICE_ACCOUNT_JSON_B64 is set but not valid base64-JSON: {e}"
                ) from e
            if not isinstance(decoded, dict) or decoded.get("type") != "service_account":
                raise ValueError(
                    "GCP_SERVICE_ACCOUNT_JSON_B64 must decode to a service_account JSON object."
                )
            object.__setattr__(self, "gcp_credentials", decoded)
            object.__setattr__(
                self, "gcp_project", self.gcp_project or decoded.get("project_id")
            )

        # Resolve the AI backend.
        if self.ai_provider == "auto":
            object.__setattr__(
                self, "llm_backend", "vertex" if self.gcp_credentials else "stub"
            )
        else:
            object.__setattr__(self, "llm_backend", self.ai_provider)

        if self.llm_backend == "vertex" and not self.gcp_credentials:
            raise ValueError(
                "AI_PROVIDER=vertex requires GCP_SERVICE_ACCOUNT_JSON_B64 to be set."
            )
        return self

    # ---- derived helpers ----

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def async_database_url(self) -> str:
        """Translate user-supplied URL to the async driver our engine uses."""
        url = self.database_url
        if url.startswith("sqlite+aiosqlite://"):
            return url
        if url.startswith("sqlite:///") or url.startswith("sqlite://"):
            return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        if url.startswith("postgresql+asyncpg://") or url.startswith("postgres+asyncpg://"):
            return url
        if url.startswith("postgresql://") or url.startswith("postgres://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1).replace(
                "postgres://", "postgresql+asyncpg://", 1
            )
        return url

    @property
    def reasoning_model(self) -> str:
        """Pro tier — falls back to the default model if none set."""
        return self.gemini_model_pro or self.gemini_model

    def ensure_local_dirs(self) -> None:
        if self.resume_storage_backend == "local":
            Path(self.resume_storage_local_dir).mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
