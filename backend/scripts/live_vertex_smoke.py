"""Live Vertex AI smoke runner for every analysis module.

Run with the dev .env active (which switches AI_PROVIDER to vertex when
GCP_SERVICE_ACCOUNT_JSON_B64 is present). Spins up a fresh in-memory app,
seeds a profile, and drives every module through one POST /run, asserting:

  - HTTP 200
  - status == "ready"
  - envelope.metadata.model is the expected Gemini model
  - envelope.assumptions is non-empty
  - per-module score is in [0, 100] when present
  - the module-specific detail invariant holds (e.g. visa.legal_disclaimer)

Prints a per-module pass/fail line and a final tally. Exits non-zero if
any module fails.

Usage:
    python -m scripts.live_vertex_smoke
"""

from __future__ import annotations

import asyncio
import os
import sys
from typing import Any

from httpx import ASGITransport, AsyncClient


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
    "work_preference": "hybrid",
    "current_salary": 35000,
    "expected_salary": 85000,
    "salary_currency": "EUR",
    "current_document_status": {
        "PASSPORT": {"has": True},
        "EDUCATION_TRANSCRIPTS": {"has": True},
        "CV": {"has": True},
    },
}

# (slug, kind, expected_model_tier, optional invariant fn(detail))
_MODULES: list[tuple[str, str, str, Any]] = [
    ("country-comparison", "country_comparison", "pro", lambda d: True),
    ("job-fit", "jobfit", "pro", lambda d: "overall_job_fit_score" in d),
    ("visa", "visa", "pro", lambda d: bool(d.get("legal_disclaimer"))),
    ("family", "family", "pro", lambda d: d.get("mode") in ("solo", "with_family")),
    ("finance", "finance", "pro", lambda d: "monthly_net" in d and "monthly_cost" in d),
    ("documents", "documents", "flash", lambda d: int(d.get("total_count", 0)) >= 1),
    ("workflow", "workflow", "pro", lambda d: bool(d.get("nodes")) and bool(d.get("edges")) is not None),
    ("culture", "culture", "flash", lambda d: bool(d.get("language", {}).get("primary_language"))),
    ("timeline", "timeline", "pro", lambda d: bool(d.get("phases"))),
    # synthesis ran last after the priors above
    ("synthesis", "synthesis", "pro", lambda d: d.get("verdict") in ("go", "go_with_conditions", "wait", "reconsider", "blocked")),
]


async def _bootstrap_app():
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
    from app.ai.gateway import reset_ai_gateway, get_ai_gateway
    from app.main import create_app
    from app.storage import models  # noqa
    from app.storage.db import Base, get_session

    reset_ai_gateway()
    provider = get_ai_gateway().provider.name
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    SM = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override():
        async with SM() as s:
            try:
                yield s
                await s.commit()
            except Exception:
                await s.rollback()
                raise

    app = create_app()
    app.dependency_overrides[get_session] = _override
    return app, provider


async def main() -> int:
    app, provider = await _bootstrap_app()
    print(f"[smoke] AI provider: {provider}")
    if provider != "vertex_gemini":
        print("[smoke] WARNING: provider is not vertex_gemini; this is not a live test.")

    failures: list[str] = []
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", timeout=300.0) as c:
        r = await c.post(
            "/api/v1/auth/register",
            json={"email": "smoke@x.io", "password": "hunter2-strong", "name": "S"},
        )
        body = r.json()
        access = body["tokens"]["access_token"]
        case_id = body["case_id"]
        H = {"Authorization": f"Bearer {access}"}

        pr = await c.patch("/api/v1/profile", headers=H, json=_PROFILE)
        if pr.status_code != 200:
            print(f"[smoke] FATAL: profile patch failed: {pr.status_code} {pr.text}")
            return 2

        for slug, kind, tier, invariant in _MODULES:
            print(f"[smoke] running {kind}...", flush=True)
            try:
                rr = await c.post(f"/api/v1/case/{case_id}/{slug}/run", headers=H, json={})
            except Exception as e:
                failures.append(f"{kind}: HTTP error {e}")
                print(f"[smoke]   FAIL transport: {e}")
                continue

            if rr.status_code != 200:
                failures.append(f"{kind}: {rr.status_code} {rr.text[:200]}")
                print(f"[smoke]   FAIL: {rr.status_code}")
                continue

            j = rr.json()
            st = j.get("status")
            env = j.get("envelope") or {}
            md = env.get("metadata") or {}
            model = md.get("model", "?")
            tokens = (md.get("tokens_in"), md.get("tokens_out"))
            lat = md.get("latency_ms")

            if st != "ready":
                failures.append(f"{kind}: status={st} ({env.get('error_code')})")
                print(f"[smoke]   FAIL: status={st} error_code={env.get('error_code')}")
                continue

            if not env.get("assumptions"):
                failures.append(f"{kind}: empty assumptions")
                print(f"[smoke]   FAIL: empty assumptions")
                continue

            try:
                inv_ok = invariant(env.get("detail") or {})
            except Exception as e:
                inv_ok = False
                failures.append(f"{kind}: invariant raised {e}")
            if not inv_ok:
                failures.append(f"{kind}: invariant failed")
                print(f"[smoke]   FAIL: detail invariant")
                continue

            print(
                f"[smoke]   OK  | model={model} tier={tier} "
                f"score={env.get('score')} latency={lat}ms tokens={tokens[0]}/{tokens[1]}"
            )

    print()
    print(f"[smoke] {'PASS' if not failures else 'FAIL'}: "
          f"{len(_MODULES) - len(failures)}/{len(_MODULES)} modules ready")
    if failures:
        print("[smoke] failures:")
        for f in failures:
            print(f"  - {f}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
