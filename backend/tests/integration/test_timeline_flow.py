"""Timeline integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.timeline_cases import (
    ALL_FIXTURES,
    BLOCKED_CASE,
    FAMILY_DELAYED,
    FAMILY_RUN_BODY_FOR_FAMILY_DELAYED,
    SLOW_FEASIBLE,
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
        f"/api/v1/case/{case_id}/timeline/run", headers=headers, json=body or {}
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
    assert d["start_anchor"] in ("today", "earliest_realistic_start")
    assert d["earliest_realistic_start_date"]
    assert len(d["phases"]) >= 2
    assert len(d["milestones"]) >= 3

    # phase week monotonicity
    last_start = -1
    for p in d["phases"]:
        assert p["start_week"] <= p["end_week"]
        assert p["start_week"] >= last_start
        last_start = p["start_week"]

    # milestones reference declared phases
    phase_ids = {p["id"] for p in d["phases"]}
    for m in d["milestones"]:
        assert m["phase_id"] in phase_ids

    # critical_milestones reference declared milestones
    milestone_ids = {m["id"] for m in d["milestones"]}
    for cm in d["critical_milestones"]:
        assert cm in milestone_ids

    assert d["estimated_total_weeks_min"] <= d["estimated_total_weeks_max"]


# ---- persona signal: blocked case has at least one high-severity blocker ---


@pytest.mark.asyncio
async def test_blocked_case_surfaces_blocker(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, BLOCKED_CASE)
    r = await _run(client, headers, case_id, BLOCKED_CASE.run_body)
    d = r.json()["envelope"]["detail"]
    assert len(d["blockers"]) >= 1
    assert any(b["severity"] == "high" for b in d["blockers"])
    assert d["start_anchor"] == "earliest_realistic_start"


# ---- persona signal: clean case anchors today --------------------------


@pytest.mark.asyncio
async def test_slow_feasible_anchors_today(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)
    r = await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["start_anchor"] == "today"
    assert len(d["blockers"]) == 0


# ---- persona signal: visa-heavy uses longer processing window ------------


@pytest.mark.asyncio
async def test_visa_heavy_lengthens_processing(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, VISA_HEAVY)

    # Run visa first so its prior summary signals difficulty into timeline.
    vr = await client.post(
        f"/api/v1/case/{case_id}/visa/run", headers=headers, json={}
    )
    assert vr.status_code == 200, vr.text

    r = await _run(client, headers, case_id, VISA_HEAVY.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["estimated_total_weeks_max"] >= 28


# ---- persona signal: family with delays adds settlement weeks -------------


@pytest.mark.asyncio
async def test_family_delays_extends_settlement(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_DELAYED)

    fr = await client.post(
        f"/api/v1/case/{case_id}/family/run",
        headers=headers,
        json=FAMILY_RUN_BODY_FOR_FAMILY_DELAYED,
    )
    assert fr.status_code == 200, fr.text

    r = await _run(client, headers, case_id, FAMILY_DELAYED.run_body)
    d = r.json()["envelope"]["detail"]
    settlement = next((p for p in d["phases"] if p["id"] == "settlement"), None)
    assert settlement is not None
    # Family-flagged settlements should run a longer band.
    assert settlement["end_week"] - settlement["start_week"] >= 6
    # Critical milestones should include school admission for family case.
    assert "school_admission" in d["critical_milestones"]


# ---- persona signal: urgent move compresses pre_application -------------


@pytest.mark.asyncio
async def test_urgent_move_compresses_pre_application(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, URGENT_MOVE)
    r = await _run(client, headers, case_id, URGENT_MOVE.run_body)
    d = r.json()["envelope"]["detail"]
    pre = next(p for p in d["phases"] if p["id"] == "pre_application")
    assert pre["end_week"] - pre["start_week"] <= 6


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)
    r = await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)
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
        "start_anchor",
        "earliest_realistic_start_date",
        "phases",
        "milestones",
        "blockers",
        "estimated_total_weeks_min",
        "estimated_total_weeks_max",
        "critical_milestones",
        "headline_finding",
    ):
        assert key in d, f"missing detail key: {key}"

    p0 = d["phases"][0]
    for k in ("id", "label", "category", "start_week", "end_week", "description"):
        assert k in p0
    m0 = d["milestones"][0]
    for k in ("id", "label", "target_week", "phase_id", "depends_on", "why"):
        assert k in m0


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)

    r1 = await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(SLOW_FEASIBLE.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(f"/api/v1/case/{case_id}/timeline", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/timeline/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)

    r1 = await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)
    r2 = await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_target_country_change_marks_timeline_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)
    await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"target_country": "DE"}
    )
    assert "timeline" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/timeline", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_move_urgency_change_marks_timeline_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)
    await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"move_urgency": "asap"}
    )
    assert "timeline" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/timeline", headers=headers)
    assert latest.json()["stale"] is True


@pytest.mark.asyncio
async def test_unrelated_change_does_not_mark_timeline_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)
    await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)

    r = await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_salary": 120000, "salary_currency": "USD"},
    )
    body = r.json()
    assert "timeline" not in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/timeline", headers=headers)
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SLOW_FEASIBLE)

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
        r = await _run(client, headers, case_id, SLOW_FEASIBLE.run_body)
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
            (await session.execute(select(Analysis).where(Analysis.kind == "timeline")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "timeline")))
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
    assert any(c.kind == "timeline" for c in ai_calls)


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
    r = await client.get(f"/api/v1/case/{case_id}/timeline", headers=headers)
    assert r.status_code == 404
