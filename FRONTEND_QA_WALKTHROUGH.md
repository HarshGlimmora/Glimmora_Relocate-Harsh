# Glimmora Relocate — Frontend QA Walkthrough & Runbook

> Single practical guide to: start the project locally → verify backend ↔
> frontend wiring → walk every page in the real backend-driven order →
> identify what's still missing.
>
> **Backend is the source of truth.** The consumer frontend
> (`apps/consumer`) is now wired to the FastAPI backend's
> `/api/v1/case/{case_id}/<module>/run` endpoints. Static / mocked
> analysis pages have been replaced.

---

## 1. How to run locally

### 1.1 One-time setup

```bash
# (1) Backend deps + DB migrations
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .
alembic upgrade head            # creates ./glimmora.db (or whatever DATABASE_URL points at)

# (2) Consumer deps + Prisma + DB push
cd ../apps/consumer
npm install
DATABASE_URL="file:./prisma/dev.db" npx prisma db push --accept-data-loss
```

### 1.2 Required environment variables

**Backend** — `backend/.env` (already committed with sane dev defaults):

```ini
ENV=development
DEBUG=true
JWT_SECRET=<32+ chars>
DATABASE_URL=sqlite:///glimmora.db
AI_PROVIDER=auto                 # auto = vertex if creds present, else stub
GCP_SERVICE_ACCOUNT_JSON_B64=<base64 service-account JSON>
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MODEL_PRO=gemini-2.5-pro
LLM_MAX_RETRIES=1
LLM_INITIAL_BACKOFF=1.0
```

For local dev without burning Gemini quota, override with `AI_PROVIDER=stub` (used by the test suite by default).

**Consumer** — `apps/consumer/.env.local`:

```ini
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="<32+ chars>"
AUTH_URL="http://localhost:3000"
GLIMMORA_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_APP_NAME="Glimmora Relocate"
```

`GLIMMORA_BACKEND_URL` is the only value that controls where the consumer sends its API calls.

### 1.3 Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
# health: curl http://localhost:8000/healthz  →  {"status":"ok"}
```

### 1.4 Start the consumer

```bash
cd apps/consumer
npm run dev
# default: http://localhost:3000
```

If you need a non-default port (e.g. running both consumer + employer apps): `PORT=3010 npm run dev`. Update `AUTH_URL` and `GLIMMORA_BACKEND_URL` accordingly.

### 1.5 Smoke / pipeline tests

```bash
# Backend test suite (stub provider, fast)
cd backend && source .venv/bin/activate && pytest -q

# Backend live Vertex smoke (real Gemini calls; opt-in)
GLIMMORA_LIVE_VERTEX=1 pytest tests/live/ -v
python -m scripts.live_vertex_smoke

# Consumer ↔ backend smoke (calls every module via the consumer's API client)
cd apps/consumer
GLIMMORA_BACKEND_URL=http://localhost:8000 node scripts/test-pipeline.mjs

# Seed a consumer test user (for manual QA)
DATABASE_URL="file:./prisma/dev.db" node scripts/seed-user.mjs you@example.com
```

### 1.6 Resetting state

```bash
# Wipe consumer DB and re-apply schema (clears users, BackendSession, etc.)
DATABASE_URL="file:./prisma/dev.db" npx prisma db push --accept-data-loss --force-reset

# Wipe backend DB
rm -f backend/glimmora.db && cd backend && alembic upgrade head

