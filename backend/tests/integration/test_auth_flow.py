"""Auth + active-case bootstrap integration tests."""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_register_login_refresh_logout(app_client) -> None:
    client, _app = app_client

    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "ada@example.com", "password": "hunter2-strong", "name": "Ada"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["email"] == "ada@example.com"
    assert body["case_id"]
    access = body["tokens"]["access_token"]
    refresh = body["tokens"]["refresh_token"]
    assert access and refresh

    # GET /me with the access token
    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.com"

    # Login from cold
    r2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "ada@example.com", "password": "hunter2-strong"},
    )
    assert r2.status_code == 200

    # Refresh rotates token
    r3 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r3.status_code == 200
    new_refresh = r3.json()["tokens"]["refresh_token"]
    assert new_refresh != refresh

    # Old refresh now revoked
    r4 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r4.status_code == 401

    # Logout
    r5 = await client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh})
    assert r5.status_code == 204

    r6 = await client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert r6.status_code == 401


@pytest.mark.asyncio
async def test_register_duplicate_email_conflict(app_client) -> None:
    client, _ = app_client
    body = {"email": "dup@example.com", "password": "hunter2-strong", "name": "X"}
    r1 = await client.post("/api/v1/auth/register", json=body)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/auth/register", json=body)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password(app_client) -> None:
    client, _ = app_client
    await client.post(
        "/api/v1/auth/register",
        json={"email": "x@example.com", "password": "hunter2-strong", "name": "X"},
    )
    r = await client.post(
        "/api/v1/auth/login", json={"email": "x@example.com", "password": "nope"}
    )
    assert r.status_code == 401
