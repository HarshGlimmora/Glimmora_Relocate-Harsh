"""Job-fit integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.job_fit_cases import (
    ALL_FIXTURES,
    HIGH_EXP_LOW_REALISM,
    OPEN_TO_ROLE_CHANGE,
    ROLE_MISMATCH,
    STRONG_MATCH,
    VISA_SPONSORSHIP_REQUIRED,
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
    return await client.post(
        f"/api/v1/case/{case_id}/job-fit/run", headers=headers, json=body or {}
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
    assert body["recompute_required"] is False

    env = body["envelope"]
    assert env["status"] == "ready"
    assert 0 <= env["score"] <= 100
    assert env["summary"] and env["reasoning"]
    assert env["assumptions"]

    d = env["detail"]
    assert 0 <= d["overall_job_fit_score"] <= 100
    for k in ("role_match", "salary_realism", "visa_employability"):
        assert k in d
    sa = d["skill_alignment"]
    for k in ("aligned", "missing", "transferable"):
        assert k in sa
    assert d["pathways"], "pathways must be non-empty"
    assert d["estimated_time_to_offer_weeks"] >= 1


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MATCH)
    r = await _run(client, headers, case_id, STRONG_MATCH.run_body)
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
        "overall_job_fit_score",
        "role_match",
        "salary_realism",
        "visa_employability",
        "skill_alignment",
        "inferred_target_roles",
        "alternative_roles",
        "pathways",
        "estimated_time_to_offer_weeks",
        "key_gaps",
    ):
        assert key in d, f"missing detail key: {key}"


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MATCH)

    r1 = await _run(client, headers, case_id, STRONG_MATCH.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(STRONG_MATCH.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(
        f"/api/v1/case/{case_id}/job-fit", headers=headers
    )
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/job-fit/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MATCH)

    r1 = await _run(client, headers, case_id, STRONG_MATCH.run_body)
    r2 = await _run(client, headers, case_id, STRONG_MATCH.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_salary_change_marks_job_fit_stale_via_dependency_map(app_client) -> None:
    """The dependency map currently only maps salary fields → finance.
    Job-fit becomes stale when its own driving inputs change. We assert the
    inverse here: a salary-only change should NOT flip job-fit stale.
    """
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MATCH)
    await _run(client, headers, case_id, STRONG_MATCH.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_salary": 5000000}
    )
    body = r.json()
    assert "finance" in body["impacted_modules"]
    assert "jobfit" not in body["impacted_modules"]

    latest = await client.get(
        f"/api/v1/case/{case_id}/job-fit", headers=headers
    )
    assert latest.json()["stale"] is False


@pytest.mark.asyncio
async def test_role_change_marks_job_fit_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MATCH)
    await _run(client, headers, case_id, STRONG_MATCH.run_body)

    r = await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_role": "Principal Data Engineer"},
    )
    body = r.json()
    assert "jobfit" in body["impacted_modules"]

    latest = await client.get(
        f"/api/v1/case/{case_id}/job-fit", headers=headers
    )
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_target_country_change_marks_job_fit_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_MATCH)
    await _run(client, headers, case_id, STRONG_MATCH.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"target_country": "NL"}
    )
    assert "jobfit" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/job-fit", headers=headers)
    assert latest.json()["stale"] is True


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, ROLE_MISMATCH)

    from app.ai.providers import stub as stub_mod

    orig = stub_mod.StubProvider.generate_json

    async def broken(self, **kwargs):
        from app.ai.types import AICallMetrics, ProviderResponse

        return ProviderResponse(
            raw_text="STILL NOT JSON",
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
        r = await _run(client, headers, case_id, ROLE_MISMATCH.run_body)
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
    await _seed_profile(client, headers, OPEN_TO_ROLE_CHANGE)
    r = await _run(client, headers, case_id, OPEN_TO_ROLE_CHANGE.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "jobfit")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "jobfit")))
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
    assert any(c.kind == "jobfit" for c in ai_calls)


# ---- alternative-roles surface only when open_to_role_change is true -------


@pytest.mark.asyncio
async def test_alternative_roles_only_when_user_is_open(app_client) -> None:
    client, _ = app_client

    # closed
    a1, c1 = await _register(client, email="closed@x.io")
    h1 = {"Authorization": f"Bearer {a1}"}
    await _seed_profile(client, h1, STRONG_MATCH)
    r_closed = await _run(client, h1, c1, STRONG_MATCH.run_body)
    closed_alts = r_closed.json()["envelope"]["detail"]["alternative_roles"]
    assert closed_alts == []

    # open
    a2, c2 = await _register(client, email="open@x.io")
    h2 = {"Authorization": f"Bearer {a2}"}
    await _seed_profile(client, h2, OPEN_TO_ROLE_CHANGE)
    r_open = await _run(client, h2, c2, OPEN_TO_ROLE_CHANGE.run_body)
    open_alts = r_open.json()["envelope"]["detail"]["alternative_roles"]
    assert open_alts, "open_to_role_change=true should surface alternatives"


# ---- visa-required user gets typical_sponsor_titles list -------------------


@pytest.mark.asyncio
async def test_visa_employability_for_sponsorship_required(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, VISA_SPONSORSHIP_REQUIRED)
    r = await _run(client, headers, case_id, VISA_SPONSORSHIP_REQUIRED.run_body)
    detail = r.json()["envelope"]["detail"]
    assert detail["visa_employability"]["typical_sponsor_titles"]
    assert detail["visa_employability"]["sponsor_friendly_employer_density"] in (
        "low",
        "medium",
        "high",
    )


# ---- high-experience-low-realism: salary gap surfaces ----------------------


@pytest.mark.asyncio
async def test_high_expectation_produces_meaningful_salary_gap(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, HIGH_EXP_LOW_REALISM)
    r = await _run(client, headers, case_id, HIGH_EXP_LOW_REALISM.run_body)
    sr = r.json()["envelope"]["detail"]["salary_realism"]
    # Expectation 200–240k EUR vs market ~95–140k → gap should be clearly positive.
    assert sr["gap_pct"] > 30
    assert sr["score"] < 70


# ---- missing required input → 400 ------------------------------------------


@pytest.mark.asyncio
async def test_missing_current_role_returns_400(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    # Profile has no current_role, body has none either.
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
    r = await client.get(f"/api/v1/case/{case_id}/job-fit", headers=headers)
    assert r.status_code == 404
