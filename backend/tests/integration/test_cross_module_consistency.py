"""Cross-module consistency tests.

These tests prove that module outputs don't contradict each other when
they read the same upstream signals. We avoid asserting on absolute
scores (which would be a brittle promise about model output); instead
we assert *relative* relationships that should hold by construction.

Examples:
  - visa direction must mention the same target_country the user supplied
  - finance must surface a currency-aware result tied to the user's
    `salary_currency`
  - timeline's `total_estimated_weeks_max` must not be smaller than the
    visa's processing window (visa is a sub-sequence of timeline)
  - synthesis `recommended_destination` echoes the case's target_country
"""

from __future__ import annotations

import pytest


async def _bootstrap(client, profile_patch: dict) -> tuple[dict, str]:
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": f"{id(profile_patch)}@x.io", "password": "hunter2-strong", "name": "U"},
    )
    body = r.json()
    H = {"Authorization": f"Bearer {body['tokens']['access_token']}"}
    pr = await client.patch("/api/v1/profile", headers=H, json=profile_patch)
    assert pr.status_code == 200, pr.text
    return H, body["case_id"]


_PROFILE = {
    "full_name": "Asha Rao",
    "current_role": "Senior Data Engineer",
    "industry": "Fintech",
    "current_country": "IN",
    "target_country": "DE",
    "target_city": "Berlin",
    "nationality": "IN",
    "needs_visa_sponsorship": True,
    "move_urgency": "12m",
    "current_salary": 35000,
    "expected_salary": 85000,
    "salary_currency": "EUR",
    "current_document_status": {"PASSPORT": {"has": True}},
}


@pytest.mark.asyncio
async def test_visa_module_target_matches_profile(app_client) -> None:
    client, _ = app_client
    H, case_id = await _bootstrap(client, _PROFILE)
    r = await client.post(f"/api/v1/case/{case_id}/visa/run", headers=H, json={})
    assert r.status_code == 200
    env = r.json()["envelope"]
    body = (env["summary"] + " " + env["reasoning"]).upper()
    assert "DE" in body or "GERMANY" in body  # destination is mentioned


@pytest.mark.asyncio
async def test_finance_currency_matches_profile(app_client) -> None:
    client, _ = app_client
    H, case_id = await _bootstrap(client, _PROFILE)
    r = await client.post(f"/api/v1/case/{case_id}/finance/run", headers=H, json={})
    assert r.status_code == 200
    d = r.json()["envelope"]["detail"]
    # Finance respects the currency the user chose — assert it appears in the
    # MonthlyNet payload.
    assert d["monthly_net"]["currency"] == "EUR"


@pytest.mark.asyncio
async def test_documents_target_country_consistent(app_client) -> None:
    client, _ = app_client
    H, case_id = await _bootstrap(client, _PROFILE)
    r = await client.post(f"/api/v1/case/{case_id}/documents/run", headers=H, json={})
    assert r.status_code == 200
    env = r.json()["envelope"]
    text = (env["summary"] + " " + env["reasoning"]).upper()
    # Either the country code or the country name appears.
    assert "DE" in text or "GERMANY" in text or "BERLIN" in text


@pytest.mark.asyncio
async def test_timeline_window_covers_visa_processing(app_client) -> None:
    """Timeline's max-weeks must not be smaller than the visa's processing window.

    Both come from the stub, so this is a structural consistency check on
    the orchestration / stub fusion logic, not a model claim.
    """
    client, _ = app_client
    H, case_id = await _bootstrap(client, _PROFILE)

    vr = await client.post(f"/api/v1/case/{case_id}/visa/run", headers=H, json={})
    assert vr.status_code == 200
    visa_d = vr.json()["envelope"]["detail"]
    visa_proc_max = int(visa_d.get("primary_route", {}).get("typical_processing_weeks_max") or 0)

    tr = await client.post(f"/api/v1/case/{case_id}/timeline/run", headers=H, json={})
    assert tr.status_code == 200
    tl_d = tr.json()["envelope"]["detail"]
    assert (
        tl_d["estimated_total_weeks_max"] >= visa_proc_max
    ), "timeline must cover at least the visa processing window"


@pytest.mark.asyncio
async def test_synthesis_destination_echoes_profile(app_client) -> None:
    client, _ = app_client
    H, case_id = await _bootstrap(client, _PROFILE)

    # Run a representative subset so synthesis has something to fuse.
    for slug in ("country-comparison", "job-fit", "visa", "finance", "documents"):
        rr = await client.post(f"/api/v1/case/{case_id}/{slug}/run", headers=H, json={})
        assert rr.status_code == 200

    sr = await client.post(f"/api/v1/case/{case_id}/synthesis/run", headers=H, json={})
    assert sr.status_code == 200
    d = sr.json()["envelope"]["detail"]
    assert d["recommended_destination"]["country"] == "DE"


@pytest.mark.asyncio
async def test_workflow_blocked_implies_timeline_blocker(app_client) -> None:
    """If workflow flags blocked nodes, timeline must surface them as blockers."""
    client, _ = app_client
    blocked_profile = dict(_PROFILE)
    blocked_profile["current_document_status"] = {"PASSPORT": {"has": False}}
    H, case_id = await _bootstrap(client, blocked_profile)

    wr = await client.post(f"/api/v1/case/{case_id}/workflow/run", headers=H, json={})
    blocked_nodes = wr.json()["envelope"]["detail"]["blocked_node_ids"]
    assert blocked_nodes, "workflow should flag a blocked node when passport is missing"

    tr = await client.post(f"/api/v1/case/{case_id}/timeline/run", headers=H, json={})
    tl = tr.json()["envelope"]["detail"]
    # Either start anchor moves to earliest_realistic_start OR a blocker is recorded.
    assert tl["start_anchor"] == "earliest_realistic_start" or len(tl["blockers"]) >= 1


@pytest.mark.asyncio
async def test_synthesis_verdict_in_band(app_client) -> None:
    """Synthesis verdict must always be a member of the closed enum and
    consistent with feasibility_score band."""
    client, _ = app_client
    H, case_id = await _bootstrap(client, _PROFILE)
    for slug in ("country-comparison", "job-fit", "visa", "finance", "documents"):
        await client.post(f"/api/v1/case/{case_id}/{slug}/run", headers=H, json={})

    sr = await client.post(f"/api/v1/case/{case_id}/synthesis/run", headers=H, json={})
    d = sr.json()["envelope"]["detail"]
    fs = d["feasibility_score"]
    verdict = d["verdict"]
    expected = (
        "go" if fs >= 80
        else "go_with_conditions" if fs >= 65
        else "wait" if fs >= 50
        else "reconsider" if fs >= 35
        else "blocked"
    )
    assert verdict == expected, f"verdict {verdict!r} drifted from band for score {fs}"
