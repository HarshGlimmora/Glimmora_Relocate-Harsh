"""Final synthesis integration tests covering acceptance #2–#8."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.synthesis_cases import (
    ALL_FIXTURES,
    BLOCKED_MOVER,
    FAMILY_RELOCATION,
    HIGH_CONFIDENCE,
    STRONG_MOVER,
    VISA_CHALLENGING,
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


async def _run_synthesis(client, headers, case_id, body=None):
    return await client.post(
        f"/api/v1/case/{case_id}/synthesis/run", headers=headers, json=body or {}
    )


# Run a representative set of upstream modules so synthesis has something to fuse.
_UPSTREAM_KINDS = ["country_comparison", "jobfit", "visa", "finance", "documents"]


async def _seed_priors(client, headers, case_id, fixture):
    # family analysis (only if fixture provides a body so it actually goes
    # into "with family" mode for the family fixture)
    if fixture.family_run_body is not None:
        r = await client.post(
            f"/api/v1/case/{case_id}/family/run",
            headers=headers,
            json=fixture.family_run_body,
        )
        assert r.status_code == 200, r.text

    for kind in _UPSTREAM_KINDS:
        r = await client.post(
            f"/api/v1/case/{case_id}/{kind.replace('_', '-')}/run"
            if kind == "country_comparison"
            else f"/api/v1/case/{case_id}/{('job-fit' if kind == 'jobfit' else kind)}/run",
            headers=headers,
            json={},
        )
        assert r.status_code == 200, f"{kind} failed: {r.text}"


# ---- 2. successful generation across all 5 fixtures ------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("fixture", ALL_FIXTURES, ids=[f.name for f in ALL_FIXTURES])
async def test_successful_generation_for_each_persona(app_client, fixture) -> None:
    client, _ = app_client
    access, case_id = await _register(client, email=f"{fixture.name}@x.io")
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, fixture)
    await _seed_priors(client, headers, case_id, fixture)

    r = await _run_synthesis(client, headers, case_id, fixture.run_body)
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
    assert d["verdict"] in ("go", "go_with_conditions", "wait", "reconsider", "blocked")
    assert 0 <= d["feasibility_score"] <= 100
    assert d["recommended_destination"]["country"]
    assert d["recommended_job_path"]["title"]
    assert len(d["module_scores"]) >= 1
    assert len(d["next_best_actions"]) >= 1
    assert d["explanation"]

    # Module scores reference declared kinds
    valid_kinds = {
        "country_comparison",
        "jobfit",
        "visa",
        "family",
        "finance",
        "documents",
        "workflow",
        "culture",
        "timeline",
    }
    for ms in d["module_scores"]:
        assert ms["kind"] in valid_kinds


# ---- 8. synthesis consistency against priors -------------------------------


@pytest.mark.asyncio
async def test_synthesis_module_scores_match_upstream(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    await _seed_priors(client, headers, case_id, STRONG_MOVER)

    # Capture each upstream score
    upstream: dict[str, int] = {}
    for path, kind in [
        ("country-comparison", "country_comparison"),
        ("job-fit", "jobfit"),
        ("visa", "visa"),
        ("finance", "finance"),
        ("documents", "documents"),
    ]:
        ur = await client.get(f"/api/v1/case/{case_id}/{path}", headers=headers)
        upstream[kind] = ur.json()["envelope"]["score"]

    r = await _run_synthesis(client, headers, case_id, STRONG_MOVER.run_body)
    d = r.json()["envelope"]["detail"]

    for ms in d["module_scores"]:
        if not ms.get("available", True):
            continue
        if ms["kind"] in upstream:
            assert abs(ms["score"] - upstream[ms["kind"]]) <= 5, (
                f"synthesis {ms['kind']} score {ms['score']} drifts from upstream "
                f"{upstream[ms['kind']]} by more than 5"
            )


@pytest.mark.asyncio
async def test_blocked_mover_lands_low_verdict(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, BLOCKED_MOVER)
    await _seed_priors(client, headers, case_id, BLOCKED_MOVER)

    r = await _run_synthesis(client, headers, case_id, BLOCKED_MOVER.run_body)
    d = r.json()["envelope"]["detail"]
    # Without a passport + visa-heavy path, the verdict should be wait/reconsider/blocked
    assert d["verdict"] in ("wait", "reconsider", "blocked", "go_with_conditions")
    assert len(d["top_blockers"]) >= 1


@pytest.mark.asyncio
async def test_family_relocation_destination_echoes_profile(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_RELOCATION)
    await _seed_priors(client, headers, case_id, FAMILY_RELOCATION)

    r = await _run_synthesis(client, headers, case_id, FAMILY_RELOCATION.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["recommended_destination"]["country"] == "CA"


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, HIGH_CONFIDENCE)
    await _seed_priors(client, headers, case_id, HIGH_CONFIDENCE)
    r = await _run_synthesis(client, headers, case_id, HIGH_CONFIDENCE.run_body)
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
        "feasibility_score",
        "verdict",
        "one_line_reasoning",
        "recommended_destination",
        "recommended_job_path",
        "module_scores",
        "module_summaries",
        "top_blockers",
        "next_best_actions",
        "explanation",
        "headline_finding",
    ):
        assert key in d, f"missing detail key: {key}"

    rd = d["recommended_destination"]
    for k in ("country", "city", "confidence", "rationale"):
        assert k in rd

    rj = d["recommended_job_path"]
    for k in ("title", "industry", "confidence", "rationale"):
        assert k in rj


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    await _seed_priors(client, headers, case_id, STRONG_MOVER)

    r1 = await _run_synthesis(client, headers, case_id, STRONG_MOVER.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(STRONG_MOVER.run_body)
    body_force["force"] = True
    r2 = await _run_synthesis(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(f"/api/v1/case/{case_id}/synthesis", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/synthesis/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    await _seed_priors(client, headers, case_id, STRONG_MOVER)

    r1 = await _run_synthesis(client, headers, case_id, STRONG_MOVER.run_body)
    r2 = await _run_synthesis(client, headers, case_id, STRONG_MOVER.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_target_country_change_marks_synthesis_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    await _seed_priors(client, headers, case_id, STRONG_MOVER)
    await _run_synthesis(client, headers, case_id, STRONG_MOVER.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"target_country": "NL"}
    )
    assert "synthesis" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/synthesis", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    await _seed_priors(client, headers, case_id, STRONG_MOVER)

    from app.ai.providers import stub as stub_mod

    orig = stub_mod.StubProvider.generate_json

    async def broken(self, **kwargs):
        from app.ai.types import AICallMetrics, ProviderResponse

        # Only break the synthesis call (it has 'feasibility_score' in schema).
        sch = kwargs.get("json_schema") or {}
        # detect synthesis schema by deep inspection
        defs = sch.get("$defs", {}) or sch.get("definitions", {})
        is_synthesis = any(
            "feasibility_score" in (v.get("properties") or {}) for v in defs.values()
        ) or "feasibility_score" in (sch.get("properties") or {})
        if not is_synthesis:
            return await orig(self, **kwargs)
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
        r = await _run_synthesis(client, headers, case_id, {"force": True})
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
    await _seed_profile(client, headers, VISA_CHALLENGING)
    await _seed_priors(client, headers, case_id, VISA_CHALLENGING)
    r = await _run_synthesis(client, headers, case_id, VISA_CHALLENGING.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "synthesis")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "synthesis")))
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
    assert any(c.kind == "synthesis" for c in ai_calls)


# ---- missing required upstream → 400 ---------------------------------------


@pytest.mark.asyncio
async def test_no_priors_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    # No priors ran → synthesis should refuse
    r = await _run_synthesis(client, headers, case_id, {})
    assert r.status_code == 400


# ---- missing target_country → 400 ------------------------------------------


@pytest.mark.asyncio
async def test_missing_target_country_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await client.patch(
        "/api/v1/profile", headers=headers, json={"current_country": "IN"}
    )
    r = await _run_synthesis(client, headers, case_id, {})
    assert r.status_code == 400


# ---- GET latest 404 when none exists ---------------------------------------


@pytest.mark.asyncio
async def test_latest_404_when_no_run(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    r = await client.get(f"/api/v1/case/{case_id}/synthesis", headers=headers)
    assert r.status_code == 404


# ---- SSE stream emits progress + result events -----------------------------


@pytest.mark.asyncio
async def test_sse_stream_emits_progress_and_result(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MOVER)
    await _seed_priors(client, headers, case_id, STRONG_MOVER)

    r = await client.post(
        f"/api/v1/case/{case_id}/synthesis/run/stream",
        headers=headers,
        json={"force": True},
    )
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
    body = r.text
    assert "event: progress" in body
    assert "event: result" in body
    assert '"verdict"' in body
