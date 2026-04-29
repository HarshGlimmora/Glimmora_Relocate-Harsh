"""Fail-fast environment & deployment-readiness tests.

Boot the Settings object under various env conditions and assert the
backend either accepts the config cleanly or fails with an actionable
error. This is the contract the deployment platforms (Render, DO, local)
depend on: required values must fail fast; optional values must default
sanely; production-like config must validate.
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from unittest.mock import patch

import pytest


def _clear_env_keys(*keys: str) -> dict[str, str | None]:
    saved: dict[str, str | None] = {}
    for k in keys:
        saved[k] = os.environ.pop(k, None)
    return saved


def _restore_env(saved: dict[str, str | None]) -> None:
    for k, v in saved.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v


def _fresh_settings(env: dict[str, str], cwd: Path) -> "Settings":
    """Construct a Settings object using the supplied env dict only.

    We change cwd so the .env at repo root isn't picked up implicitly
    (avoids cross-contamination from the dev .env file).
    """
    from app.config import Settings

    old_cwd = os.getcwd()
    saved = _clear_env_keys(
        "ENV",
        "DEBUG",
        "DATABASE_URL",
        "JWT_SECRET",
        "ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "REFRESH_TOKEN_EXPIRE_DAYS",
        "AI_PROVIDER",
        "GCP_SERVICE_ACCOUNT_JSON_B64",
        "GCP_LOCATION",
        "GCP_PROJECT",
        "GEMINI_MODEL",
        "GEMINI_MODEL_PRO",
        "LLM_MAX_RETRIES",
        "LLM_INITIAL_BACKOFF",
        "LLM_REQUEST_TIMEOUT_S",
        "RESUME_STORAGE_BACKEND",
        "RESUME_STORAGE_LOCAL_DIR",
        "RESUME_STORAGE_GCS_BUCKET",
        "RESUME_MAX_BYTES",
        "LOG_LEVEL",
        "APP_PORT",
    )
    try:
        os.chdir(cwd)
        for k, v in env.items():
            os.environ[k] = v
        return Settings()  # type: ignore[call-arg]
    finally:
        os.chdir(old_cwd)
        _restore_env(saved)


# ---- required: jwt_secret must exist ---------------------------------------


def test_missing_jwt_secret_fails_fast(tmp_path) -> None:
    with pytest.raises(Exception) as ei:
        _fresh_settings({}, tmp_path)
    msg = str(ei.value).lower()
    assert "jwt_secret" in msg or "jwt secret" in msg


def test_short_jwt_secret_rejected(tmp_path) -> None:
    with pytest.raises(Exception):
        _fresh_settings({"JWT_SECRET": "tooshort"}, tmp_path)


# ---- minimal valid config boots --------------------------------------------


def test_minimal_dev_config_boots(tmp_path) -> None:
    s = _fresh_settings(
        {
            "JWT_SECRET": "x" * 40,
            "ENV": "development",
            "DATABASE_URL": "sqlite:///dev.db",
        },
        tmp_path,
    )
    assert s.env == "development"
    assert s.llm_backend == "stub"  # no GCP creds → stub


# ---- vertex requires creds when explicitly requested -----------------------


def test_vertex_without_creds_fails_fast(tmp_path) -> None:
    with pytest.raises(Exception) as ei:
        _fresh_settings(
            {
                "JWT_SECRET": "x" * 40,
                "AI_PROVIDER": "vertex",
            },
            tmp_path,
        )
    assert "vertex" in str(ei.value).lower()


# ---- bad b64 / non-service-account JSON rejected ---------------------------


def test_invalid_b64_rejected(tmp_path) -> None:
    with pytest.raises(Exception) as ei:
        _fresh_settings(
            {
                "JWT_SECRET": "x" * 40,
                "GCP_SERVICE_ACCOUNT_JSON_B64": "not-base-64!!!!",
            },
            tmp_path,
        )
    assert "GCP_SERVICE_ACCOUNT_JSON_B64" in str(ei.value)


def test_non_service_account_json_rejected(tmp_path) -> None:
    bogus = base64.b64encode(json.dumps({"type": "user", "project_id": "p"}).encode()).decode()
    with pytest.raises(Exception) as ei:
        _fresh_settings(
            {
                "JWT_SECRET": "x" * 40,
                "GCP_SERVICE_ACCOUNT_JSON_B64": bogus,
            },
            tmp_path,
        )
    assert "service_account" in str(ei.value)


# ---- valid creds resolve project_id automatically --------------------------


def test_valid_b64_derives_project_id(tmp_path) -> None:
    blob = {
        "type": "service_account",
        "project_id": "test-proj-123",
        "private_key": "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----",
        "client_email": "x@x.iam.gserviceaccount.com",
    }
    b64 = base64.b64encode(json.dumps(blob).encode()).decode()
    s = _fresh_settings(
        {
            "JWT_SECRET": "x" * 40,
            "GCP_SERVICE_ACCOUNT_JSON_B64": b64,
        },
        tmp_path,
    )
    assert s.gcp_project == "test-proj-123"
    assert s.llm_backend == "vertex"
    assert s.gcp_credentials["client_email"] == "x@x.iam.gserviceaccount.com"


# ---- DATABASE_URL drivers are normalised correctly -------------------------


@pytest.mark.parametrize(
    "url,expected_prefix",
    [
        ("sqlite:///x.db", "sqlite+aiosqlite:///"),
        ("sqlite+aiosqlite:///x.db", "sqlite+aiosqlite:///"),
        ("postgresql://u:p@h:5432/d", "postgresql+asyncpg://"),
        ("postgresql+asyncpg://u:p@h:5432/d", "postgresql+asyncpg://"),
        ("postgres://u:p@h:5432/d", "postgresql+asyncpg://"),
    ],
)
def test_database_url_async_driver_normalisation(tmp_path, url, expected_prefix) -> None:
    s = _fresh_settings({"JWT_SECRET": "x" * 40, "DATABASE_URL": url}, tmp_path)
    assert s.async_database_url.startswith(expected_prefix)


# ---- production-style config (Render/DO) parses ---------------------------


def test_production_style_config_boots(tmp_path) -> None:
    blob = {
        "type": "service_account",
        "project_id": "prod-proj",
        "private_key": "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----",
        "client_email": "x@prod.iam.gserviceaccount.com",
    }
    b64 = base64.b64encode(json.dumps(blob).encode()).decode()
    s = _fresh_settings(
        {
            "JWT_SECRET": "x" * 40,
            "ENV": "production",
            "DEBUG": "false",
            "DATABASE_URL": "postgresql://u:p@h:5432/d",
            "AI_PROVIDER": "auto",
            "GCP_SERVICE_ACCOUNT_JSON_B64": b64,
            "GCP_LOCATION": "us-central1",
            "GEMINI_MODEL": "gemini-2.5-flash",
            "GEMINI_MODEL_PRO": "gemini-2.5-pro",
            "LLM_MAX_RETRIES": "1",
            "LLM_INITIAL_BACKOFF": "1.0",
        },
        tmp_path,
    )
    assert s.env == "production"
    assert s.debug is False
    assert s.llm_backend == "vertex"
    assert s.async_database_url.startswith("postgresql+asyncpg://")
    assert s.gemini_model == "gemini-2.5-flash"
    assert s.reasoning_model == "gemini-2.5-pro"
    assert s.llm_max_retries == 1


# ---- reasoning_model falls back to gemini_model when unset ---------------


def test_reasoning_model_falls_back_to_default(tmp_path) -> None:
    s = _fresh_settings(
        {
            "JWT_SECRET": "x" * 40,
            "GEMINI_MODEL": "gemini-2.5-flash",
            # no GEMINI_MODEL_PRO
        },
        tmp_path,
    )
    assert s.reasoning_model == "gemini-2.5-flash"


# ---- log level / app port respected --------------------------------------


def test_log_level_and_port_overridable(tmp_path) -> None:
    s = _fresh_settings(
        {
            "JWT_SECRET": "x" * 40,
            "LOG_LEVEL": "WARNING",
            "APP_PORT": "9090",
        },
        tmp_path,
    )
    assert s.log_level == "WARNING"
    assert s.app_port == 9090