# Drop just the bridge sessions (rare; if backend was reset but consumer wasn't)
DATABASE_URL="file:./prisma/dev.db" node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{await p.backendSession.deleteMany({});console.log('cleared');process.exit(0);})()"
```

---

## 2. Architecture summary

- **Backend is the product logic.** The FastAPI app under `/backend` owns the `AnalysisEnvelope` contract, the case state machine, the AI gateway, the dependency map, and the freshness/versioning rules. Every analysis lives at `POST /api/v1/case/{case_id}/<module>/run`.
- **Frontend is presentation only.** The consumer Next.js app under `/apps/consumer` reads each module via a typed client (`lib/backend/client.ts`) and renders the envelope through shared primitives (`components/backend/envelope-shell.tsx`). No analysis page contains hardcoded scores, copy, or fallback mocks.
- **Auth is bridged.** Consumer NextAuth users are mirrored 1:1 onto the FastAPI backend the first time they hit any analysis page. Tokens live in a new Prisma model `BackendSession`. See `lib/backend/session.ts`.
- **Pipeline order is enforced.** Every analysis page calls `requirePrereqs()` which redirects to `/app/onboarding/profile?missing=target_country` if the user hasn't completed the profile step yet.

### Live (backend-driven) routes

```
/sign-in, /sign-up, /forgot-password   → NextAuth
/app                                   → backend-driven scoreboard
/app/onboarding/resume                 → POST /api/v1/resume/upload + /apply
/app/onboarding/profile                → GET/PATCH /api/v1/profile
/app/country                           → /case/{id}/country-comparison/run
/app/jobs                              → /case/{id}/job-fit/run
/app/visa                              → /case/{id}/visa/run
/app/family                            → /case/{id}/family/run
/app/finance                           → /case/{id}/finance/run
/app/documents                         → /case/{id}/documents/run
/app/workflow                          → /case/{id}/workflow/run
/app/culture                           → /case/{id}/culture/run
/app/timeline                          → /case/{id}/timeline/run
/app/synthesis                         → /case/{id}/synthesis/run
```

### Legacy / out-of-scope (kept but not part of pipeline)

```
/app/discover, /app/career, /app/plan, /app/life,
/app/marketplace, /app/messages, /app/settings, /app/billing
```

The sidebar groups these under an "Other" section.

### Pipeline order

```
Auth → Resume → Profile → Country → Jobs → Visa → Family →
       Finance → Documents → Workflow → Culture → Timeline → Synthesis
