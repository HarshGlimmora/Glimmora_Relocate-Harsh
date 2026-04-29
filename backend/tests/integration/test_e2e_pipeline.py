"""End-to-end one-shot backend pipeline test.

Verifies the complete user journey through every analysis module, in the
order a real frontend would drive it:

    register → profile → resume → case → 9 analyses → synthesis

The test is parameterized across realistic user personas (solo, family,
visa-heavy, salary-sensitive, slow-feasible, mixed-confidence). For each
persona we assert:

  - every module returns status=ready with score in [0,100]
  - the AnalysisEnvelope contract holds (assumptions non-empty, etc.)
  - synthesis module_scores match upstream within ±5 (consistency)
  - case state transitions are observable (analyses are persisted)
  - dashboard-ready JSON is present at the end

This is the "no module silently fails" guarantee.
"""

from __future__ import annotations

import io

import pytest
from docx import Document
from sqlalchemy import select

from app.storage.models import AICall, Analysis


# Modules to drive, in dependency order matching the BACKEND_PLAN.
# (kind, route_segment, body_for_module_run)
_MODULE_PIPELINE: list[tuple[str, str, dict]] = [
    ("country_comparison", "country-comparison", {}),
    ("jobfit", "job-fit", {}),
    ("visa", "visa", {}),
    # family is configured per-persona below
    ("finance", "finance", {}),
    ("documents", "documents", {}),
    ("workflow", "workflow", {}),
    ("culture", "culture", {}),
    ("timeline", "timeline", {}),
]


def _docx_bytes(body: str) -> bytes:
    buf = io.BytesIO()
    doc = Document()
    for line in body.splitlines():
        doc.add_paragraph(line)
    doc.save(buf)
    return buf.getvalue()


DOCX_MIME = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


# ---- personas ---------------------------------------------------------------


def _persona_solo_strong() -> dict:
    return {
        "name": "solo_strong",
        "email": "solo_strong@x.io",
        "resume": (
            "Asha Rao\nasha@x.io\n+91 99000 11122\n"
            "8 years of experience as a software engineer\n\n"
            "Skills: Python, Kubernetes, AWS\n"
        ),
        "profile": {
            "full_name": "Asha Rao",
            "current_role": "Senior Data Engineer",
            "industry": "Fintech",
            "current_country": "IN",
            "current_city": "Bengaluru",
            "target_country": "DE",
            "target_city": "Berlin",
            "nationality": "IN",
            "needs_visa_sponsorship": True,
            "move_urgency": "12m",
            "work_preference": "hybrid",
            "current_salary": 35000,
            "expected_salary": 85000,
            "salary_currency": "EUR",
            "current_document_status": {
                "PASSPORT": {"has": True},
                "EDUCATION_TRANSCRIPTS": {"has": True},
                "CV": {"has": True},
            },
        },
        "family_body": None,  # solo
    }


def _persona_family_moderate() -> dict:
    return {
        "name": "family_moderate",
        "email": "family@x.io",
        "resume": (
            "Hina Mehta\nhina@x.io\n+91 99000 22233\n"
            "9 years of experience as a product manager\n\n"
            "Skills: Roadmapping, B2B SaaS, Data\n"
        ),
        "profile": {
            "full_name": "Hina Mehta",
            "current_role": "Product Manager",
            "industry": "Edtech",
            "current_country": "IN",
            "current_city": "Mumbai",
            "target_country": "CA",
            "target_city": "Toronto",
            "nationality": "IN",
            "needs_visa_sponsorship": True,
            "move_urgency": "12m",
            "work_preference": "hybrid",
            "current_salary": 4500000,
            "expected_salary": 130000,
            "salary_currency": "CAD",
            "current_document_status": {
                "PASSPORT": {"has": True},
                "EDUCATION_TRANSCRIPTS": {"has": True},
                "MARRIAGE_CERT": {"has": True},
                "CHILD_BIRTH_CERT": {"has": True},
            },
        },
        "family_body": {
            "moving_with_family": True,
            "spouse": {"moving": True, "has_career": True, "profession": "Architect"},
            "children": [{"age": 8, "schooling_need": "primary"}],
            "parents": {"moving": False, "dependency_level": "none", "healthcare_sensitivity": "low"},
            "housing_requirement": "3BR near school",
            "family_budget_impact": "medium",
        },
    }


def _persona_visa_heavy() -> dict:
    return {
        "name": "visa_heavy",
        "email": "visa_heavy@x.io",
        "resume": (
            "Liu Wei\nliu@x.io\n+86 1380 0000 000\n"
            "6 years of experience as a QA engineer\n\nSkills: QA, Python\n"
        ),
        "profile": {
            "full_name": "Liu Wei",
            "current_role": "QA Engineer",
            "industry": "SaaS",
            "current_country": "CN",
            "target_country": "US",
            "target_city": "San Francisco",
            "nationality": "CN",
            "needs_visa_sponsorship": True,
            "move_urgency": "12m",
            "current_salary": 250000,
            "expected_salary": 140000,
            "salary_currency": "USD",
            "current_document_status": {
                "PASSPORT": {"has": True},
                "EDUCATION_TRANSCRIPTS": {"has": True},
            },
        },
        "family_body": None,
    }


