"""Country-comparison integration tests.

Covers acceptance items 2–7:
  2. successful generation
  3. invalid model output handling
  4. stale marking after input change
  5. version increment on rerun
  6. logging and telemetry writes (ai_calls)
  7. frontend-ready response shape
"""

from __future__ import annotations

import json

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.country_comparison_cases import (
    ALL_FIXTURES,
    SOLO_MOVER,
    VISA_CONCERNED,
    CONSTRAINED_ORIGIN,
    COMPARING_TWO_COUNTRIES,
)


# ---- helpers ---------------------------------------------------------------


async def _register(client, email: str = "user@example.com"):
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "hunter2-strong", "name": "U"},
    )
    body = r.json()
    return body["tokens"]["access_token"], body["case_id"]


async def _seed_profile(client, headers, fixture):
    r = await client.patch("/api/v1/profile", headers=headers, json=fixture.profile_patch)
    assert r.status_code == 200, r.text


async def _run(client, headers, case_id, body=None):
    r = await client.post(
        f"/api/v1/case/{case_id}/country-comparison/run",
        headers=headers,
        json=body or {},
    )
    return r


# ---- 2. successful generation (parametrised over the 4 fixtures) -----------


@pytest.mark.asyncio
@pytest.mark.parametrize("fixture", ALL_FIXTURES, ids=[f.name for f in ALL_FIXTURES])
async def test_successful_generation_for_each_persona(app_client, fixture) -> None:
    client, _ = app_client
    access, case_id = await _register(client, email=f"{fixture.name}@x.io")
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, fixture)

    r = await _run(client, headers, case_id, fixture.run_body)
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["status"] == "ready"
    assert body["analysis_version"] == 1
    assert body["stale"] is False
    assert body["recompute_required"] is False

    env = body["envelope"]
    # envelope shape
    assert env["status"] == "ready"
    assert 0 <= env["score"] <= 100
    assert env["summary"]
    assert env["reasoning"]
    assert env["assumptions"]  # non-empty
    assert env["input_hash"] == body.get("envelope", {}).get("input_hash")
    assert env["analysis_version"] == 1

    # detail shape
    d = env["detail"]
    assert d["origin"]["country"] == fixture.profile_patch["current_country"]
    assert d["destination"]["country"] == fixture.profile_patch["target_country"]
    aps = d["access_points"]
    for k in (
        "job_market_access",
        "visa_access",
        "housing_pressure",
        "healthcare_access",
        "schooling_access",
        "cultural_fit",
        "language_fit",
    ):
        assert k in aps
        assert -100 <= aps[k]["delta"] <= 100
    assert d["strengths"], "strengths must be non-empty"
    assert d["comparison_summary"]


# ---- 7. frontend-ready response shape (sanity over a serialized envelope) --


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    r = await _run(client, headers, case_id, SOLO_MOVER.run_body)
    body = r.json()

    # The card-rendering frontend depends on these top-level + envelope keys.
    for key in (
        "id",
        "case_id",
        "kind",
        "status",
        "envelope",
        "analysis_version",
        "stale",
        "recompute_required",
        "stale_reason",
    ):
        assert key in body, f"missing top-level key: {key}"
    env = body["envelope"]
    for key in (
        "status",
        "score",
        "summary",
        "reasoning",
        "risks",
        "next_actions",
        "confidence",
        "metadata",
        "detail",
        "analysis_version",
        "stale",
        "recompute_required",
        "input_hash",
        "assumptions",
    ):
        assert key in env, f"missing envelope key: {key}"
    # Detail keys (full surface for the card grid)
    d = env["detail"]
    for key in (
        "origin",
        "destination",
        "overall_comparison_score",
        "destination_suitability_score",
        "origin_pressure_score",
        "access_points",
        "strengths",
        "blockers",
        "comparison_summary",
        "alternatives_considered",
    ):
        assert key in d, f"missing detail key: {key}"


