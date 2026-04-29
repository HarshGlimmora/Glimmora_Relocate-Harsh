"""Family-relocation integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.family_cases import (
    ALL_FIXTURES,
    FAMILY_WITH_CHILDREN,
    HOUSING_PRESSURE,
    PARENTS_DEPENDENT,
    SOLO_MOVER,
    SPOUSE_CAREER,
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
        f"/api/v1/case/{case_id}/family/run", headers=headers, json=body or {}
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
    assert d["mode"] in {"solo", "with_family"}
    assert 0 <= d["household_complexity_score"] <= 100
    assert 0 <= d["family_friendly_destination_fit"] <= 100
    for k in ("spouse", "children", "parents", "housing_fit", "warnings", "suggestions"):
        assert k in d


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_WITH_CHILDREN)
    r = await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)
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
        "mode",
        "household_complexity_score",
        "family_friendly_destination_fit",
        "spouse",
        "children",
        "parents",
        "housing_fit",
        "warnings",
        "suggestions",
    ):
        assert key in d, f"missing detail key: {key}"

    # spouse + parents + housing sub-shapes
    for k in ("moving", "career_outlook", "visa_pathway", "language_pressure", "support_needs", "note"):
        assert k in d["spouse"]
    for k in ("moving", "dependency_level", "healthcare_fit", "visa_options", "care_recommendations", "note"):
        assert k in d["parents"]
    for k in ("pressure", "recommendation", "typical_lead_time_weeks"):
        assert k in d["housing_fit"]


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_WITH_CHILDREN)

    r1 = await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(FAMILY_WITH_CHILDREN.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(f"/api/v1/case/{case_id}/family", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(f"/api/v1/case/{case_id}/family/history", headers=headers)
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_WITH_CHILDREN)

    r1 = await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)
    r2 = await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_target_country_change_marks_family_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_WITH_CHILDREN)
    await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)

    r = await client.patch("/api/v1/profile", headers=headers, json={"target_country": "DE"})
    body = r.json()
    assert "family" in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/family", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_role_only_change_does_not_mark_family_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_WITH_CHILDREN)
    await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_role": "Director of Product"}
    )
    body = r.json()
    assert "jobfit" in body["impacted_modules"]
    assert "family" not in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/family", headers=headers)
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPOUSE_CAREER)

    from app.ai.providers import stub as stub_mod

    orig = stub_mod.StubProvider.generate_json

    async def broken(self, **kwargs):
        from app.ai.types import AICallMetrics, ProviderResponse

        return ProviderResponse(
            raw_text="{not even close to json",
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
        r = await _run(client, headers, case_id, SPOUSE_CAREER.run_body)
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
    await _seed_profile(client, headers, PARENTS_DEPENDENT)
    r = await _run(client, headers, case_id, PARENTS_DEPENDENT.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "family")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "family")))
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
    assert any(c.kind == "family" for c in ai_calls)


# ---- solo mode produces a short, valid artifact ----------------------------


@pytest.mark.asyncio
async def test_solo_mode_artifact_is_short_and_valid(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SOLO_MOVER)
    r = await _run(client, headers, case_id, SOLO_MOVER.run_body)
    body = r.json()
    d = body["envelope"]["detail"]
    assert d["mode"] == "solo"
    assert d["household_complexity_score"] <= 25
    assert d["children"] == []
    assert d["spouse"]["moving"] is False
    assert d["parents"]["moving"] is False
    assert d["spouse"]["career_outlook"] == "not_applicable"
    assert d["parents"]["healthcare_fit"] == "not_applicable"


# ---- with-family mode populates the right sub-objects ----------------------


@pytest.mark.asyncio
async def test_family_with_children_populates_children_outlook(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_WITH_CHILDREN)
    r = await _run(client, headers, case_id, FAMILY_WITH_CHILDREN.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["mode"] == "with_family"
    assert len(d["children"]) == 2
    for child in d["children"]:
        assert child["schooling_recommendation"]
        assert child["language_pressure"] in {"low", "medium", "high", "unknown"}
        assert 0 <= child["integration_estimate_months"] <= 48


@pytest.mark.asyncio
async def test_dependent_parents_surface_high_severity_warning(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, PARENTS_DEPENDENT)
    r = await _run(client, headers, case_id, PARENTS_DEPENDENT.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["parents"]["moving"] is True
    assert d["parents"]["dependency_level"] in ("high", "full_dependency")
    assert any(
        w["affects"] == "parents" and w["severity"] == "high"
        for w in d["warnings"]
    )


@pytest.mark.asyncio
async def test_housing_pressure_fixture_marks_high_pressure(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, HOUSING_PRESSURE)
    r = await _run(client, headers, case_id, HOUSING_PRESSURE.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["housing_fit"]["pressure"] == "high"
    assert d["housing_fit"]["typical_lead_time_weeks"] >= 8


@pytest.mark.asyncio
async def test_spouse_career_pressure_marks_career_outlook(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, SPOUSE_CAREER)
    r = await _run(client, headers, case_id, SPOUSE_CAREER.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["spouse"]["moving"] is True
    assert d["spouse"]["career_outlook"] in {"strong", "workable", "tight"}
    assert d["spouse"]["support_needs"]


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
    r = await client.get(f"/api/v1/case/{case_id}/family", headers=headers)
    assert r.status_code == 404
