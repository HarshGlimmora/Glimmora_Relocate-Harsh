"""Workflow integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.workflow_cases import (
    ALL_FIXTURES,
    DOCUMENT_BLOCKED,
    FAMILY_MOVER,
    SOLO_MOVER,
    URGENT_MOVE,
    VISA_HEAVY,
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
        f"/api/v1/case/{case_id}/workflow/run", headers=headers, json=body or {}
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
    assert len(d["nodes"]) >= 2, "graph must have at least two nodes"

    node_ids = {n["id"] for n in d["nodes"]}
    # All edges reference declared nodes
    for e in d["edges"]:
        assert e["from_node"] in node_ids
        assert e["to_node"] in node_ids
        assert e["from_node"] != e["to_node"]
        assert e["reason"]

    # current_stage references a declared node
    assert d["current_stage_node_id"] in node_ids
    # critical_path entries reference declared nodes
    assert all(nid in node_ids for nid in d["critical_path"])
    # blocked_node_ids reference declared nodes
    assert all(nid in node_ids for nid in d["blocked_node_ids"])
    # blocked_node_ids correspond to nodes whose status is blocked
    blocked_set = set(d["blocked_node_ids"])
    by_id = {n["id"]: n for n in d["nodes"]}
    for nid in blocked_set:
        assert by_id[nid]["status"] == "blocked"

    # totals respect min<=max and are positive
    assert d["total_estimated_days_min"] <= d["total_estimated_days_max"]
    assert d["total_estimated_days_min"] >= 0


# ---- persona-signal: document_blocked surfaces blocked nodes ---------------


@pytest.mark.asyncio
async def test_document_blocked_persona_has_blocked_nodes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, DOCUMENT_BLOCKED)
    r = await _run(client, headers, case_id, DOCUMENT_BLOCKED.run_body)
    d = r.json()["envelope"]["detail"]
    assert len(d["blocked_node_ids"]) >= 1
    # The passport check must be the blocker for this fixture
    assert "passport_check" in d["blocked_node_ids"]


# ---- persona-signal: family mover gets family nodes ------------------------


@pytest.mark.asyncio
async def test_family_mover_includes_family_nodes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_MOVER)
    r = await _run(client, headers, case_id, FAMILY_MOVER.run_body)
    d = r.json()["envelope"]["detail"]
    categories = {n["category"] for n in d["nodes"]}
    assert "family" in categories


# ---- persona-signal: visa-heavy persona has at least visa nodes ------------


@pytest.mark.asyncio
async def test_visa_heavy_includes_visa_chain(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, VISA_HEAVY)
    r = await _run(client, headers, case_id, VISA_HEAVY.run_body)
    d = r.json()["envelope"]["detail"]
    categories = {n["category"] for n in d["nodes"]}
    assert "visa" in categories
    # visa_application should be on the critical path
    assert "visa_application" in d["critical_path"]


# ---- persona-signal: urgent move lifts critical-path messaging -------------


@pytest.mark.asyncio
async def test_urgent_move_reasoning_mentions_urgency(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, URGENT_MOVE)
    r = await _run(client, headers, case_id, URGENT_MOVE.run_body)
    env = r.json()["envelope"]
    assert "urgent" in env["reasoning"].lower()


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    r = await _run(client, headers, case_id, SOLO_MOVER.run_body)
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
        "nodes",
        "edges",
        "current_stage_node_id",
        "critical_path",
        "blocked_node_ids",
        "total_estimated_days_min",
        "total_estimated_days_max",
        "headline_finding",
    ):
        assert key in d, f"missing detail key: {key}"

    n0 = d["nodes"][0]
    for k in (
        "id",
        "label",
        "category",
        "status",
        "owner",
        "estimated_duration_days_min",
        "estimated_duration_days_max",
    ):
        assert k in n0


# ---- 5. version increment + cache hit --------------------------------------


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

    latest = await client.get(f"/api/v1/case/{case_id}/workflow", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/workflow/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
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
async def test_target_country_change_marks_workflow_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    await _run(client, headers, case_id, SOLO_MOVER.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"target_country": "NL"}
    )
    assert "workflow" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/workflow", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_move_urgency_change_marks_workflow_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    await _run(client, headers, case_id, SOLO_MOVER.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"move_urgency": "asap"}
    )
    assert "workflow" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/workflow", headers=headers)
    assert latest.json()["stale"] is True


@pytest.mark.asyncio
async def test_role_only_change_does_not_mark_workflow_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    await _run(client, headers, case_id, SOLO_MOVER.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_role": "Director of Data"}
    )
    body = r.json()
    assert "jobfit" in body["impacted_modules"]
    assert "workflow" not in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/workflow", headers=headers)
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)

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
        r = await _run(client, headers, case_id, SOLO_MOVER.run_body)
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
    await _seed_profile(client, headers, VISA_HEAVY)
    r = await _run(client, headers, case_id, VISA_HEAVY.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "workflow")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "workflow")))
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
    assert any(c.kind == "workflow" for c in ai_calls)


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
    r = await client.get(f"/api/v1/case/{case_id}/workflow", headers=headers)
    assert r.status_code == 404
