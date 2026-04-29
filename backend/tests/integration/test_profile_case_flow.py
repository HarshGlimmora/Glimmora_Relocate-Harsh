"""Profile + case integration tests."""

from __future__ import annotations

import pytest


async def _register(client) -> tuple[str, str]:
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "p@example.com", "password": "hunter2-strong", "name": "P"},
    )
    body = r.json()
    return body["tokens"]["access_token"], body["case_id"]


@pytest.mark.asyncio
async def test_get_profile_returns_blank_for_new_user(app_client) -> None:
    client, _ = app_client
    access, _case = await _register(client)
    r = await client.get(
        "/api/v1/profile", headers={"Authorization": f"Bearer {access}"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["profile"]["full_name"] is None
    assert body["completion_percentage"] == 0
    assert "current_country" in body["required_missing"]


@pytest.mark.asyncio
async def test_patch_profile_updates_and_returns_impact(app_client) -> None:
    client, _ = app_client
    access, _case = await _register(client)
    r = await client.patch(
        "/api/v1/profile",
        headers={"Authorization": f"Bearer {access}"},
        json={"current_salary": 80000, "target_country": "de"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["profile"]["current_salary"] == 80000
    assert body["profile"]["target_country"] == "DE"
    assert body["field_sources"]["current_salary"] == "user"
    assert "current_salary" in body["changed_keys"]
    assert "target_country" in body["changed_keys"]
    assert "finance" in body["impacted_modules"]
    assert "country_comparison" in body["impacted_modules"]
    assert body["inputs_revision"] >= 2


@pytest.mark.asyncio
async def test_patch_rejects_unknown_field(app_client) -> None:
    client, _ = app_client
    access, _case = await _register(client)
    r = await client.patch(
        "/api/v1/profile",
        headers={"Authorization": f"Bearer {access}"},
        json={"random_field": 1},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_active_case_is_draft_initially(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    r = await client.get(
        "/api/v1/case/active", headers={"Authorization": f"Bearer {access}"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == case_id
    assert body["state"] == "draft"
    assert body["inputs_revision"] == 1


@pytest.mark.asyncio
async def test_case_transition_validates(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)

    # draft -> profile_ready (allowed)
    r = await client.post(
        f"/api/v1/case/{case_id}/transition",
        headers={"Authorization": f"Bearer {access}"},
        json={"target_state": "profile_ready"},
    )
    assert r.status_code == 200
    assert r.json()["state"] == "profile_ready"

    # profile_ready -> ready (NOT allowed; must go via analyzing)
    r2 = await client.post(
        f"/api/v1/case/{case_id}/transition",
        headers={"Authorization": f"Bearer {access}"},
        json={"target_state": "ready"},
    )
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_case_isolation_other_user_cannot_view(app_client) -> None:
    client, _ = app_client
    access1, case_id1 = await _register(client)

    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "other@example.com", "password": "hunter2-strong", "name": "O"},
    )
    other_access = r.json()["tokens"]["access_token"]

    leak = await client.get(
        f"/api/v1/case/{case_id1}",
        headers={"Authorization": f"Bearer {other_access}"},
    )
    assert leak.status_code == 403
