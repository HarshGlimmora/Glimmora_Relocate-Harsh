"""Documents integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.documents_cases import (
    ALL_FIXTURES,
    FAMILY_EXTRA_DOCS,
    PARTIALLY_COMPLETE,
    PASSPORT_EXPIRING,
    SOLO_BASIC,
    VISA_DEPENDENT,
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
        f"/api/v1/case/{case_id}/documents/run", headers=headers, json=body or {}
    )


# ---- 2. successful generation across all 5 fixtures ------------------------


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

    env = body["envelope"]
    assert env["status"] == "ready"
    assert 0 <= env["score"] <= 100
    assert env["assumptions"]

    d = env["detail"]
    assert d["items"], "checklist must have items"
    assert d["total_count"] == len(d["items"])
    assert 0 <= d["readiness_percentage"] <= 100
    # have_count + need_count + expiring_count should equal total
    assert d["have_count"] + d["need_count"] + d["expiring_count"] == d["total_count"]

    # readiness percentage matches have / total
    expected_pct = round((d["have_count"] / d["total_count"]) * 100)
    assert d["readiness_percentage"] == expected_pct

    # missing_items only contains 'need' status entries
    for it in d["missing_items"]:
        assert it["status"] == "need"
    for it in d["expiring_items"]:
        assert it["status"] == "expiring"

    # next_to_handle is well-formed
    nt = d["next_to_handle"]
    assert nt["kind"] and nt["label"] and nt["why"]


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)
    r = await _run(client, headers, case_id, SOLO_BASIC.run_body)
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
        "items",
        "readiness_percentage",
        "have_count",
        "need_count",
        "expiring_count",
        "total_count",
        "missing_items",
        "expiring_items",
        "required_for_summary",
        "next_to_handle",
        "headline_finding",
    ):
        assert key in d, f"missing detail key: {key}"

    # Item sub-shape
    item0 = d["items"][0]
    for k in ("kind", "label", "status", "urgency", "required_for"):
        assert k in item0


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)

    r1 = await _run(client, headers, case_id, SOLO_BASIC.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(SOLO_BASIC.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(f"/api/v1/case/{case_id}/documents", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/documents/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)

    r1 = await _run(client, headers, case_id, SOLO_BASIC.run_body)
    r2 = await _run(client, headers, case_id, SOLO_BASIC.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_document_status_change_marks_documents_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)
    await _run(client, headers, case_id, SOLO_BASIC.run_body)

    r = await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_document_status": {"PASSPORT": {"has": True}, "CV": {"has": True}, "EDUCATION_TRANSCRIPTS": {"has": True}}},
    )
    body = r.json()
    assert "documents" in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/documents", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_target_country_change_marks_documents_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)
    await _run(client, headers, case_id, SOLO_BASIC.run_body)

    r = await client.patch("/api/v1/profile", headers=headers, json={"target_country": "NL"})
    assert "documents" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/documents", headers=headers)
    assert latest.json()["stale"] is True


@pytest.mark.asyncio
async def test_role_only_change_does_not_mark_documents_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)
    await _run(client, headers, case_id, SOLO_BASIC.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_role": "Director of Data"}
    )
    body = r.json()
    assert "jobfit" in body["impacted_modules"]
    assert "documents" not in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/documents", headers=headers)
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_EXTRA_DOCS)

    from app.ai.providers import stub as stub_mod

    orig = stub_mod.StubProvider.generate_json

    async def broken(self, **kwargs):
        from app.ai.types import AICallMetrics, ProviderResponse

        return ProviderResponse(
            raw_text="<<not json at all>>",
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
        r = await _run(client, headers, case_id, FAMILY_EXTRA_DOCS.run_body)
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
    await _seed_profile(client, headers, VISA_DEPENDENT)
    r = await _run(client, headers, case_id, VISA_DEPENDENT.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "documents")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "documents")))
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
    assert any(c.kind == "documents" for c in ai_calls)


# ---- persona-signal: passport expiring shows up under expiring_items ------


@pytest.mark.asyncio
async def test_expiring_passport_surfaces_in_expiring_items(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, PASSPORT_EXPIRING)
    r = await _run(client, headers, case_id, PASSPORT_EXPIRING.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["expiring_count"] >= 1
    assert any(it["kind"] == "PASSPORT" for it in d["expiring_items"])
    assert d["next_to_handle"]["kind"] == "PASSPORT"


# ---- partially-complete fixture: readiness reflects user-reported state ----


@pytest.mark.asyncio
async def test_partially_complete_readiness_is_partial(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, PARTIALLY_COMPLETE)
    r = await _run(client, headers, case_id, PARTIALLY_COMPLETE.run_body)
    d = r.json()["envelope"]["detail"]
    assert 10 < d["readiness_percentage"] < 100, "should not be 0% or 100%"
    assert d["have_count"] >= 4


# ---- required_for_summary always includes 'visa' --------------------------


@pytest.mark.asyncio
async def test_required_for_summary_groups_purposes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_BASIC)
    r = await _run(client, headers, case_id, SOLO_BASIC.run_body)
    summary = r.json()["envelope"]["detail"]["required_for_summary"]
    assert "visa" in summary
    assert "PASSPORT" in summary["visa"]


# ---- missing required input → 400 ------------------------------------------


@pytest.mark.asyncio
async def test_missing_target_country_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await client.patch(
        "/api/v1/profile", headers=headers, json={"current_country": "IN"}
    )
    r = await _run(client, headers, case_id, {})
    assert r.status_code == 400


# ---- GET latest 404 when none exists ---------------------------------------


@pytest.mark.asyncio
async def test_latest_404_when_no_run(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    r = await client.get(f"/api/v1/case/{case_id}/documents", headers=headers)
    assert r.status_code == 404
