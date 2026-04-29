"""Deployment smoke suite.

A lightweight set of tests that prove the backend is deployable:

  - app boots from environment variables only
  - health endpoint is stable
  - auth route is reachable
  - one analysis route is reachable
  - DB connectivity works (the override fixture exercises this)
  - secrets are not leaked into log strings
  - the public API surface (every router prefix) responds

Designed to be runnable on local, Render, and DigitalOcean — the tests use
the same conftest harness, so a green run here implies the deployable
artifact is healthy.
"""

from __future__ import annotations

import json
import logging

import pytest


# ---- 1) app boot + health ---------------------------------------------------


@pytest.mark.asyncio
async def test_healthz_is_stable(app_client) -> None:
    client, _ = app_client
    r = await client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ---- 2) the full router surface is reachable -------------------------------


_EXPECTED_PREFIXES = [
    "/api/v1/auth",
    "/api/v1/profile",
    "/api/v1/case",
    "/api/v1/resume",
]


@pytest.mark.asyncio
async def test_all_routers_registered(app_client) -> None:
    client, app = app_client
    paths = {route.path for route in app.routes}
    for p in _EXPECTED_PREFIXES:
        assert any(path.startswith(p) for path in paths), f"missing prefix: {p}"

    # Module routers all register `/api/v1/case/{case_id}/<slug>/run`.
    expected_module_slugs = [
        "country-comparison",
        "job-fit",
        "visa",
        "family",
        "finance",
        "documents",
        "workflow",
        "culture",
        "timeline",
        "synthesis",
    ]
    for slug in expected_module_slugs:
        assert any(
            f"/api/v1/case/{{case_id}}/{slug}/run" == path for path in paths
        ), f"module route missing for {slug}"


# ---- 3) auth + analysis route are wired end-to-end ------------------------


@pytest.mark.asyncio
async def test_auth_and_one_analysis_route_smoke(app_client) -> None:
    client, _ = app_client

    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "smoke@x.io", "password": "hunter2-strong", "name": "S"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    access = body["tokens"]["access_token"]
    case_id = body["case_id"]
    H = {"Authorization": f"Bearer {access}"}

    # Minimum profile that satisfies country-comparison's `target_country` requirement.
    pr = await client.patch(
        "/api/v1/profile",
        headers=H,
        json={
            "current_country": "IN",
            "target_country": "DE",
            "target_city": "Berlin",
            "current_role": "Senior Data Engineer",
        },
    )
    assert pr.status_code == 200

    cc = await client.post(
        f"/api/v1/case/{case_id}/country-comparison/run", headers=H, json={}
    )
    assert cc.status_code == 200, cc.text
    body = cc.json()
    assert body["status"] == "ready"


# ---- 4) error contract is consistent --------------------------------------


@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401(app_client) -> None:
    client, _ = app_client
    r = await client.get("/api/v1/profile")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_unknown_case_returns_404(app_client) -> None:
    client, _ = app_client
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "404@x.io", "password": "hunter2-strong", "name": "U"},
    )
    access = r.json()["tokens"]["access_token"]
    r = await client.get(
        "/api/v1/case/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert r.status_code == 404
    err = r.json().get("error") or {}
    assert "code" in err and "message" in err


# ---- 5) secrets not leaked in logs ----------------------------------------


@pytest.mark.asyncio
async def test_logs_do_not_leak_jwt_secret(app_client, caplog) -> None:
    """Capture every log message during a representative flow and assert the
    JWT secret never appears verbatim. This covers handler logs, AI gateway
    telemetry, and uvicorn-style middleware logs we route through stdlib
    logging.
    """
    from app.config import get_settings

    secret = get_settings().jwt_secret
    assert len(secret) >= 32

    client, _ = app_client
    with caplog.at_level(logging.DEBUG):
        r = await client.post(
            "/api/v1/auth/register",
            json={"email": "leak@x.io", "password": "hunter2-strong", "name": "L"},
        )
        assert r.status_code == 201

    blob = "\n".join(rec.getMessage() for rec in caplog.records)
    assert secret not in blob, "JWT_SECRET appeared in log output"
    # Service-account private key — if the service ever logged the decoded
    # creds we'd see PEM headers.
    assert "BEGIN PRIVATE KEY" not in blob