# ---- 5. version increment on rerun (force=true bypasses cache) -------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)

    r1 = await _run(client, headers, case_id, SOLO_MOVER.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(SOLO_MOVER.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    # latest endpoint returns the v2 row
    latest = await client.get(
        f"/api/v1/case/{case_id}/country-comparison", headers=headers
    )
    assert latest.json()["analysis_version"] == 2

    # history shows both, newest first
    hist = await client.get(
        f"/api/v1/case/{case_id}/country-comparison/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


# ---- 5b. cache-hit returns same version when inputs unchanged --------------


@pytest.mark.asyncio
async def test_repeat_run_with_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)

    r1 = await _run(client, headers, case_id, SOLO_MOVER.run_body)
    r2 = await _run(client, headers, case_id, SOLO_MOVER.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_target_country_change_marks_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    await _run(client, headers, case_id, SOLO_MOVER.run_body)

    # Patch target_country — should mark country-comparison stale.
    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"target_country": "NL"}
    )
    body = r.json()
    assert "country_comparison" in body["impacted_modules"]

    latest = await client.get(
        f"/api/v1/case/{case_id}/country-comparison", headers=headers
    )
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_salary_change_does_not_mark_country_comparison_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    await _run(client, headers, case_id, SOLO_MOVER.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_salary": 5000000}
    )
    body = r.json()
    assert "finance" in body["impacted_modules"]
    assert "country_comparison" not in body["impacted_modules"]

    latest = await client.get(
        f"/api/v1/case/{case_id}/country-comparison", headers=headers
    )
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    """Force the gateway to receive unparseable JSON; the service writes a
    `failed` row with a rendering-friendly envelope and still records telemetry.
    """
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, VISA_CONCERNED)

    # Replace the stub provider's output for both retry attempts with garbage.
    from app.ai.providers import stub as stub_mod

    orig = stub_mod.StubProvider.generate_json

    async def broken(self, **kwargs):  # noqa: D401
        from app.ai.types import AICallMetrics, ProviderResponse

        return ProviderResponse(
            raw_text="THIS IS NOT JSON",
            metrics=AICallMetrics(
                model=kwargs["model"],
                prompt_version=None,
                tokens_in=1,
                tokens_out=1,
                latency_ms=1,
                request_id=kwargs["request_id"],
                success=True,
            ),
        )

    monkeypatch.setattr(stub_mod.StubProvider, "generate_json", broken)
    try:
        r = await _run(client, headers, case_id, VISA_CONCERNED.run_body)
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "failed"
        env = body["envelope"]
        assert env["status"] == "failed"
        assert env["error_code"] == "schema_validation_failed"
        assert env["user_message"]
    finally:
        monkeypatch.setattr(stub_mod.StubProvider, "generate_json", orig)


# ---- 6. logging + telemetry writes -----------------------------------------


@pytest.mark.asyncio
async def test_run_writes_ai_calls_and_analysis_rows(app_client) -> None:
    client, app = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, COMPARING_TWO_COUNTRIES)

    r = await _run(client, headers, case_id, COMPARING_TWO_COUNTRIES.run_body)
    assert r.status_code == 200

    # Use the dependency-overridden session to read.
    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (await session.execute(select(Analysis))).scalars().all()
        ai_calls = (await session.execute(select(AICall))).scalars().all()
    finally:
        await agen.aclose()

    assert len(analyses) == 1
    a = analyses[0]
    assert a.kind == "country_comparison"
    assert a.status == "ready"
    assert a.input_hash and len(a.input_hash) == 64
    assert a.analysis_version == 1
    assert a.tokens_in is not None and a.tokens_out is not None

    assert any(c.kind == "country_comparison" for c in ai_calls)


# ---- alternatives surfacing for the comparison-two-countries persona -------


@pytest.mark.asyncio
async def test_alternatives_surface_in_detail(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, COMPARING_TWO_COUNTRIES)
    r = await _run(client, headers, case_id, COMPARING_TWO_COUNTRIES.run_body)
    detail = r.json()["envelope"]["detail"]
    countries = {alt["country"] for alt in detail["alternatives_considered"]}
    assert {"DE", "IE"} & countries


# ---- missing required input → BadRequest -----------------------------------


@pytest.mark.asyncio
async def test_missing_target_country_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    # Profile only has current_country
    await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_country": "IN", "current_city": "Bengaluru"},
    )
    r = await _run(client, headers, case_id, {})
    assert r.status_code == 400


# ---- GET latest 404 when none exists ---------------------------------------


@pytest.mark.asyncio
async def test_latest_404_when_no_run(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    r = await client.get(
        f"/api/v1/case/{case_id}/country-comparison", headers=headers
    )
    assert r.status_code == 404
