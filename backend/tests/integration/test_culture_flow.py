"""Culture integration tests covering acceptance #2–#7."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.storage.models import AICall, Analysis
from tests.fixtures.cases.culture_cases import (
    ALL_FIXTURES,
    FAMILY_MOVER_CA,
    FAMILY_MOVER_CA_FAMILY_RUN_BODY,
    FORMAL_WORKPLACE_JP,
    LANGUAGE_BARRIER_DE,
    LIGHT_SOCIAL_NL,
    STRONG_ENGLISH_GB,
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
        f"/api/v1/case/{case_id}/culture/run", headers=headers, json=body or {}
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
    assert len(d["daily_life"]) >= 3
    assert len(d["first_week_kit"]) >= 3
    assert len(d["dos_and_donts"]) >= 2
    assert len(d["language"]["basic_phrases"]) >= 3
    assert d["language"]["proficiency_target"] in ("none", "A1", "A2", "B1", "B2", "C1", "C2")
    assert 0 <= d["language"]["english_usability_score"] <= 100


# ---- persona signal: Japan → high B1 target, low english usability ---------


@pytest.mark.asyncio
async def test_japan_has_low_english_usability(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FORMAL_WORKPLACE_JP)
    r = await _run(client, headers, case_id, FORMAL_WORKPLACE_JP.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["language"]["primary_language"] == "Japanese"
    assert d["language"]["english_usability_score"] < 60


@pytest.mark.asyncio
async def test_uk_has_high_english_usability(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, STRONG_ENGLISH_GB)
    r = await _run(client, headers, case_id, STRONG_ENGLISH_GB.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["language"]["primary_language"] == "English"
    assert d["language"]["english_usability_score"] >= 90


@pytest.mark.asyncio
async def test_netherlands_emphasises_directness(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)
    r = await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)
    d = r.json()["envelope"]["detail"]
    assert "direct" in d["workplace_norms"]["communication_style"].lower()


@pytest.mark.asyncio
async def test_germany_recommends_b1_target(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LANGUAGE_BARRIER_DE)
    r = await _run(client, headers, case_id, LANGUAGE_BARRIER_DE.run_body)
    d = r.json()["envelope"]["detail"]
    assert d["language"]["primary_language"] == "German"
    assert d["language"]["proficiency_target"] in ("B1", "B2")


# ---- family mover: family_adaptation_notes populated when family signal ----


@pytest.mark.asyncio
async def test_family_mover_gets_family_notes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, FAMILY_MOVER_CA)

    # Run family analysis with explicit family signals so culture's prior_analyses
    # summary includes "with family" / "household" cues.
    fr = await client.post(
        f"/api/v1/case/{case_id}/family/run",
        headers=headers,
        json=FAMILY_MOVER_CA_FAMILY_RUN_BODY,
    )
    assert fr.status_code == 200, fr.text

    r = await _run(client, headers, case_id, FAMILY_MOVER_CA.run_body)
    d = r.json()["envelope"]["detail"]
    assert isinstance(d["family_adaptation_notes"], list)
    assert len(d["family_adaptation_notes"]) >= 1


# ---- 7. frontend-ready response shape --------------------------------------


@pytest.mark.asyncio
async def test_frontend_response_shape_is_stable(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)
    r = await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)
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
        "workplace_norms",
        "daily_life",
        "language",
        "first_week_kit",
        "dos_and_donts",
        "family_adaptation_notes",
        "headline_finding",
    ):
        assert key in d, f"missing detail key: {key}"

    norms = d["workplace_norms"]
    for k in ("communication_style", "hierarchy_note", "meeting_etiquette"):
        assert k in norms

    lang = d["language"]
    for k in ("primary_language", "english_usability_score", "proficiency_target", "rationale", "basic_phrases"):
        assert k in lang


# ---- 5. version increment + cache hit --------------------------------------


@pytest.mark.asyncio
async def test_force_rerun_increments_version_and_supersedes(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)

    r1 = await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)
    assert r1.json()["analysis_version"] == 1

    body_force = dict(LIGHT_SOCIAL_NL.run_body)
    body_force["force"] = True
    r2 = await _run(client, headers, case_id, body_force)
    assert r2.status_code == 200
    assert r2.json()["analysis_version"] == 2

    latest = await client.get(f"/api/v1/case/{case_id}/culture", headers=headers)
    assert latest.json()["analysis_version"] == 2

    hist = await client.get(
        f"/api/v1/case/{case_id}/culture/history", headers=headers
    )
    h = hist.json()
    assert h["count"] == 2
    assert [item["analysis_version"] for item in h["items"]] == [2, 1]


@pytest.mark.asyncio
async def test_repeat_run_same_inputs_returns_cached(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)

    r1 = await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)
    r2 = await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)
    assert r1.json()["analysis_version"] == r2.json()["analysis_version"] == 1
    assert r1.json()["envelope"]["input_hash"] == r2.json()["envelope"]["input_hash"]


# ---- 4. stale marking after input change -----------------------------------


@pytest.mark.asyncio
async def test_target_country_change_marks_culture_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)
    await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"target_country": "DE"}
    )
    assert "culture" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/culture", headers=headers)
    j = latest.json()
    assert j["stale"] is True
    assert j["recompute_required"] is True
    assert j["stale_reason"] is not None


@pytest.mark.asyncio
async def test_role_change_marks_culture_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)
    await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)

    r = await client.patch(
        "/api/v1/profile", headers=headers, json={"current_role": "Director"}
    )
    assert "culture" in r.json()["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/culture", headers=headers)
    assert latest.json()["stale"] is True


@pytest.mark.asyncio
async def test_unrelated_change_does_not_mark_culture_stale(app_client) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)
    await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)

    r = await client.patch(
        "/api/v1/profile",
        headers=headers,
        json={"current_salary": 120000, "salary_currency": "USD"},
    )
    body = r.json()
    assert "culture" not in body["impacted_modules"]

    latest = await client.get(f"/api/v1/case/{case_id}/culture", headers=headers)
    assert latest.json()["stale"] is False


# ---- 3. invalid model output handling --------------------------------------


@pytest.mark.asyncio
async def test_invalid_model_output_yields_failed_envelope(
    app_client, monkeypatch
) -> None:
    client, _ = app_client
    access, case_id = await _register(client)
    headers = {"Authorization": f"Bearer {access}"}
    await _seed_profile(client, headers, LIGHT_SOCIAL_NL)

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
        r = await _run(client, headers, case_id, LIGHT_SOCIAL_NL.run_body)
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
    await _seed_profile(client, headers, FORMAL_WORKPLACE_JP)
    r = await _run(client, headers, case_id, FORMAL_WORKPLACE_JP.run_body)
    assert r.status_code == 200

    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    assert override is not None
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (
            (await session.execute(select(Analysis).where(Analysis.kind == "culture")))
            .scalars()
            .all()
        )
        ai_calls = (
            (await session.execute(select(AICall).where(AICall.kind == "culture")))
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
    assert any(c.kind == "culture" for c in ai_calls)


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
    r = await client.get(f"/api/v1/case/{case_id}/culture", headers=headers)
    assert r.status_code == 404
