"""Visa-direction integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.visa_cases import (
    ALL_FIXTURES,
    FAMILY_RELOCATION,
    HIGH_DIFFICULTY,
    LOW_DIFFICULTY,
    NO_CURRENT_VISA,
    SPONSOR_REQUIRED,
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
    r = await client.patch(
        "/api/v1/profile", headers=headers, json=fixture.profile_patch
    )
    assert r.status_code == 200, r.text


async def _run(client, headers, case_id, body=None):
    return await client.post(
        f"/api/v1/case/{case_id}/visa/run", headers=headers, json=body or {}
    )


# ---- 2. successful generation across all 5 personas ------------------------


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
    assert env["status"] == "ready"
    assert 0 <= env["score"] <= 100
    assert env["summary"] and env["reasoning"]
    assert env["assumptions"]

    d = env["detail"]
    pr = d["primary_route"]
    assert pr["name"]
    assert pr["difficulty"] in {"low", "medium", "high", "very_high"}
    assert pr["requirements"]
    assert d["route_difficulty"] in {"low", "medium", "high", "very_high"}
    assert d["typical_processing_time_label"]
    assert d["legal_disclaimer"].lower().startswith("this is directional")
    assert all(b["fixable"] for b in d["fixable_blockers"])


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPONSOR_REQUIRED)
    r = await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)
    body = r.json()

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

    d = env["detail"]
    for key in (
        "primary_route",
        "route_difficulty",
        "typical_processing_time_label",
        "alternative_routes",
        "blockers",
        "fixable_blockers",
        "dependencies",
        "legal_disclaimer",
    ):
        assert key in d, f"missing detail key: {key}"


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPONSOR_REQUIRED)

    r1 = await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(SPONSOR_REQUIRED.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(f"/api/v1/case/{case_id}/visa", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/visa/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPONSOR_REQUIRED)

    r1 = await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)
    r2 = await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_nationality_change_marks_visa_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPONSOR_REQUIRED)
    await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)

    r = await client.patch("/api/v1/profile", headers=headers, json={"nationality": "GB"})
    body = r.json()
    assert "visa" in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/visa", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_current_visa_status_change_marks_visa_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPONSOR_REQUIRED)
    await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)

    r = await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_visa_status": "DE Blue Card holder"},
    )
    assert "visa" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/visa", headers=headers)
    assert latest.json()["stale"] is True


@pytest.mark.asyncio
async def test_salary_only_change_does_not_mark_visa_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPONSOR_REQUIRED)
    await _run(client, headers, case_id, SPONSOR_REQUIRED.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_salary": 9000000}
    )
    body = r.json()
    assert "finance" in body["impacted_modules"]
    assert "visa" not in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/visa", headers=headers)
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, NO_CURRENT_VISA)

    from app.ai.providers import stub as stub_mod

    orig = stub_mod.StubProvider.generate_json

    async def broken(self, **kwargs):
        from app.ai.types import AICallMetrics, ProviderResponse

        return ProviderResponse(
            raw_text="DEFINITELY NOT JSON",
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
        r = await _run(client, headers, case_id, NO_CURRENT_VISA.run_body)
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
    await _seed_profile(client, headers, FAMILY_RELOCATION)
    r = await _run(client, headers, case_id, FAMILY_RELOCATION.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "visa")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "visa")))
            .scalars()
            .all()
        )
    finally:
        await agen.aclose()

    assert len(analyses) == 1
    a = analyses[0]
    assert a.status == "ready"
    assert a.input_hash and len(a.input_hash) == 64
    assert a.analysis_version == 1
    assert a.tokens_in is not None and a.tokens_out is not None
    assert any(c.kind == "visa" for c in ai_calls)


# ---- persona signal: high-difficulty produces high difficulty + lower score ---


@pytest.mark.asyncio
async def test_high_difficulty_destination_scores_lower_than_low(app_client) -> None:
    client, _ = app_client

    a1, c1 = await _register(client, email="hd@x.io")
    h1 = {"Authorization": f"Bearer {a1}"}
    await _seed_profile(client, h1, HIGH_DIFFICULTY)
    rh = await _run(client, h1, c1, HIGH_DIFFICULTY.run_body)
    high_env = rh.json()["envelope"]

    a2, c2 = await _register(client, email="ld@x.io")
    h2 = {"Authorization": f"Bearer {a2}"}
    await _seed_profile(client, h2, LOW_DIFFICULTY)
    rl = await _run(client, h2, c2, LOW_DIFFICULTY.run_body)
    low_env = rl.json()["envelope"]

    assert high_env["score"] < low_env["score"], "harder route should score lower"
    assert high_env["detail"]["route_difficulty"] in ("high", "very_high")
    assert low_env["detail"]["route_difficulty"] in ("low", "medium")


# ---- family relocation surfaces a family-related blocker / dependency ------


@pytest.mark.asyncio
async def test_family_relocation_surfaces_extra_blocker(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_RELOCATION)
    r = await _run(client, headers, case_id, FAMILY_RELOCATION.run_body)
    blockers = r.json()["envelope"]["detail"]["blockers"]
    assert any("dependent" in b["label"].lower() or "family" in b["detail"].lower() for b in blockers)


# ---- legal disclaimer is present and non-trivial on every fixture ----------


@pytest.mark.asyncio
@pytest.mark.parametrize("fixture", ALL_FIXTURES, ids=[f.name for f in ALL_FIXTURES])
async def test_legal_disclaimer_present(app_client, fixture) -> None:
    client, _ = app_client
    access, case_id = await _register(client, email=f"disc-{fixture.name}@x.io")
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, fixture)
    r = await _run(client, headers, case_id, fixture.run_body)
    disclaimer = r.json()["envelope"]["detail"]["legal_disclaimer"]
    assert "not legal advice" in disclaimer.lower()


# ---- missing required input → 400 ------------------------------------------


@pytest.mark.asyncio
async def test_missing_target_country_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    # Profile has nationality but no target_country
    await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"nationality": "IN", "current_country": "IN"},
    )
    r = await _run(client, headers, case_id, {})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_missing_nationality_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_country": "IN", "target_country": "DE"},
    )
    r = await _run(client, headers, case_id, {})
    assert r.status_code == 400


# ---- GET latest 404 when none exists ---------------------------------------


@pytest.mark.asyncio
async def test_latest_404_when_no_run(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    r = await client.get(f"/api/v1/case/{case_id}/visa", headers=headers)
    assert r.status_code == 404