```

---

## 3. Page-by-page walkthrough

Each section names the page, says what to do, what to expect, and what would be a red flag.

### 3.1 Sign-up — `/sign-up`

- **Purpose.** Create a consumer account.
- **What to do.** Enter email + password + name. Submit.
- **Backend call.** `POST /api/v1/auth/register` is **not** triggered here. The consumer creates the row via Prisma + NextAuth and the backend bridge fires lazily on the first page-load that needs an analysis.
- **Expected output.** Auto-signed-in, redirected to `/app`.
- **Correct.** Cookie set (`authjs.session-token`); `/app` reachable on refresh.
- **Red flags.** 500 with raw Prisma error; duplicate-email leaks the underlying SQL message.
- **USP.** Frictionless start.

### 3.2 Sign-in — `/sign-in`

- **Purpose.** Returning user authentication.
- **What to do.** Enter the credentials used at sign-up.
- **Expected.** Redirect to `/app`. Backend session in `BackendSession` table (created lazily on first page hit).
- **Red flags.** Wrong-password leaks "user not found" vs "wrong password" (information disclosure).

### 3.3 Resume upload — `/app/onboarding/resume`

- **Purpose.** Lift skills/role/years/seniority off a PDF or DOCX so the user doesn't fill them by hand.
- **What to do.** Pick a file → click **Upload + parse** → click **Apply to my profile**. *Or* click **Skip — fill manually** to go straight to profile review.
- **Backend calls.** `POST /api/v1/resume/upload` (multipart) → `POST /api/v1/resume/{parse_id}/apply`.
- **Expected output.** "Parsed (status: ready)" card, then "Applied N fields. Redirecting…" then `/app/onboarding/profile`.
- **Correct.** Real-looking extracted years_experience and skills appear on the next page as inferred values.
- **Red flags.** Apply succeeds but profile fields stay empty; "Skip" still 500s on the next page.
- **USP.** Twenty-minute first plan.

### 3.4 Profile review — `/app/onboarding/profile`

- **Purpose.** Confirm the data every downstream module relies on.
- **What to do.** Verify (or fill) Identity, Career, Origin & Destination, Visa & Timing, Salary. **Target country is required.** Click **Save & start analysis →**.
- **Backend calls.** `GET /api/v1/profile` on load, `PATCH /api/v1/profile` on submit. The PATCH response includes `impacted_modules` so the backend can mark the right analyses stale.
- **Expected output.** On success, redirect to `/app/country`. The `(from resume)` badge appears next to fields that came from the parser.
- **Correct.** Refresh the page — every saved value persists. The dashboard at `/app` now shows "Run your analyses." instead of "Let's get started.".
- **Red flags.** `target_country` accepted as 1 char (must be ISO-2); `years_experience` accepts negatives; PATCH 500.

### 3.5 Country comparison — `/app/country`

- **Purpose.** Origin vs destination, paired across 7 access points.
- **What to do.** Read the page. No input.
- **Backend call.** `GET /api/v1/case/{id}/country-comparison` first, falling back to `POST /run` if missing or stale.
- **Expected output.** Three score cards (overall, destination_suitability, origin_pressure), 7 paired access-point tiles (job_market, visa, housing, healthcare, schooling, cultural_fit, language_fit) with origin → destination + delta, strengths and blockers split by `side`, summary, reasoning, risks, next_actions, assumptions, metadata strip showing model + tokens.
- **Correct.** Destination shown matches the user's `target_country`. The `delta` is `destination - origin`. Stale pill says "Current".
- **Red flags.** Page hardcodes 4 generic countries (this would be a regression — the old `/app/discover` used to do this); summary mentions a country the user didn't pick.
- **USP.** "Choose" half of choose-plan-begin.

### 3.6 Job fit — `/app/jobs`

- **Purpose.** Career landing analysis.
- **Backend call.** `/case/{id}/job-fit/run`.
- **Expected output.** Four score cards (overall_job_fit, role_match, salary_realism, visa_employability), salary realism comparison (your expectation vs market, gap_pct), visa employability with sponsor-density + typical sponsor titles, three skill columns (aligned, missing, transferable), job pathways with steps + time-to-offer + confidence, alternate roles with fit scores, risks + next actions.
- **Correct.** Currency in salary realism matches `salary_currency` from profile. `gap_pct` is in the schema-clamped range (-100 to 200). At least one job pathway is listed.
- **Red flags.** Salary realism shows EUR for a USD case; pathways list is empty; gap_pct is `0` for every persona.

### 3.7 Visa direction — `/app/visa`

- **Purpose.** Direction-only (not legal advice) on which route fits.
- **Backend call.** `/case/{id}/visa/run`.
- **Expected output.** Dark "Primary route" card with name + code + difficulty + processing weeks + sponsor_required + family_friendly + rationale, requirements list with `you meet / not yet / unknown` chips, alternative routes, blockers (with `fixable` + `window`), dependencies, **legal disclaimer** at the bottom.
- **Correct.** Disclaimer is visible, not collapsed. Difficulty is one of `low/medium/high/very_high`. Processing window is plausible (e.g. 12–24 weeks for skilled-worker routes, not 2 weeks for an H-1B).
- **Red flags.** Disclaimer missing — **hard fail** for a regulated info surface. Recommendation contradicts country comparison (e.g. country page highlights DE but visa returns a CA route).
- **USP.** "Find jobs your passport can take."

### 3.8 Family relocation — `/app/family`

- **Purpose.** Household impact.
- **Backend call.** `/case/{id}/family/run`. The first call sends an empty body so the backend defaults to **solo mode**. To switch to with-family mode the backend expects a body shape (`moving_with_family`, `spouse`, `children`, `parents`, `housing_requirement`, `family_budget_impact`); a small form for this on the page is **not yet wired** — see Section 6.
- **Expected output.** Mode chip (Solo / With family), household_complexity_score, family-fit score. If with-family: spouse_outlook, child outlooks per age, parents outlook, housing fit. Always: warnings, suggestions, risks, next actions.
- **Correct.** Mode reflects the user's actual family shape. Suggestions are concrete ("apply to international school within 60 days").
- **Red flags.** With-family content shows up for a solo user; spouse outlook prompts but offers no plan.

### 3.9 Financial feasibility — `/app/finance`

- **Purpose.** Honest take-home + monthly cost.
- **Backend call.** `/case/{id}/finance/run`.
- **Expected output.** Affordability score, surplus/deficit per month, salary/expense ratio, savings runway in months. Two cards: **Monthly net** (gross / estimated tax / effective tax rate / take-home) and **Monthly cost** (housing, utilities, food, transport, healthcare, childcare, discretionary, total). FX notes when origin and destination currencies differ. Risk flags.
- **Correct.** Arithmetic ties out: take_home + tax = gross. Cost lines sum to total_monthly. Currency in every cell matches `salary_currency`.
- **Red flags.** Hardcoded EUR figures regardless of profile (this would be a regression to the old static page); take_home + tax ≠ gross.

### 3.10 Documents — `/app/documents`

- **Purpose.** Personalised compliance checklist.
- **Backend call.** `/case/{id}/documents/run`.
- **Expected output.** Four tiles (readiness %, have, need, expiring), "Next to handle" highlight, full checklist with `status` (have / need / expiring / unknown) chips and `urgency` (now / 30d / 90d / 6m / later) tags, required-for-summary mapping ("visa": ["PASSPORT", "CV"]), risks + next actions.
- **Correct.** Readiness % equals `have / total`. `have + need + expiring = total`. Items reference real document kinds (PASSPORT, EDUCATION_TRANSCRIPTS, MARRIAGE_CERT etc.).
- **Red flags.** Same checklist for every user (regression); marriage cert listed as pending for a solo mover.

### 3.11 Workflow & dependencies — `/app/workflow`

- **Purpose.** What depends on what.
- **Backend call.** `/case/{id}/workflow/run`.
- **Expected output.** Three tiles (total days min, total days max, blocked node count), critical path as a horizontal node trail (current stage highlighted), full node list with category + status + owner + duration, dependencies list with reason + hard/soft flag.
- **Correct.** Every edge endpoint references a declared node; no cycles; `current_stage_node_id` is one of the nodes.
- **Red flags.** Empty critical path; node referenced by an edge that doesn't exist; "blocked" count without any blocked-status nodes shown.

### 3.12 Culture & language — `/app/culture`

- **Purpose.** Workplace norms + language basics + first-week kit.
- **Backend call.** `/case/{id}/culture/run`.
- **Expected output.** Workplace norms grid (communication style, hierarchy, meeting etiquette, dress code, punctuality, feedback culture), language section (primary language, English usability /100, CEFR proficiency target, rationale, 5–12 starter phrases), daily life notes, first-week kit with priority (must/should/nice) + effort hours, dos and don'ts paired bullets, family adaptation notes (only when moving with family).
- **Correct.** Primary language matches the destination (e.g. Dutch for NL). CEFR target is one of `none / A1 / A2 / B1 / B2 / C1 / C2`. English usability is 0–100. Family notes are present only when family analysis is in `with_family` mode.
- **Red flags.** German phrases shown for a US destination; family notes appear for a solo mover.

### 3.13 Timeline — `/app/timeline`

- **Purpose.** Phases, milestones, blockers, total weeks.
- **Backend call.** `/case/{id}/timeline/run`.
- **Expected output.** Three tiles (total weeks min/max, earliest realistic start date), phases list with start_week / end_week / category / description, milestones list with target_week + phase + depends_on + critical chip, blockers with severity + estimated_unblock_weeks.
- **Correct.** Phase weeks are non-decreasing. Every milestone's `phase_id` matches a declared phase. Each entry in `critical_milestones` exists in the milestones list. `estimated_total_weeks_min ≤ max`.
- **Red flags.** Phase 2 starts before phase 1; critical milestone IDs that aren't in the milestone list.

### 3.14 Final synthesis — `/app/synthesis`

- **Purpose.** The dashboard verdict. The product moment.
- **Backend call.** `/case/{id}/synthesis/run`. If no upstream priors yet, the page renders a "run upstream modules first" blocked state.
- **Expected output.** Verdict chip (`go` / `go_with_conditions` / `wait` / `reconsider` / `blocked`), feasibility score /100, one-line reasoning, recommended_destination + recommended_job_path with confidences, **module scoreboard** (one tile per upstream module with score + summary + availability flag), top_blockers with source_module attribution, ordered next_best_actions with effort_hours, expandable explanation.
- **Correct.**
  - Verdict matches its band (≥80 → go, 65–79 → go_with_conditions, 50–64 → wait, 35–49 → reconsider, <35 → blocked).
  - Each module_score is within ±5 of the upstream module's score.
  - `recommended_destination.country` echoes the profile's `target_country`.
- **Red flags.** Verdict says "go" when feasibility is 40; module scores drift from upstream by >5; recommendation contradicts what the user typed.
- **USP.** Clarity. This is the page that delivers it.

---

## 4. Expected data and output contract

Every analysis page consumes one `AnalysisEnvelope`. The shape is shared across modules:

| Field | Type | What it means |
|---|---|---|
| `status` | `"generating" \| "ready" \| "failed"` | Renderable. Failed envelopes use a different shape (`error_code`, `user_message`). |
| `score` | `0..100 \| null` | Module headline number. Null means the module didn't compute one. |
| `summary` | string | One-sentence headline rendered above the fold. |
| `reasoning` | string | Long-form rationale, shown side-by-side with summary. |
| `risks` | `Risk[]` | Each: `severity` (`low/medium/high`), `label`, `detail`. |
| `next_actions` | `NextAction[]` | Each: `label`, `urgency`, `why`. Sorted by importance. |
| `confidence` | `0.0..1.0` | How confident the module is. Rendered as a percentage. |
| `metadata` | object | `generated_at`, `model`, `prompt_version`, `tokens_in`, `tokens_out`, `latency_ms`. Used by `<EnvelopeMeta>` for the debug strip. |
| `assumptions` | `Assumption[]` | **Mandatory non-empty.** Each: `label`, `detail`, `source` (`inferred/default/user/model`), `confidence`. |
| `detail` | module-specific | The shape per module — see types in `lib/backend/types.ts`. |
| `analysis_version` | `int >= 1` | Increments on every rerun. |
| `stale` | bool | True after an upstream input changed; the page shows a "Stale" pill. |
| `recompute_required` | bool | True when the dependency map flagged the module for rerun. |
| `stale_reason` | `string \| null` | Human-readable reason ("target_country changed"). |
| `input_hash` | sha256 hex | Stable hash of the inputs that produced this row. |

Failed envelope:

```ts
{ status: "failed", kind: AnalysisKind, error_code: string, user_message: string, metadata: object }
```

The shared component `<FailedEnvelopeView>` renders this contract uniformly.

---

## 5. Backend-to-frontend mapping

| Page | Backend endpoints | Required inputs | Loads | Loading / error / stale |
|---|---|---|---|---|
| `/sign-in`, `/sign-up` | NextAuth `/api/auth/*` | email, password | session cookie | NextAuth handles errors inline |
| `/app` | `GET /profile`, parallel `GET /case/{id}/<module>` ×10 | session cookie | per-module score + status; verdict if synthesis ran | Failures swallowed per-card; stale shown via "stale" sub-label |
| `/app/onboarding/resume` | `POST /resume/upload` (multipart), `POST /resume/{id}/apply` | file (PDF/DOCX) | `parse_id`, `applied_keys` | Loading state inline; bad MIME → human error |
| `/app/onboarding/profile` | `GET /profile`, `PATCH /profile` | `target_country` (ISO-2 required) | flattened profile + `field_sources` | Server-action error inline; redirects on save |
| `/app/country` | `GET /case/{id}/country-comparison` → `POST /run` if missing | profile.target_country | CountryComparisonDetail | `<FailedEnvelopeView>` if envelope.status==failed; `<StalePill>` if stale |
| `/app/jobs` | `GET .../job-fit` → `POST /run` | profile.target_country, expected_salary | JobFitDetail | same |
| `/app/visa` | `GET .../visa` → `POST /run` | profile.target_country, nationality | VisaDirectionDetail (with disclaimer) | same |
| `/app/family` | `GET .../family` → `POST /run` | profile.target_country | FamilyImpactDetail | same; defaults to solo mode if no family body sent |
| `/app/finance` | `GET .../finance` → `POST /run` | profile.target_country, current_salary or expected_salary | FinanceDetail | 400 if no salary fields |
| `/app/documents` | `GET .../documents` → `POST /run` | profile.target_country, current_document_status | DocumentChecklistDetail | same |
| `/app/workflow` | `GET .../workflow` → `POST /run` | profile.target_country | WorkflowDetail | same; structural validation can mark failed |
| `/app/culture` | `GET .../culture` → `POST /run` | profile.target_country, target_city | CultureDetail | same |
| `/app/timeline` | `GET .../timeline` → `POST /run` | profile.target_country | TimelineDetail | same; structural validation can mark failed |
| `/app/synthesis` | `GET .../synthesis` → `POST /run` | at least one upstream module ready | SynthesisDetail | renders `<BlockedState>` if no priors yet |

The bridge auth calls are hidden inside `ensureBackendSession()`:

| Trigger | Endpoint |
|---|---|
| First page render per consumer user | `POST /api/v1/auth/register` (deterministic salted email) |
| Access token expired | `POST /api/v1/auth/refresh` |
| Refresh failed | `POST /api/v1/auth/login` (using stored backend password + email) |

---

## 6. Remaining gaps

Honest list of things that are not yet finished. Treat any of these as "do not assume working" until verified.

**Mocked / partial**
- **Family form.** The `/app/family` page calls `family/run` with an empty body, so the backend defaults to **solo mode** even for users who entered family data on the consumer side. To exercise with-family mode end-to-end you currently have to POST the family body via curl. A small form on `/app/family` is needed.
- **Resume `applied_keys`.** The apply action returns the list of fields it wrote, but the consumer ignores it. Fine for a happy path; a small confirmation banner would be a nice add.
- **Workflow as list, not graph.** `/app/workflow` renders nodes/edges as a list with a flat critical path. A node-link diagram or Gantt is post-MVP polish.

**Not wired**
- **SSE streaming for synthesis.** Backend exposes `/synthesis/run/stream`. The consumer page calls the synchronous `/run` only.
- **Case state surfacing.** `draft → analyzing → ready → stale → archived` is computed server-side but not shown in the UI. The dashboard scoreboard is a per-module proxy.
- **Per-document upload.** `/app/documents` displays the checklist but does not let the user attach files. The W3 upload affordance lives elsewhere and is unrelated to this restructure.
- **Twin/Profile dual-write.** The legacy `/app/profile` form (with the Twin model) still writes to Prisma only. The new flow uses `/app/onboarding/profile`. We did **not** delete the old page; if a tester lands on it from old links, the values won't reach the FastAPI backend.

**Intentionally left for later**
- **Visual polish.** Dark hero hero treatments, marketing copy, mobile micro-interactions. The visual team owns this. The structure underneath is correct.
- **Discover, Career, Plan, Life, Marketplace, Messages.** Static / employer-app / partner-app integrations. Not part of the backend pipeline.

**Should not be treated as finished**
- **Auth bridge under heavy parallelism.** A per-userId in-flight lock prevents concurrent register races within a Next.js process. Across multiple Node workers (e.g. multi-instance prod) the salt-on-409 path needs rework. For a single-instance dev/staging deploy, the current code is sufficient.
- **Token rotation.** Refresh fallback to login fallback to re-register works in dev; under prod load with rotated tokens, exercise this path before declaring done.

---

## 7. Verification checklist

Tick each one to declare the local environment healthy.

**Stack up**
- [ ] `curl http://localhost:8000/healthz` → `{"status":"ok"}`
- [ ] `curl http://localhost:3000/sign-in` → `200`
- [ ] Backend logs show `INFO Application startup complete`
- [ ] Consumer dev log shows `Ready in <Xs>` with no schema errors

**Auth**
- [ ] Sign-up creates a Prisma `User` row + auto-signs in
- [ ] Sign-in cookie persists across reload
- [ ] Wrong password returns a friendly error (no Prisma stack)

**Resume + profile**
- [ ] Resume upload returns `parse_id` + `status: ready`
- [ ] Apply writes inferred fields visible in the profile review
- [ ] Profile PATCH returns `impacted_modules` (e.g. `country_comparison, finance, …`)
- [ ] Refreshing the profile page shows persisted values
- [ ] BackendSession row exists in `prisma/dev.db` (`SELECT * FROM BackendSession;`)

**Each analysis page**
- [ ] Returns 200
- [ ] Header shows `<EnvelopeMeta>` row with model + version + tokens
- [ ] `assumptions` list is non-empty
- [ ] `risks` and `next_actions` render when present
- [ ] Currency / country / role match the profile (no leakage of unrelated demo content)
- [ ] `<StalePill>` reads "Current" on a fresh run; reads "Stale" after a relevant profile patch
- [ ] Failed envelope (force a 4xx upstream) renders `<FailedEnvelopeView>`, not a stack trace

**Synthesis**
- [ ] Verdict matches its score band
- [ ] Each `module_scores[i].score` is within ±5 of the corresponding module's score
- [ ] `recommended_destination.country` matches `profile.target_country`
- [ ] No verdict is rendered before any upstream module has run (blocked state shown instead)

**Hardcoded fallback content**
- [ ] No analysis page shows fixed numbers when the backend is up
- [ ] No analysis page falls back to the legacy static cards (compare with the old dashboard / static finance / static documents in case any old route was missed)

---

## 8. Demo readiness verdict

**Already good enough for internal testing**
- The full backend pipeline runs end-to-end against `AI_PROVIDER=stub` with deterministic, schema-valid envelopes.
- All 12 consumer pages render against the live backend with backend-provided data — confirmed by the E2E walk: every page returns 200, dashboard surfaces the synthesis verdict, redirects to onboarding when prerequisites are missing.
- Backend test suite is at 365 passing / 13 skipped (live tests opt-in).

**Good enough for a client demo (with one caveat)**
- The pipeline, the verdict, and the dashboard are demoable today. The flow feels connected.
- Caveat: with `AI_PROVIDER=vertex`, real Gemini calls take 20–60s per module. Run modules eagerly **before** the demo or stub the provider for narration. If demoing live Vertex, prefer `/app/synthesis` last — the verdict is the moment that lands.
- Visual polish is unfinished by design. Mention it. Don't try to hide the minimal styling.

**Needs one more pass before final polish**
- The family-shape form on `/app/family` so with-family content surfaces without curl gymnastics.
- A small "running…" affordance on each page for the first call (the page server-renders, so the user sees a 20s blank while Vertex thinks).
- Per-document upload on `/app/documents`.
- SSE streaming on `/app/synthesis` for the long Pro-tier call.
- Removing or redirecting the legacy `/app/profile` Twin form so testers can't accidentally write to a dead-end.

---

*Last updated to reflect the backend-driven restructure described in [FRONTEND_RESTRUCTURE_REPORT.md](FRONTEND_RESTRUCTURE_REPORT.md). Use Section 7 as the demo gate.*