def _persona_salary_sensitive() -> dict:
    return {
        "name": "salary_sensitive",
        "email": "salary@x.io",
        "resume": (
            "Mateo Alvarez\nmateo@x.io\n+54 9 11 0000 0000\n"
            "5 years of experience as a backend engineer\n\nSkills: Go, Postgres\n"
        ),
        "profile": {
            "full_name": "Mateo Alvarez",
            "current_role": "Backend Engineer",
            "industry": "Logistics",
            "current_country": "AR",
            "target_country": "GB",
            "target_city": "London",
            "nationality": "AR",
            "needs_visa_sponsorship": True,
            "move_urgency": "6m",
            # Tight finances: low current pay, high target costs
            "current_salary": 25000,
            "expected_salary": 55000,
            "salary_currency": "GBP",
            "current_document_status": {
                "PASSPORT": {"has": True},
                "CV": {"has": True},
            },
        },
        "family_body": None,
    }


def _persona_slow_feasible() -> dict:
    return {
        "name": "slow_feasible",
        "email": "slow@x.io",
        "resume": (
            "Daniel Park\ndaniel@x.io\n+82 10 0000 0000\n"
            "11 years of experience as a staff engineer\n\nSkills: Cloud, Distributed Systems\n"
        ),
        "profile": {
            "full_name": "Daniel Park",
            "current_role": "Staff Engineer",
            "industry": "SaaS",
            "current_country": "KR",
            "target_country": "NL",
            "target_city": "Amsterdam",
            "nationality": "KR",
            "needs_visa_sponsorship": True,
            "move_urgency": "exploring",
            "work_preference": "hybrid",
            "current_salary": 90000000,
            "expected_salary": 110000,
            "salary_currency": "EUR",
            "current_document_status": {
                "PASSPORT": {"has": True},
                "EDUCATION_TRANSCRIPTS": {"has": True},
                "CV": {"has": True},
                "EMPLOYMENT_LETTER": {"has": True},
                "BANK_STATEMENT": {"has": True},
            },
        },
        "family_body": None,
    }


def _persona_mixed_confidence() -> dict:
    """Sparse profile — exercises the 'partial data' codepath."""
    return {
        "name": "mixed_confidence",
        "email": "mixed@x.io",
        "resume": (
            "Zara Khan\nzara@x.io\n+92 300 000 0000\n"
            "12 years of experience as an engineering manager\n\nSkills: Leadership, Healthtech\n"
        ),
        "profile": {
            "full_name": "Zara Khan",
            "current_role": "Engineering Manager",
            "industry": "Healthtech",
            "current_country": "PK",
            "target_country": "AE",
            "target_city": "Dubai",
            "nationality": "PK",
            "needs_visa_sponsorship": True,
            "current_salary": 8000000,
            "expected_salary": 360000,
            "salary_currency": "AED",
            "current_document_status": {
                "PASSPORT": {"has": True},
            },
        },
        "family_body": None,
    }


PERSONAS = [
    _persona_solo_strong(),
    _persona_family_moderate(),
    _persona_visa_heavy(),
    _persona_salary_sensitive(),
    _persona_slow_feasible(),
    _persona_mixed_confidence(),
]


# ---- helpers ----------------------------------------------------------------


def _envelope_contract(env: dict) -> None:
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
    assert env["assumptions"], "assumptions must be non-empty"
    assert env["analysis_version"] >= 1
    md = env["metadata"]
    assert "model" in md and md["model"], "metadata.model must be set"
    if env["score"] is not None:
        assert 0 <= env["score"] <= 100
    assert 0.0 <= env["confidence"] <= 1.0


