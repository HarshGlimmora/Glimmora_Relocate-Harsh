# Glimmora Relocate — Technical Documentation

**Version:** 1.0
**Last updated:** 2026-05-12
**Audience:** Developers · QA / Testing · DevOps · Product

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Core Modules Explanation](#5-core-modules-explanation)
6. [AI-Powered Features](#6-ai-powered-features)
7. [Payment Workflow](#7-payment-workflow)
8. [Application User Flow](#8-application-user-flow)
9. [APIs and Integrations](#9-apis-and-integrations)
10. [Environment Configuration](#10-environment-configuration)
11. [Setup Instructions (For Developers)](#11-setup-instructions-for-developers)
12. [Deployment Guide](#12-deployment-guide)
13. [Testing Guidelines](#13-testing-guidelines)
14. [Known Limitations or Risks](#14-known-limitations-or-risks)
15. [Future Improvements](#15-future-improvements)

---

## 1. Project Overview

### What is Glimmora Relocate?

**Glimmora Relocate** is an AI-powered decision-intelligence platform that helps a working professional decide *whether*, *where*, and *how* to relocate to another country. The MVP targets one persona — the **"Mover"** — a professional who already has (or is seeking) a job abroad and needs a structured, explainable verdict on their relocation options.

### Main Goal of the System

To compress what is normally a months-long, fragmented research effort (visa research, cost-of-living spreadsheets, document checklists, school searches, etc.) into a **single guided workflow** that produces a typed, schema-validated, AI-generated verdict — *"go to country X via visa Y, here is the gap list, here is the timeline, here is the runway."*

### Problem the Platform Solves

Relocation decisions are high-stakes, multi-dimensional, and poorly served by general-purpose search. Information is scattered across government sites, immigration lawyers, expat blogs, and salary calculators, with no single tool that:

- Personalises the analysis to the user's profile, finances, family, and risk tolerance.
- Produces *decisive*, ranked output rather than raw information.
- Cross-references visa eligibility, job market fit, finance feasibility, and lifestyle in one place.
- Returns the same answer twice (so the user can revisit and act).

Glimmora Relocate solves this with a fixed pipeline of **9 LLM-driven analyses** that compose into a final **Synthesis** verdict, all rendered through a consistent typed envelope on the dashboard.

### Main User Flow

1. **Account creation** on the consumer app ([apps/consumer](apps/consumer/)).
2. **Payment** — choose Basic / Pro / Premium plan (Razorpay) **or** use the admin bypass for dev testing.
3. **Resume upload** — AI extracts structured profile data (skills, employers, education).
4. **Profile review** — fill in destination, family, finance, visa intent.
5. **9-module pipeline** runs in dependency order:
   Country comparison → Visa → Job fit → Family → Finance → Documents → Culture → Workflow → Timeline.
6. **Synthesis** — final ranked verdict with a one-paragraph rationale.
7. User can re-edit inputs at any time; impacted modules auto-invalidate and re-run.

---

## 2. System Architecture

### High-Level Architecture

Glimmora Relocate is a **modular monorepo** containing one Python backend and five Next.js frontends. Only the **consumer** app and the **backend** are wired for the MVP; the other apps (admin, employer, partner, corporate) are scaffolded for future phases and not currently deployed by [render.yaml](render.yaml).

```
┌─────────────────────────────────────────────────────────────────┐
│  Consumer Frontend  (Next.js 14 · App Router · Server Actions)  │
│  - NextAuth (credentials) → session JWT                         │
│  - Razorpay checkout                                            │
│  - Prisma + SQLite/Postgres (auth, subscription, bridge tokens) │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST + SSE (Bearer JWT)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI Backend  (Python 3.11)                                 │
│  - Modular routers per analysis kind                             │
│  - SQLAlchemy 2 async + Alembic migrations                       │
│  - Single AI Gateway → Vertex Gemini (or deterministic Stub)     │
│  - Versioned prompts + Pydantic-validated envelopes              │
└────────────────────────┬────────────────────────────────────────┘
                         │ Vertex AI SDK
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Google Cloud · Vertex AI · Gemini 2.5 Flash / Pro              │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

- **Framework:** Next.js 14 with the App Router. All five portals are independent Next.js apps with their own [package.json](apps/consumer/package.json) and Prisma schema.
- **Routing layout:** `(public)` segments for marketing, `(auth)` for sign-in/sign-up, `/app` for the gated dashboard, `/payment` between login and dashboard.
- **Data fetching:** Server Components fetch backend data via [lib/backend/client.ts](apps/consumer/lib/backend/client.ts); client components stay UI-only.
- **State:** No global store. React Server Components + Server Actions, with Prisma as the source-of-truth for consumer-app concerns (user, subscription, bridge tokens).
- **UI:** Tailwind CSS, Radix UI primitives, lucide-react icons, custom design tokens (`parchment`, `caramel`, `ink-*`).

### Backend Architecture

- **Framework:** FastAPI ([backend/app/main.py](backend/app/main.py)) — modular monolith. Each analysis is a separate module with `routes.py`, `service.py`, `repository.py`, `schemas.py`.
- **Database:** SQLAlchemy 2 async ORM. SQLite locally, Postgres in production. Schema is managed by **Alembic** ([backend/alembic/versions](backend/alembic/versions/)). On boot, [backend/app/startup.py](backend/app/startup.py) runs `alembic upgrade head` so a fresh DB is self-bootstrapping.
- **Authentication:** PyJWT-issued access + refresh tokens. Refresh tokens are one-shot (rotated on use) and hashed at rest. Passwords are argon2-hashed.
- **Single AI Gateway:** Every model call goes through [backend/app/ai/gateway.py](backend/app/ai/gateway.py) — prompts are loaded by `(name, version)`, schema is enforced via Pydantic, telemetry is recorded for every call.
- **Analysis envelope:** A single `AnalysisEnvelope[T]` shape ([backend/app/schemas/envelope.py](backend/app/schemas/envelope.py)) is returned by every module. The frontend renders the same chrome regardless of analysis kind.

### AI Integration

- **Provider abstraction:** [backend/app/ai/providers/base.py](backend/app/ai/providers/base.py) defines a thin `AIProvider` Protocol. Two implementations ship today:
  - **VertexGeminiProvider** ([vertex_gemini.py](backend/app/ai/providers/vertex_gemini.py)) — production. Uses `google-genai` against Vertex AI with `response_schema` enforcement.
  - **StubProvider** ([stub.py](backend/app/ai/providers/stub.py)) — deterministic envelopes for tests and local dev.
- **Auto-selection:** Setting `AI_PROVIDER=auto` (default in [render.yaml](render.yaml)) picks Vertex when a service-account blob is present, otherwise Stub.
- **Fallback:** If Vertex errors out at the transport layer mid-request, the gateway transparently falls back to Stub so the user sees content instead of a blank failure ([gateway.py](backend/app/ai/gateway.py#L122-L130)).
- **Retry policy:** One schema-validation retry per call; one transport retry with exponential backoff. Timeout is 120s by default.

### Payment Integration

- **Gateway:** Razorpay ([apps/consumer/app/api/payment](apps/consumer/app/api/payment/)) — test mode by default.
- **Flow:** Server creates a Razorpay order → client-side checkout via `checkout.razorpay.com` script → server verifies HMAC SHA-256 signature → upgrades `Subscription.tier` to `BASE` or `PREMIUM`.
- **Gating:** The `/app/layout.tsx` server component redirects users with `tier === "FREE"` to `/payment`.
- **Admin bypass:** A server action [adminBypassAction](apps/consumer/app/payment/actions.ts) upserts a `PREMIUM` subscription without going through Razorpay — for dev/QA testing only.

### Data Flow Between Modules

1. User submits form (or uploads resume) on the consumer app.
2. Server Action calls `patchProfile()` on the backend.
3. The backend's [dependency_map.py](backend/app/orchestration/dependency_map.py) computes which analyses are invalidated by the changed keys.
4. Affected `Analysis` rows are marked `recompute_required = true`.
5. Next time the user visits a module page, `ensureLatestOrRun` ([backend/client.ts](apps/consumer/lib/backend/client.ts)) either returns the cached row or triggers a fresh run.
6. Synthesis always re-runs whenever anything upstream changes, so the dashboard verdict never goes stale.

---

## 3. Technology Stack

### Frontend

| Layer | Choice |
|------|--------|
| Framework | **Next.js 14.2** (App Router, RSC, Server Actions) |
| Language | **TypeScript 5.6** |
| Auth | **NextAuth 5 (Auth.js beta)** with credentials provider + Prisma adapter |
| ORM | **Prisma 5** (SQLite locally; Postgres in prod) |
| Styling | **Tailwind CSS 3.4** + custom design tokens |
| UI primitives | **Radix UI** (avatar, dialog, dropdown, popover, select, tabs, tooltip) |
| Icons | **lucide-react** |
| Forms | **react-hook-form** + **Zod** |
| Payments | **razorpay** (server SDK) + `checkout.razorpay.com` script |
| Notifications | **sonner** |
| Testing | **Playwright** (E2E) — see [apps/consumer/e2e](apps/consumer/e2e/) |

### Backend

| Layer | Choice |
|------|--------|
| Runtime | **Python 3.11** (capped <3.13) |
| Framework | **FastAPI ≥0.115** + **Uvicorn** |
| ORM | **SQLAlchemy 2 (async)** with **asyncpg** (Postgres) / **aiosqlite** (SQLite) |
| Migrations | **Alembic 1.13** |
| Validation | **Pydantic 2.9** + **pydantic-settings** |
| Auth | **argon2-cffi** for password hashing; **PyJWT** for tokens |
| File parsing | **pypdf** (PDF resumes); **python-docx** (Word resumes) |
| HTTP client | **httpx** |
| Retry / backoff | **tenacity** |
| Structured logging | **structlog** |

### AI Integration

| Concern | Tech |
|---------|------|
| Provider | **Google Vertex AI** (Gemini 2.5 Flash + optional Pro tier for reasoning) |
| SDK | **google-genai ≥0.7** (`vertexai=True`) |
| Auth | Service-account JSON (base64-encoded in env), scoped to `cloud-platform` |
| Schema enforcement | `response_mime_type="application/json"` + `response_schema=<pydantic JSONSchema>` |
| Prompt management | Versioned `.md` files in [backend/app/prompts](backend/app/prompts/) loaded by `(name, version)` |
| Telemetry | `AICall` table records model, tokens, latency, cost, success/error per call |
| Fallback | Local **StubProvider** if Vertex transport fails |

### Payment Integration

| Concern | Choice |
|---------|--------|
| Gateway | **Razorpay** (INR-only, test mode in dev) |
| Order creation | Server-side via `razorpay.orders.create` |
| Verification | HMAC SHA-256 signature check (`crypto.timingSafeEqual`) before tier upgrade |
| Plans | Defined statically in [lib/plans.ts](apps/consumer/lib/plans.ts) — Basic ₹999, Pro ₹2,499, Premium ₹4,999 |

### Development Tools

| Concern | Tool |
|---------|------|
| Version control | **Git** |
| Node package manager | **npm** (lockfiles committed per app) |
| Python package manager | **uv** (lock at [backend/uv.lock](backend/uv.lock)) / pip-installable via `pyproject.toml` |
| Python linter | **Ruff** (line-length 100) |
| Python testing | **pytest** + **pytest-asyncio** + **pytest-cov** |
| Frontend linting | **ESLint** (`eslint-config-next`) |
| E2E tests | **Playwright** |
| Hosting blueprint | **Render** ([render.yaml](render.yaml)) |

---

## 4. Project Folder Structure

```
Relocate/
├── apps/                         # Five Next.js portals (monorepo)
│   ├── consumer/                 # Mover-facing app — the only one live in MVP
│   │   ├── app/                  # Next.js App Router routes
│   │   │   ├── (auth)/           # sign-in, sign-up, forgot-password
│   │   │   ├── (public)/         # Marketing pages (compare, pricing, guides…)
│   │   │   ├── api/              # Route handlers
│   │   │   │   ├── auth/         # NextAuth catch-all
│   │   │   │   ├── payment/      # Razorpay create-order + verify-payment
│   │   │   │   └── internal/     # Cross-portal bridges (e.g., relocation)
│   │   │   ├── app/              # Gated dashboard (`/app/*`)
│   │   │   │   ├── _shell.tsx    # Sidebar + topbar shell
│   │   │   │   ├── onboarding/   # Resume → profile → destination → … → visa
│   │   │   │   ├── country/      # Country comparison module page
│   │   │   │   ├── jobs/         # Job-fit module page
│   │   │   │   ├── visa/         # Visa direction module page
│   │   │   │   ├── finance/      # Finance overview + category deep-dives
│   │   │   │   ├── family/       # Family impact
│   │   │   │   ├── documents/    # Document checklist
│   │   │   │   ├── culture/      # Cultural prep
│   │   │   │   ├── timeline/     # Visual relocation timeline
│   │   │   │   ├── workflow/     # Step-by-step workflow
│   │   │   │   ├── synthesis/    # Final verdict
│   │   │   │   └── (others)      # career, country, life, marketplace…
│   │   │   ├── payment/          # Plan-selection page + admin bypass
│   │   │   └── layout.tsx        # Root layout (Tailwind + fonts)
│   │   ├── components/           # app/ shell, shared/, ui/ primitives
│   │   ├── lib/
│   │   │   ├── backend/          # Typed FastAPI client + session bridge
│   │   │   ├── public-data/      # Static seeds (countries, guides)
│   │   │   ├── plans.ts          # Razorpay plans config
│   │   │   ├── workflow.ts       # Workflow ordering & completion logic
│   │   │   └── db.ts             # Prisma client singleton
│   │   ├── prisma/               # User, Subscription, BackendSession, Relocation
│   │   ├── e2e/                  # Playwright full-flow.spec.ts
│   │   ├── auth.ts / auth.config.ts
│   │   └── middleware.ts         # NextAuth route guard
│   ├── admin/                    # Future admin/ops console (scaffolded)
│   ├── corporate/                # Future corporate HR mobility portal
│   ├── employer/                 # Future employer/ATS portal
│   └── partner/                  # Future marketplace partner portal
│
├── backend/                      # FastAPI single-process backend
│   ├── app/
│   │   ├── main.py               # FastAPI factory + router wiring
│   │   ├── config.py             # Pydantic settings (env-driven)
│   │   ├── deps.py               # current_user dependency, db session
│   │   ├── startup.py            # Boot bootstrap (runs alembic upgrade head)
│   │   ├── logging_setup.py      # File-logger install
│   │   ├── observability.py      # Structured logging helpers
│   │   ├── schemas/              # AnalysisEnvelope, Profile, Case
│   │   ├── storage/              # SQLAlchemy engine, ORM models, file storage
│   │   ├── middleware/           # Error handler
│   │   ├── orchestration/        # State machine, dependency map
│   │   ├── ai/                   # Gateway, providers, prompt loader, telemetry
│   │   ├── prompts/              # Versioned prompt .md files
│   │   └── modules/              # One package per analysis kind
│   │       ├── auth/             # Register, login, refresh, logout
│   │       ├── profile/          # Profile CRUD + merge logic
│   │       ├── case/             # Active case, state transitions
│   │       ├── resume/           # Upload, parse (PDF/DOCX), auto-fill
│   │       ├── country_comparison/   # Ranked country pick + shortlist
│   │       ├── job_fit/          # Career-fit conviction read
│   │       ├── visa/             # Visa direction recommendation
│   │       ├── family/           # Family/relocation impact
│   │       ├── finance/          # Finance feasibility
│   │       ├── finance_category/ # Housing/utilities/food/transport/healthcare
│   │       ├── documents/        # Document checklist
│   │       ├── workflow/         # Step-by-step relocation workflow
│   │       ├── culture/          # Cultural prep
│   │       ├── timeline/         # Visual timeline
│   │       └── synthesis/        # Final verdict (with SSE streaming)
│   ├── alembic/                  # Database migrations
│   ├── tests/
│   │   ├── unit/                 # Schema + logic tests
│   │   ├── integration/          # Full DB + API flow tests
│   │   ├── live/                 # Live Vertex smoke tests (opt-in)
│   │   └── fixtures/             # Test fixtures
│   ├── scripts/                  # live_vertex_smoke.py
│   ├── pyproject.toml            # Python deps + Ruff/pytest config
│   └── glimmora.db               # SQLite dev DB (gitignored)
│
├── docs/                         # HTML handbooks shipped with the repo
│   ├── glimmora-relocate-architecture.html
│   ├── glimmora-relocate-handbook.html
│   ├── glimmora-relocate-tech-stack.html
│   ├── glimmora-relocate-portal-flows.html
│   ├── glimmora-relocate-mapping.html
│   └── glimmora-relocate-demo.html
│
├── BACKEND_PLAN.md               # Source-of-truth backend MVP plan
├── DEMO_BRIEF.md
├── FRONTEND_QA_WALKTHROUGH.md
├── FRONTEND_RESTRUCTURE_REPORT.md
├── MIGRATION_DOCUMENT_REFERENCE.md
└── render.yaml                   # Render Blueprint (backend + consumer + Postgres x2)
```

---

## 5. Core Modules Explanation

Every analysis module follows the same shape on the backend: `routes.py` (HTTP), `service.py` (business logic + AI gateway call), `repository.py` (DB), `schemas.py` (Pydantic I/O contracts). The HTTP contract per module is:

- `POST /api/v1/case/{case_id}/{kind}/run` — run or cache-hit.
- `GET  /api/v1/case/{case_id}/{kind}` — latest current row.
- `GET  /api/v1/case/{case_id}/{kind}/history` — version history.

### Authentication

- **What it does:** Email + password registration; argon2-hashed passwords; JWT access tokens (30-min default) and one-shot rotating refresh tokens (7-day default).
- **Inputs:** `email`, `password`, optional `name`.
- **Outputs:** `{ user, case_id, tokens: { access_token, refresh_token, expires_at } }`.
- **Notable behaviour:** On register, the system also creates an empty `UserProfile` and an initial `RelocationCase` in `draft` state ([auth/service.py](backend/app/modules/auth/service.py)).

### User Profile

- **What it does:** Stores the unified profile used as input for every downstream analysis — identity, career, destination, finance, family, document status, readiness.
- **Inputs:** `PATCH /api/v1/profile` with any subset of profile fields.
- **Outputs:** Updated profile + `impacted_modules` (which analyses are now stale) + `changed_keys`.
- **Notable behaviour:** Profile merges respect a `field_sources` map so the UI can highlight which fields came from the resume vs. manual entry.

### Case

- **What it does:** A `RelocationCase` is the unit of analysis. It carries an `inputs_revision` counter that bumps on every profile change, and a `state` (`draft` → `analyses_running` → `ready`).
- **Inputs:** `GET /api/v1/case/active` (auto-creates if missing); `POST /api/v1/case/{case_id}/transition`.
- **Outputs:** `CaseOut` summary (id, state, revision).

### Resume

- **What it does:** Accepts PDF/DOCX uploads, extracts raw text ([parser.py](backend/app/modules/resume/parser.py)), then sends it through the AI gateway ([extractor.py](backend/app/modules/resume/extractor.py)) to produce structured fields. Apply step merges extracted fields into the profile.
- **Inputs:** `POST /api/v1/resume/upload` (multipart); `POST /api/v1/resume/{parse_id}/apply`.
- **Outputs:** Parse id, status, extracted JSON, then `{ profile_completion, fields_filled_from_resume, field_sources }`.

### Country Analysis (`country_comparison`)

- **What it does:** AI-ranks the user's target country (+ alternatives) on multi-dimensional axes. Also exposes a deterministic **shortlist** endpoint (no AI cost) that re-scores under user-tunable weight sliders.
- **Inputs:** Implicit — case + profile snapshot. Shortlist takes `ShortlistRequest` (weights).
- **Outputs:** `AnalysisEnvelope[CountryComparisonDetail]` with per-country breakdowns, drivers, risks.

### Job Fit (`jobfit`)

- **What it does:** Reads the user's resume + target role + destination job market and produces a "conviction read" with key drivers and signal tags.
- **Outputs:** `AnalysisEnvelope[JobFitDetail]` — fit score, market read, pathways.

### Visa Assessment (`visa`)

- **What it does:** Recommends the best-fit visa route (e.g., EU Blue Card, H-1B sponsorship transfer, Skilled Worker) based on nationality, current visa, sponsorship needs, and target country. Required confirmation section.
- **Outputs:** `AnalysisEnvelope[VisaDirectionDetail]` — route, eligibility checklist, timeline.

### Finance Evaluation (`finance` + `finance_category`)

- **What it does:** The `finance` module is the headline feasibility verdict (runway, salary gap, monthly burn). The `finance_category` module is a **deep dive** for each of: `housing`, `utilities`, `food`, `transport`, `healthcare`, run on demand from the category page.
- **Inputs:** Profile finance fields (`current_salary`, `expected_salary`, `salary_currency`, `relocation_budget`, `monthly_budget`, `savings`, `rent_expectation`, `cost_sensitivity`).
- **Outputs:** `AnalysisEnvelope[FinanceDetail]` + per-category `FinanceCategoryDetail`.

### Documents (`documents`)

- **What it does:** Generates a personalised document checklist (passport, visa appendices, tax forms, school transcripts…) keyed to the user's nationality, destination, and family makeup.
- **Outputs:** `AnalysisEnvelope[DocumentChecklistDetail]` with status per item.

### Family Consideration (`family`)

- **What it does:** Family-impact scoring — spouse work rights, school options, parent care logistics, dependents' visa side-effects.
- **Outputs:** `AnalysisEnvelope[FamilyImpactDetail]`.

### Culture Analysis (`culture`)

- **What it does:** Workplace norms, daily-life patterns, language confidence assessment, phrase flashcards.
- **Outputs:** `AnalysisEnvelope[CultureDetail]`.

### Workflow & Timeline

- **`workflow`** — sequenced step list (apply visa → secure housing → notify employer → ship belongings → flight → onboard).
- **`timeline`** — visual relocation timeline plotted against the move-urgency window.

### Final Synthesis (`synthesis`)

- **What it does:** Pulls all upstream analyses into a single ranked verdict with confidence, runway, and a one-paragraph rationale. Also exposes an **SSE stream** (`POST /run/stream`) so the dashboard can render progress events while the model writes.
- **Inputs:** `SynthesisInputs` (typically empty — synthesis reads everything from prior analyses).
- **Outputs:** `AnalysisEnvelope[SynthesisDetail]`.

---

## 6. AI-Powered Features

### What runs on AI

All nine analysis modules + resume extraction are produced by the same AI gateway. Concretely:

| Surface | AI? | Prompt file |
|---------|-----|-------------|
| Resume extraction | ✅ | [resume_extraction.v2.md](backend/app/prompts/resume_extraction.v2.md) |
| Country comparison | ✅ | [country_comparison.v1.md](backend/app/prompts/country_comparison.v1.md) |
| Country **shortlist** | ❌ deterministic | (no prompt — weight-driven scoring in `shortlist_service.py`) |
| Job fit | ✅ | [job_fit.v3.md](backend/app/prompts/job_fit.v3.md) |
| Visa direction | ✅ | [visa_direction.v1.md](backend/app/prompts/visa_direction.v1.md) |
| Family | ✅ | [family_relocation.v1.md](backend/app/prompts/family_relocation.v1.md) |
| Finance overview | ✅ | [finance.v1.md](backend/app/prompts/finance.v1.md) |
| Finance category | ✅ | [finance_category.v1.md](backend/app/prompts/finance_category.v1.md) |
| Documents | ✅ | [documents.v1.md](backend/app/prompts/documents.v1.md) |
| Workflow | ✅ | [workflow.v1.md](backend/app/prompts/workflow.v1.md) |
| Culture | ✅ | [culture.v1.md](backend/app/prompts/culture.v1.md) |
| Timeline | ✅ | [timeline.v1.md](backend/app/prompts/timeline.v1.md) |
| Synthesis | ✅ (reasoning tier) | [synthesis.v1.md](backend/app/prompts/synthesis.v1.md) |

### How an AI call works

1. Service builds a `GenerationRequest(kind, prompt_name, prompt_version, schema, system, user, …)`.
2. Gateway resolves the model from `model_tier` (`DEFAULT` → `GEMINI_MODEL`; `REASONING` → `GEMINI_MODEL_PRO`).
3. Gateway loads the prompt file and concatenates it with the call-site system message.
4. Pydantic JSON-Schema is generated from the response model and sent to Vertex as `response_schema`.
5. Vertex returns JSON; gateway `json.loads` + `schema.model_validate`.
6. On validation failure: one retry with a `[Validator]: …` feedback prefix listing the errors verbatim.
7. On transport failure (Vertex 5xx, network): falls back to `StubProvider` so the user never sees a blank failure.
8. Telemetry recorded (model, prompt_version, tokens, latency, success/error).

### Caching & freshness

The `Analysis` table has a unique constraint on `(case_id, kind, input_hash)`. Re-running the same module with the same inputs is a cache hit; if `inputs_revision` changed for a key that maps to the module (per [dependency_map.py](backend/app/orchestration/dependency_map.py)), the row is marked `recompute_required` and a fresh call is made on next read.

### Transparency contract

Every envelope MUST include:

- `confidence` (0.0 – 1.0).
- `assumptions[]` — at least one entry, each tagged `inferred | default | user | model`.
- `risks[]` and `next_actions[]` with severity / urgency.
- `metadata.model`, `metadata.prompt_version`, `metadata.tokens_in/out`, `metadata.latency_ms`.

`assumptions` is enforced at the schema level — an empty list raises a validation error.

---

## 7. Payment Workflow

### Plans

Three one-time plans defined in [apps/consumer/lib/plans.ts](apps/consumer/lib/plans.ts):

| Id | Price (INR) | Tier mapped to `Subscription.tier` |
|----|-------------|------------------------------------|
| `basic` | ₹999 | `BASE` |
| `pro` | ₹2,499 | `PREMIUM` (recommended) |
| `premium` | ₹4,999 | `PREMIUM` |

### Step-by-step Flow

**1. Login / register** — NextAuth credentials provider, bcrypt-verified, JWT session strategy. Auth routes live at [/sign-in](apps/consumer/app/\(auth\)/sign-in/), [/sign-up](apps/consumer/app/\(auth\)/sign-up/).

**2. Payment-gate redirect** — `apps/consumer/app/app/layout.tsx` reads the user's `subscription.tier`. If missing or `FREE`, redirects to `/payment`.

**3. Payment page** ([apps/consumer/app/payment/page.tsx](apps/consumer/app/payment/page.tsx)) — server component fetches user, passes `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `<PaymentClient>`.

**4. Plan selection** — user clicks "Pay now" on a card; client posts to `/api/payment/create-order`.

**5. Order creation** ([create-order/route.ts](apps/consumer/app/api/payment/create-order/route.ts)):
```
POST /api/payment/create-order
Body: { planId: "basic" | "pro" | "premium" }
→ Razorpay orders.create({ amount: priceInr * 100, currency: "INR", … })
→ { orderId, amount, currency, planId, planName }
```

**6. Razorpay checkout** — client loads `https://checkout.razorpay.com/v1/checkout.js`, instantiates `new window.Razorpay(options)` with the returned `order_id`, opens the modal.

**7. Payment verification** ([verify-payment/route.ts](apps/consumer/app/api/payment/verify-payment/route.ts)):
```
POST /api/payment/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
→ Expected = HMAC_SHA256(`${order_id}|${payment_id}`, RAZORPAY_KEY_SECRET)
→ crypto.timingSafeEqual(receivedSig, expectedSig)
→ prisma.subscription.upsert({ tier: plan.subscriptionTier, status: "active" })
```

**8. Post-success redirect** — `router.push("/app"); router.refresh();` — user lands on the dashboard, payment gate now passes.

### Admin Bypass (Dev/QA)

A second button on `/payment` invokes the server action [adminBypassAction](apps/consumer/app/payment/actions.ts):

```ts
prisma.subscription.upsert({
  where: { userId },
  create: { userId, tier: "PREMIUM", status: "active" },
  update: { tier: "PREMIUM", status: "active" },
});
```

No Razorpay round-trip — used to test the post-payment flow. The button is permanently visible in the UI (gated by environment / build flag is a future improvement; see §15).

### Security Notes

- Razorpay secret never leaves the server (`RAZORPAY_KEY_SECRET`).
- Signature comparison is `crypto.timingSafeEqual` — constant-time.
- Order creation is authenticated; an attacker cannot mint orders for another user.

---

## 8. Application User Flow

```
┌────────────────┐    ┌───────────┐    ┌─────────┐    ┌──────────┐
│ /sign-up       │ →  │ /sign-in  │ →  │ /payment│ →  │ /app     │
│ (NextAuth)     │    │ (creds)   │    │ (Razor) │    │ Dashboard│
└────────────────┘    └───────────┘    └─────────┘    └────┬─────┘
                                                            │
                          ┌─────────────────────────────────┘
                          ▼
                  /app/onboarding/* (intent → resume → profile →
                                   destination → goal → jobs →
                                   visa → family → budget)
                          │
                          ▼
                  Module pages, each backed by a backend run:
                  /app/country → /app/jobs → /app/visa →
                  /app/finance → /app/documents → /app/family →
                  /app/culture → /app/workflow → /app/timeline
                          │
                          ▼
                  /app/synthesis  ← final verdict (SSE-streamed)
```

### Step-by-step

1. **Account creation** — `/sign-up`. NextAuth `credentials` provider, bcrypt password hash, `Subscription.tier` defaults to `FREE`. Behind the scenes, [ensureBackendSession](apps/consumer/lib/backend/session.ts) lazily registers the user on the FastAPI backend with a random `backendPassword` and stores a `BackendSession` row.

2. **Login** — `/sign-in`. NextAuth signs the user in; `authConfig.callbacks.authorized` redirects to `/app` if already signed in.

3. **Payment verification gate** — `/app/layout.tsx` checks `user.subscription.tier !== "FREE"`. Unpaid users bounce to `/payment` until they pay or use admin bypass.

4. **Module completion flow** — the sidebar tracks completion of: Dashboard → Resume → Profile → Country → Jobs → Visa → Finance → Documents → Family → Culture ([lib/workflow.ts](apps/consumer/lib/workflow.ts)). Each module page calls `*.ensure(caseId)` which is "return cached row if fresh, otherwise run and cache."

5. **Dashboard journey** — `/app` is the launch surface. Sidebar shows step ticks; `firstIncompleteStep()` powers the Continue/Next button.

6. **Final synthesis generation** — `/app/synthesis` calls `synthesis.ensure(caseId)`; the page can subscribe to `POST /synthesis/run/stream` (SSE) to surface progress (`progress`, `result`, `error` events).

7. **Re-edit loop** — any `PATCH /api/v1/profile` returns `impacted_modules`; the frontend can mark those analyses stale and surface a "regenerate" hint on the dashboard.

---

## 9. APIs and Integrations

### Authentication Method

- **Frontend ↔ Backend:** `Authorization: Bearer <access_token>` injected by [backend client](apps/consumer/lib/backend/client.ts). On 401, the client forces a refresh-or-relogin via [ensureBackendSession](apps/consumer/lib/backend/session.ts).
- **Consumer ↔ Consumer DB:** NextAuth JWT cookie.

### Backend REST Endpoints

All paths are prefixed with the backend URL (`GLIMMORA_BACKEND_URL`). All bodies are JSON unless noted.

#### Auth — `/api/v1/auth`
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/register` | `{ email, password, name? }` | `{ user, case_id, tokens }` |
| POST | `/login` | `{ email, password }` | `{ user, case_id, tokens }` |
| POST | `/refresh` | `{ refresh_token }` | `{ tokens }` |
| POST | `/logout` | `{ refresh_token? }` | 204 |
| GET | `/me` | — | `{ id, email, name }` |

#### Profile — `/api/v1/profile`
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/` | — | `{ profile, field_sources, completion_percentage, required_missing }` |
| PATCH | `/` | Partial profile | `{ profile, impacted_modules, changed_keys }` |

#### Case — `/api/v1/case`
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/active` | — | `CaseOut` |
| GET | `/{case_id}` | — | `CaseOut` |
| POST | `/{case_id}/transition` | `{ target_state }` | `CaseOut` |

#### Resume — `/api/v1/resume`
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/upload` | multipart `file` | `{ parse_id, status, extracted? }` |
| GET | `/{parse_id}` | — | parse status |
| POST | `/{parse_id}/apply` | — | `{ profile_completion, fields_filled_from_resume, field_sources }` |

#### Analysis Modules — `/api/v1/case/{case_id}/{kind}`

`{kind}` ∈ `country-comparison · job-fit · visa · family · finance · documents · workflow · culture · timeline · synthesis`.

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/run` | Module-specific inputs (often `{}`) | `ModuleResponse<TDetail>` (envelope) |
| GET | `/` | — | latest `ModuleResponse<TDetail>` |
| GET | `/history` | — | `{ items, count }` |

**Plus:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/country-comparison/shortlist` | Deterministic multi-country re-score (no AI) |
| GET | `/finance/category/{category}` | Latest finance-category deep-dive (`housing` etc.) |
| POST | `/finance/category/{category}/run` | Run a finance-category deep-dive |
| POST | `/synthesis/run/stream` | SSE stream of `progress`, `result`, `error` events |

#### Health / Meta
| Method | Path | Response |
|--------|------|----------|
| GET | `/healthz` | `{ status: "ok" }` |

### Standard Envelope Response Shape

```jsonc
{
  "status": "ready",            // generating | ready | failed
  "score": 78,                  // 0–100, optional
  "summary": "…",               // 1-line headline
  "reasoning": "…",             // multi-paragraph rationale
  "risks": [{ "severity": "medium", "label": "…", "detail": "…" }],
  "next_actions": [{ "label": "…", "urgency": "…", "why": "…" }],
  "confidence": 0.82,
  "assumptions": [{ "label": "…", "source": "inferred", "confidence": 0.7 }],
  "detail": { /* module-specific typed payload */ },
  "analysis_version": 3,
  "stale": false,
  "recompute_required": false,
  "stale_reason": null,
  "input_hash": "…",
  "metadata": {
    "generated_at": "2026-05-12T…Z",
    "model": "gemini-2.5-flash",
    "prompt_version": "v1",
    "tokens_in": 1840,
    "tokens_out": 540,
    "latency_ms": 7800
  }
}
```

### Consumer-Side API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/payment/create-order` | Create a Razorpay order for the chosen plan |
| POST | `/api/payment/verify-payment` | Verify HMAC, upgrade `Subscription.tier` |
| `*` | `/api/auth/[...nextauth]` | NextAuth route handler |
| POST | `/api/internal/relocation` | Cross-portal bridge (employer → consumer) |

### External Integrations

| Provider | Used by | Purpose |
|----------|--------|---------|
| **Google Vertex AI** | backend | LLM inference (Gemini 2.5 Flash + optional Pro) |
| **Razorpay** | consumer | Payment processing (test mode by default) |
| **Render** | both | Hosting / Postgres (`render.yaml`) |
| **Google Cloud IAM** | backend | Service-account auth for Vertex |

---

## 10. Environment Configuration

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|:---:|---------|-------------|
| `ENV` | no | `development` | `development \| test \| staging \| production` |
| `DEBUG` | no | `false` | Enables verbose tracebacks |
| `LOG_LEVEL` | no | `INFO` | Python logging level |
| `APP_PORT` | no | `8000` | uvicorn port |
| `DATABASE_URL` | **yes** | `sqlite:///glimmora.db` | Postgres URL in prod (auto-normalised to `postgresql+asyncpg://`) |
| `JWT_SECRET` | **yes** | — | ≥32-char secret for access tokens |
| `ALGORITHM` | no | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | `30` | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | no | `7` | Refresh-token lifetime |
| `RESUME_STORAGE_BACKEND` | no | `local` | `local \| gcs` |
| `RESUME_STORAGE_LOCAL_DIR` | no | `./.local-storage/resumes` | Filesystem dir for local mode |
| `RESUME_STORAGE_GCS_BUCKET` | no | `glimmora-resumes-dev` | Bucket name when `gcs` |
| `RESUME_MAX_BYTES` | no | `10485760` | 10 MiB resume cap |
| `AI_PROVIDER` | no | `auto` | `auto \| stub \| vertex` |
| `GCP_SERVICE_ACCOUNT_JSON_B64` | **yes if vertex** | — | Base64-encoded service-account JSON |
| `GCP_PROJECT` | no | derived | Auto-derived from the SA blob if absent |
| `GCP_LOCATION` | no | `us-central1` | Vertex region |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | Default model id |
| `GEMINI_MODEL_PRO` | no | — | Override for the reasoning tier (synthesis, visa) |
| `LLM_MAX_RETRIES` | no | `1` | Transport retries on transient errors |
| `LLM_INITIAL_BACKOFF` | no | `1.0` | Seconds, exponential backoff base |
| `LLM_REQUEST_TIMEOUT_S` | no | `120.0` | Per-call timeout |

### Consumer (`apps/consumer/.env`)

| Variable | Required | Description |
|----------|:---:|-------------|
| `DATABASE_URL` | **yes** | Prisma DB URL — `file:./dev.db` locally, Postgres in prod |
| `AUTH_SECRET` | **yes** | NextAuth signing secret (≥32 chars) |
| `AUTH_TRUST_HOST` | prod-only | `"true"` when running behind a proxy |
| `GLIMMORA_BACKEND_URL` | **yes** | Full URL of the FastAPI backend (e.g., `https://glimmora-backend.onrender.com`) |
| `RAZORPAY_KEY_ID` | for payments | Razorpay key id (server-side) |
| `RAZORPAY_KEY_SECRET` | for payments | Razorpay key secret (server-side) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | for payments | Same key id, exposed to the client for checkout |
| `NODE_ENV` | no | `development \| production` |

### Example `.env` (backend)

```ini
ENV=development
LOG_LEVEL=INFO
DATABASE_URL=sqlite:///glimmora.db
JWT_SECRET=replace-with-32-plus-chars-of-randomness
AI_PROVIDER=auto
GCP_SERVICE_ACCOUNT_JSON_B64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...
GEMINI_MODEL=gemini-2.5-flash
```

### Example `.env` (consumer)

```ini
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-32-plus-chars-of-randomness"
GLIMMORA_BACKEND_URL="http://localhost:8000"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
```

---

## 11. Setup Instructions (For Developers)

### Prerequisites

- **Python ≥ 3.11, < 3.13**
- **Node.js ≥ 20** + **npm**
- **Git**
- A **Google Cloud project** with **Vertex AI** enabled and a service-account JSON with `Vertex AI User` (`roles/aiplatform.user`). Optional for local dev — Stub provider works without it.
- A **Razorpay test account** (https://dashboard.razorpay.com) — optional, the admin bypass works without it.

### 1. Clone

```bash
git clone <repo-url> Relocate
cd Relocate
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -e ".[dev]"

# Copy and edit the env file:
cp .env.example .env       # if present; otherwise create from §10
#   At minimum, set JWT_SECRET. Set GCP_SERVICE_ACCOUNT_JSON_B64 to use Vertex.

# Run migrations (also runs on app boot, but useful locally):
alembic upgrade head

# Run:
uvicorn app.main:app --reload --port 8000

# Quick health check:
#   curl http://localhost:8000/healthz  →  {"status":"ok"}
```

### 3. Consumer setup

```bash
cd ../apps/consumer
npm ci

# Create .env from §10 — at minimum:
#   DATABASE_URL="file:./dev.db"
#   AUTH_SECRET="<32+ chars>"
#   GLIMMORA_BACKEND_URL="http://localhost:8000"

npx prisma generate
npx prisma db push   # creates the SQLite schema
# Optional seed:
# npm run db:seed

npm run dev   # http://localhost:3000
```

### 4. (Optional) Other portals

The admin, corporate, employer, and partner apps follow the same pattern:

```bash
cd apps/<portal>
npm ci
npx prisma generate && npx prisma db push
npm run dev    # admin uses port 3003
```

These portals are **not part of the MVP** — they are scaffolded for future phases and not deployed by [render.yaml](render.yaml).

### 5. Verify locally

1. Open http://localhost:3000.
2. Sign up at `/sign-up`.
3. Get redirected to `/payment`.
4. Click **"Login as Admin (Free)"** to grant a `PREMIUM` subscription.
5. Land on `/app` (the dashboard). The sidebar tracks completion; click through the workflow.

---

## 12. Deployment Guide

### Hosted Stack (Render Blueprint)

[render.yaml](render.yaml) declares two web services and two free Postgres databases.

| Service | Type | Plan | Build | Start |
|---------|------|------|-------|-------|
| `glimmora-backend` | Python | starter | `pip install -r requirements.txt` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| `glimmora-consumer` | Node | starter | `npm ci && npm run build` | `npm run start` |

Both services run their own schema bootstrap on boot:

- Backend: [startup.py](backend/app/startup.py) runs `alembic upgrade head`.
- Consumer: `npm run start` invokes `prisma db push --accept-data-loss --skip-generate && next start`.

### Steps to Deploy on Render

1. Push the repo to GitHub.
2. In the Render dashboard, click **New → Blueprint** and select the repo.
3. Render reads [render.yaml](render.yaml) and provisions:
   - `glimmora-backend-db` (Postgres, free)
   - `glimmora-consumer-db` (Postgres, free)
   - `glimmora-backend` (web)
   - `glimmora-consumer` (web)
4. Fill in **secrets** (marked `sync: false` in the blueprint):
   - **Backend:** `JWT_SECRET`, `GCP_SERVICE_ACCOUNT_JSON_B64`, optional `GCP_PROJECT`.
   - **Consumer:** `AUTH_SECRET`, plus `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` (not in the blueprint — add manually).
5. `DATABASE_URL` wires automatically from each Postgres instance.
6. `GLIMMORA_BACKEND_URL` is wired by Render from `fromService.hostport`.
7. First deploy will run migrations + Prisma push automatically.

### Manual / VPS Deployment

**Backend (production):**
```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```
Front the process with Nginx / Caddy and TLS. Set all env vars from §10.

**Consumer (production):**
```bash
npm ci
npm run build   # runs `prisma generate && next build`
npm run start   # also runs `prisma db push`
```
Reverse-proxy with TLS. Set `AUTH_TRUST_HOST=true` if behind a proxy.

### Post-deploy Checks

1. Hit `/healthz` on the backend → `{ "status": "ok" }`.
2. Hit the consumer URL, sign up, get redirected to `/payment`.
3. Test the admin bypass to confirm DB writes are working.
4. Trigger one module run from the dashboard; check Vertex telemetry in `ai_calls` table.

### Rollback

- Backend: redeploy the previous commit; Alembic migrations are forward-compatible for the listed versions, but downgrades are NOT covered automatically.
- Consumer: redeploy the previous commit. `prisma db push` is forward-only — destructive schema changes need manual rollback.

---

## 13. Testing Guidelines

### Backend Tests

```bash
cd backend
pytest -q                              # full suite
pytest tests/unit -q                   # fast, no DB
pytest tests/integration -q            # spins up SQLite per test
pytest tests/integration/test_e2e_pipeline.py -v
```

Notable suites:

| Suite | What it covers |
|------|----------------|
| `tests/unit/test_ai_gateway.py` | Gateway retry / schema validation |
| `tests/unit/test_envelope.py` | Envelope contracts, truncation, assumptions enforcement |
| `tests/unit/test_dependency_map.py` | Invalidation logic per profile change |
| `tests/unit/test_state_machine.py` | Case transitions |
| `tests/integration/test_auth_flow.py` | Register/login/refresh/logout |
| `tests/integration/test_resume_flow.py` | Upload → parse → apply |
| `tests/integration/test_e2e_pipeline.py` | Full 9-module run end-to-end |
| `tests/integration/test_*_flow.py` | Per-module flows |
| `tests/integration/test_vertex_fallback_semantics.py` | Stub fallback on transport failure |
| `tests/integration/test_env_failfast.py` | Missing secrets crash on boot |
| `tests/live/` | Opt-in live Vertex smoke tests (require GCP creds) |

### Frontend Tests

```bash
cd apps/consumer
npx playwright install         # one-time
npx playwright test            # runs e2e/full-flow.spec.ts
```

[full-flow.spec.ts](apps/consumer/e2e/full-flow.spec.ts) covers the happy-path sign-up → payment bypass → dashboard → module pages walkthrough.

### Manual QA Checklist

#### 1. Account creation
- [ ] `/sign-up` accepts a fresh email + password.
- [ ] Duplicate email returns a clear inline error.
- [ ] Successful signup redirects to `/payment`.
- [ ] After signup, the consumer DB has a `User` row + `BackendSession` row.

#### 2. Authentication
- [ ] `/sign-in` accepts valid credentials.
- [ ] Wrong password returns a clear inline error.
- [ ] Logged-in user visiting `/sign-in` is redirected to `/app`.
- [ ] Logged-out user visiting `/app/*` is redirected to `/sign-in`.

#### 3. Payment flow
- [ ] Unpaid user visiting `/app/*` is redirected to `/payment`.
- [ ] Razorpay checkout opens for each of the three plans.
- [ ] Test-mode card (`4111 1111 1111 1111`, any future expiry, any CVV) completes the order.
- [ ] On success, `Subscription.tier` flips to `BASE` (basic) or `PREMIUM` (pro/premium).
- [ ] User lands on `/app` after success.
- [ ] Signature mismatch returns 400 from `/api/payment/verify-payment`.

#### 4. Admin bypass
- [ ] **"Login as Admin (Free)"** button on `/payment` instantly grants `PREMIUM`.
- [ ] User is redirected to `/app`.
- [ ] No Razorpay API call is made.

#### 5. Module completion
- [ ] Sidebar ticks update after each module completes.
- [ ] "Continue" button on the dashboard points to the first incomplete step.
- [ ] Re-editing a profile field (e.g., `target_country`) marks downstream modules `recompute_required`.
- [ ] The dashboard `synthesis` re-runs when ANY upstream module changes.

#### 6. AI response validation
- [ ] Every module page surfaces a `score`, `summary`, `reasoning`, `risks`, `next_actions`, and `assumptions`.
- [ ] Missing-input cases return a `failed` envelope (rendered as `FailedEnvelopeView`) — not a raw error overlay.
- [ ] When Vertex is unreachable / errors, the page still renders with stubbed content (verify via [test_vertex_fallback_semantics.py](backend/tests/integration/test_vertex_fallback_semantics.py)).
- [ ] `assumptions` list is non-empty on every envelope.
- [ ] `metadata.tokens_in/out` and `metadata.latency_ms` are populated when the real provider is used.

#### 7. Synthesis SSE
- [ ] Visit `/app/synthesis`. Watch for `progress` events ramping to 100, then a `result` event with the final envelope.
- [ ] Close the tab mid-stream — server-side does not crash (verify in backend logs).

---

## 14. Known Limitations or Risks

| Area | Risk |
|------|------|
| **AI dependency** | Every module depends on Vertex Gemini. A regional Vertex outage degrades the system to **deterministic stub responses** (still renders, but content is generic). |
| **Model drift / schema breakage** | A future Gemini model could silently change output style; the gateway's one schema-retry plus Stub fallback mitigates but does not eliminate this. |
| **Razorpay test-mode-only** | The codebase is wired for INR / Razorpay test keys. Switching to live requires KYB completion at Razorpay and rotating keys in env. There is **no webhook handler** — refunds, disputes, and async settlement are not captured. |
| **Admin bypass in production** | The "Login as Admin (Free)" button is **always rendered** today. It must be feature-flagged off (or removed entirely) before any production launch. |
| **Stripe fields in schema, unused** | `Subscription` has `stripeCustomerId / stripeSubscriptionId / stripePriceId` columns but no Stripe integration. Either remove or wire up before billing on Stripe. |
| **No background workers** | All module runs happen in the request thread. A slow synthesis call (25–30s typical) ties up a uvicorn worker. Scale by adding workers or moving to Celery/RQ. |
| **SQLite locally vs. Postgres prod** | Datetime/UUID handling is portable but slight semantic differences (e.g., timezone-aware comparisons) caused real bugs; fully tested in `tests/integration` against SQLite but a Postgres smoke pass is recommended pre-release. |
| **`prisma db push --accept-data-loss`** | The consumer start command pushes schema changes destructively. A migration framework (`prisma migrate deploy`) should replace it before storing real user data. |
| **Single AI provider** | No real fallback model. The Stub fallback masks outages but doesn't preserve quality. Consider plumbing Claude or a second Vertex region. |
| **No rate limiting / abuse protection** | `/api/v1/*` is open with only Bearer auth; a malicious user could exhaust Vertex tokens. |
| **PII handling** | Resume blobs are stored on local disk (or GCS) without encryption-at-rest configuration. Review before EU launch. |
| **Cross-portal apps unbuilt** | Admin/employer/partner/corporate portals exist as UI scaffolds; back-end is **not wired**. Do not ship them as features. |

---

## 15. Future Improvements

### Performance
- Add a **queue + worker pool** so synthesis and finance-category runs don't block uvicorn workers.
- Cache prompt + system-instruction blobs at gateway init (currently re-read per request from disk).
- Stream every module run (not just synthesis) so the dashboard feels live.
- Use Gemini 2.5 Flash for simple modules; reserve 2.5 Pro for synthesis + visa to manage cost.

### Analytics & Observability
- Forward the `AICall` telemetry rows to a dashboard (Grafana / Looker) — track cost-per-user, latency p95, schema-fail rate per module.
- Surface a "model health" badge on the dashboard so QA knows when fallback was used.
- Add Sentry for FE + BE error capture (today logs are stdout + JSON file).

### Product / Modules
- **Education** module — school matching based on family payload.
- **Healthcare** module — health-system fit (chronic conditions, prescriptions).
- **Tax** module — multi-country tax residence projection.
- **Partner intros** (Premium) — wire the existing partner portal to actually surface vetted partners.
- **Re-run scheduler** — auto-rerun synthesis weekly to capture market drift.

### UI / UX
- Replace the "Login as Admin (Free)" button with a hidden URL-param activation gated by `ENV !== 'production'`.
- Persist progress across SSE reconnects (synthesis interrupts cleanly today, but the UI restarts the bar from 0).
- Inline "what changed" delta when a module is re-run after profile edit.
- Dark mode (token system supports it; pages don't yet branch).

### Engineering
- Move from SQLite-in-prod-on-Render-free to a dedicated managed Postgres tier.
- Replace `prisma db push` with `prisma migrate deploy` for schema integrity.
- Real Razorpay webhook (`/api/payment/webhook`) for refund + dispute capture.
- Add rate limiting on `/api/v1/*` (e.g., 60 req/min per user) to protect Vertex spend.
- Replace ad-hoc CORS `allow_origins=["*"]` ([main.py](backend/app/main.py#L45)) with the consumer origin in production.
- Introduce a second AI provider (Anthropic Claude) and fan out by `model_tier` so a single provider outage no longer collapses to stub.
- Build the four scaffolded portals (admin, employer, partner, corporate) or remove them from the repo to clarify scope.

---

*End of document. For implementation-level context, see [BACKEND_PLAN.md](BACKEND_PLAN.md) and the HTML handbooks in [docs/](docs/).*
