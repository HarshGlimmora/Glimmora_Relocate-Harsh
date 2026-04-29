# Glimmora Backend — Foundation

Phase 0–4 of the plan in [`../BACKEND_PLAN.md`](../BACKEND_PLAN.md).
Auth, profile, case, resume ingestion, and a single AI gateway. **No
analysis modules yet** — country comparison, jobfit, visa, family, finance,
documents, workflow, culture, timeline, synthesis are deferred.

## Quick start

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env

alembic upgrade head
uvicorn app.main:app --reload --port 8000
pytest -q
```

## Layout

```
app/
  main.py          FastAPI factory + router wiring
  config.py        Pydantic settings (env-driven)
  deps.py          Shared FastAPI dependencies (current_user, db session)
  schemas/         AnalysisEnvelope, UserProfile, ResumeExtraction, RelocationCase
  storage/         SQLAlchemy engine + ORM models + file storage
  middleware/      Error handler
  orchestration/   Case state machine + dependency map
  ai/              Gateway, providers (stub), prompt loader, telemetry
  prompts/         Versioned prompt files (.md)
  modules/
    auth/          Register, login, refresh, logout
    profile/       Profile CRUD + merge logic
    case/          Active case + state transitions
    resume/        Upload + parse + auto-fill
alembic/           Migrations
tests/
  unit/            Pure-logic tests
  integration/     API + DB tests against a per-test SQLite
```

## Configuration

All config is via env vars. `.env.example` documents every key.
The current `AI_PROVIDER=stub` produces deterministic structured output for
local dev and tests; swap to `vertex_gemini` later in `app/ai/gateway.py`.

## What this build is *not*

- No analysis modules
- No frontend
- No marketplace, payments, employer, partner, corporate, admin
- No real Vertex / Document AI yet (interface is in place)
- No streaming SSE endpoints (synthesis isn't implemented yet)

These are intentional. See the plan.