# ---- the test ---------------------------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("persona", PERSONAS, ids=[p["name"] for p in PERSONAS])
async def test_full_one_shot_pipeline(app_client, persona) -> None:
    client, app = app_client

    # 1) register
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": persona["email"], "password": "hunter2-strong", "name": persona["profile"]["full_name"]},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    access = body["tokens"]["access_token"]
    case_id = body["case_id"]
    user_id = body["user"]["id"]
    H = {"Authorization": f"Bearer {access}"}

    # 2) resume upload + parse + apply
    up = await client.post(
        "/api/v1/resume/upload",
        headers=H,
        files={"file": ("resume.docx", _docx_bytes(persona["resume"]), DOCX_MIME)},
    )
    assert up.status_code == 200, up.text
    parse_id = up.json()["parse_id"]
    apply = await client.post(f"/api/v1/resume/{parse_id}/apply", headers=H)
    assert apply.status_code == 200, apply.text

    # 3) profile patch (overrides + extras the resume doesn't carry)
    pr = await client.patch("/api/v1/profile", headers=H, json=persona["profile"])
    assert pr.status_code == 200, pr.text

    # 4) family analysis (run with the persona's family body if present)
    family_body = persona["family_body"] or {}
    fr = await client.post(f"/api/v1/case/{case_id}/family/run", headers=H, json=family_body)
    assert fr.status_code == 200, fr.text
    _envelope_contract(fr.json()["envelope"])

    # 5) all other modules in order
    for kind, slug, body_kw in _MODULE_PIPELINE:
        rr = await client.post(
            f"/api/v1/case/{case_id}/{slug}/run", headers=H, json=body_kw
        )
        assert rr.status_code == 200, f"{kind} failed: {rr.text}"
        env = rr.json()["envelope"]
        assert rr.json()["status"] == "ready", f"{kind} status not ready"
        _envelope_contract(env)

    # 6) synthesis (last)
    sr = await client.post(f"/api/v1/case/{case_id}/synthesis/run", headers=H, json={})
    assert sr.status_code == 200, sr.text
    sresp = sr.json()
    assert sresp["status"] == "ready"
    senv = sresp["envelope"]
    _envelope_contract(senv)

    sd = senv["detail"]
    assert sd["verdict"] in ("go", "go_with_conditions", "wait", "reconsider", "blocked")
    assert 0 <= sd["feasibility_score"] <= 100
    assert sd["recommended_destination"]["country"] == persona["profile"]["target_country"]
    assert sd["next_best_actions"], "next_best_actions must be present"
    assert sd["explanation"]

    # 7) Cross-module consistency: synthesis module_scores match upstream within ±5
    upstream_scores: dict[str, int] = {}
    for kind, slug, _ in _MODULE_PIPELINE + [("family", "family", {})]:
        gr = await client.get(f"/api/v1/case/{case_id}/{slug}", headers=H)
        if gr.status_code == 200:
            sc = gr.json()["envelope"]["score"]
            if isinstance(sc, int):
                upstream_scores[kind] = sc

    for ms in sd["module_scores"]:
        if not ms.get("available", True):
            continue
        if ms["kind"] in upstream_scores:
            assert abs(ms["score"] - upstream_scores[ms["kind"]]) <= 5, (
                f"{ms['kind']}: synthesis score {ms['score']} drifts from upstream "
                f"{upstream_scores[ms['kind']]} by >5"
            )

    # 8) DB-side checks: every analysis row exists, telemetry written
    from app.storage.db import get_session

    override = app.dependency_overrides.get(get_session)
    agen = override()
    session = await agen.__anext__()
    try:
        analyses = (await session.execute(select(Analysis))).scalars().all()
        ai_calls = (await session.execute(select(AICall))).scalars().all()
    finally:
        await agen.aclose()

    expected_kinds = {
        "country_comparison",
        "jobfit",
        "visa",
        "family",
        "finance",
        "documents",
        "workflow",
        "culture",
        "timeline",
        "synthesis",
    }
    have = {a.kind for a in analyses if a.status == "ready"}
    missing = expected_kinds - have
    assert not missing, f"missing analyses: {missing}"

    # Telemetry: every call has a model + tokens. Analysis rows are case-scoped
    # (no user_id column — the user is reachable via the case_id FK).
    for a in analyses:
        assert a.case_id == case_id
        assert a.input_hash and len(a.input_hash) == 64
        assert a.analysis_version == 1
        assert a.tokens_in is not None and a.tokens_out is not None
        assert a.latency_ms is not None
        assert a.model

    kinds_in_calls = {c.kind for c in ai_calls}
    for kind in expected_kinds:
        assert kind in kinds_in_calls, f"no ai_calls row for kind {kind}"


# ---- partial-rerun smoke: only impacted modules go stale -------------------


@pytest.mark.asyncio
async def test_partial_rerun_only_invalidates_impacted(app_client) -> None:
    client, _ = app_client
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "rerun@x.io", "password": "hunter2-strong", "name": "U"},
    )
    body = r.json()
    access = body["tokens"]["access_token"]
    case_id = body["case_id"]
    H = {"Authorization": f"Bearer {access}"}

    # Seed minimal profile
    pr = await client.patch(
        "/api/v1/profile",
        headers=H,
        json={
            "full_name": "U",
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
        },
    )
    assert pr.status_code == 200

    # Run a representative subset
    for slug in ("country-comparison", "job-fit", "visa", "finance", "documents", "workflow", "timeline"):
        rr = await client.post(f"/api/v1/case/{case_id}/{slug}/run", headers=H, json={})
        assert rr.status_code == 200

    # 1) Salary-only patch → finance + synthesis only
    r = await client.patch(
        "/api/v1/profile", headers=H, json={"current_salary": 60000}
    )
    impacted = set(r.json()["impacted_modules"])
    assert "finance" in impacted
    assert "synthesis" in impacted
    assert "visa" not in impacted
    assert "documents" not in impacted
    assert "country_comparison" not in impacted

    # finance is stale, country_comparison is not
    fr = await client.get(f"/api/v1/case/{case_id}/finance", headers=H)
    assert fr.json()["stale"] is True
    cr = await client.get(f"/api/v1/case/{case_id}/country-comparison", headers=H)
    assert cr.json()["stale"] is False
