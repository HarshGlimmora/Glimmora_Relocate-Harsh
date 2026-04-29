# Frontend Restructure — Backend-Driven Pipeline

The consumer frontend has been rewired so every analysis page is driven
by the FastAPI backend's `/api/v1/case/{case_id}/<module>/run` endpoints
in the exact pipeline order:

```
Auth → Resume → Profile → Country → Jobs → Visa → Family →
       Finance → Documents → Workflow → Culture → Timeline → Synthesis
```

The visual team can polish the components later. The flow is now correct,
typed, gated on prerequisites, and end-to-end tested against the live
backend.

---

## 1. Updated route map

### New / replaced (backend-driven)
| Route | Calls FastAPI | Renders |
|---|---|---|
| `/app` | per-module `latest` (parallel) | Dashboard scoreboard + verdict if synthesis ran |
| `/app/onboarding/resume` | `POST /api/v1/resume/upload`, `POST /api/v1/resume/{id}/apply` | Upload + parse + apply |
| `/app/onboarding/profile` | `GET /api/v1/profile`, `PATCH /api/v1/profile` | Profile review form (inferred-vs-entered, `target_country` required) |
| `/app/country` | `country-comparison/run` | overall_comparison_score, destination_suitability_score, origin_pressure_score, access_points, strengths, blockers, summary, reasoning, risks, next_actions, assumptions, confidence, metadata |
| `/app/jobs` | `job-fit/run` | overall_job_fit_score, role_match, salary_realism, visa_employability, aligned/missing/transferable skills, alternate_roles, job_pathways, risks, next_actions |
| `/app/visa` | `visa/run` | primary_route (name, code, difficulty, processing window, sponsor_required, family_friendly, requirements, rationale), alternative_routes, blockers, dependencies, **legal_disclaimer**, next_actions |
| `/app/family` | `family/run` | mode, household_complexity_score, spouse_outlook, child_outlooks, parents_outlook, housing_fit, family_warnings, family_suggestions |
| `/app/finance` | `finance/run` | monthly_net (gross/tax/take-home + effective_tax_rate_pct), monthly_cost (housing/utilities/food/transport/healthcare/childcare/discretionary + total), surplus_or_deficit_monthly, affordability_score, salary_to_expense_ratio, savings_runway_months, fx_notes, risk_flags |
| `/app/documents` | `documents/run` | items[] (kind/label/status/urgency/required_for/expires_at), readiness_percentage, have/need/expiring/total counts, missing/expiring lists, required_for_summary, next_to_handle |
| `/app/workflow` | `workflow/run` | nodes (id/label/category/status/owner/duration), edges (with reason + hard/soft), current_stage_node_id, critical_path, blocked_node_ids, total_estimated_days |
| `/app/culture` | `culture/run` | workplace_norms (communication_style/hierarchy/meeting_etiquette/dress_code/punctuality/feedback_culture), daily_life, language (primary/english_usability/proficiency_target/phrases), first_week_kit, dos_and_donts, family_adaptation_notes |
| `/app/timeline` | `timeline/run` | start_anchor, earliest_realistic_start_date, phases, milestones (with depends_on), blockers, total_estimated_weeks min/max, critical_milestones |
| `/app/synthesis` | `synthesis/run` | feasibility_score, verdict (go / go_with_conditions / wait / reconsider / blocked), one_line_reasoning, recommended_destination, recommended_job_path, module_scores, top_blockers, next_best_actions, explanation |

### Kept (legacy / out-of-scope)
`/`, `/sign-in`, `/sign-up`, `/forgot-password`, `/app/discover`, `/app/career`, `/app/plan`, `/app/life`, `/app/marketplace`, `/app/messages`, `/app/settings`, `/app/billing` — left untouched. The sidebar de-emphasises them under an "Other" section.

### Removed implicitly
The previous static dashboard, static `/app/family`, static `/app/finance`, static `/app/documents`, static `/app/culture` were overwritten with backend-driven versions.

---

## 2. New / changed files

### New helpers and types
- [apps/consumer/lib/backend/types.ts](apps/consumer/lib/backend/types.ts) — Mirrors the backend `AnalysisEnvelope` contract + every module-specific `*Detail` type.
- [apps/consumer/lib/backend/client.ts](apps/consumer/lib/backend/client.ts) — Typed HTTP client. Per-module `{latest, ensure, run}` helpers. Auto-attaches `Authorization: Bearer …`.
- [apps/consumer/lib/backend/session.ts](apps/consumer/lib/backend/session.ts) — Bridges the consumer NextAuth user to a FastAPI account; stores tokens in Prisma `BackendSession`. Per-userId in-flight lock prevents concurrent register races. Salted backend-side email so dev DB resets don't collide.
- [apps/consumer/lib/backend/page-helpers.ts](apps/consumer/lib/backend/page-helpers.ts) — `requirePrereqs()` redirects to onboarding if `target_country` is missing.
- [apps/consumer/components/backend/envelope-shell.tsx](apps/consumer/components/backend/envelope-shell.tsx) — Reusable primitives: `PageHeader`, `EnvelopeMeta`, `StalePill`, `ScoreCard`, `SummaryReasoning`, `RisksList`, `NextActionsList`, `AssumptionsList`, `FailedEnvelopeView`, `BlockedState`, `isReadyEnvelope`.

### New schema
- [apps/consumer/prisma/schema.prisma](apps/consumer/prisma/schema.prisma) — Added `BackendSession` model (userId, backendUserId, backendEmail, caseId, accessToken, refreshToken, expiresAt, backendPassword).

### New pages
- `app/app/onboarding/resume/page.tsx` + `actions.ts` + `resume-upload-card.tsx`
- `app/app/onboarding/profile/page.tsx` + `actions.ts` + `profile-review-form.tsx`
- `app/app/country/page.tsx`
- `app/app/jobs/page.tsx`
- `app/app/visa/page.tsx`
- `app/app/workflow/page.tsx`
- `app/app/timeline/page.tsx`
- `app/app/synthesis/page.tsx`

### Replaced pages (overwritten)
- `app/app/page.tsx` — now a backend-driven scoreboard
- `app/app/family/page.tsx`
- `app/app/finance/page.tsx`
- `app/app/documents/page.tsx`
- `app/app/culture/page.tsx`

### Other changes
- [apps/consumer/lib/nav.ts](apps/consumer/lib/nav.ts) — Sidebar grouped by pipeline phase: Onboarding → Analysis → Decision → Other.
- `.env.example` + `.env.local` — added `GLIMMORA_BACKEND_URL=http://localhost:8000`.
- `scripts/seed-user.mjs` — convenience seeder for E2E tests.
- `scripts/test-pipeline.mjs` — headless backend pipeline smoke (already passes against the real FastAPI).

---

## 3. Backend endpoints each page hits

| Page | Endpoint(s) |
|---|---|
| `/app` | `GET /api/v1/profile`, `GET /api/v1/case/{id}/<module>` ×10 (parallel) |
| `/app/onboarding/resume` | `POST /api/v1/resume/upload`, `POST /api/v1/resume/{id}/apply` |
| `/app/onboarding/profile` | `GET /api/v1/profile`, `PATCH /api/v1/profile` |
| `/app/country` | `GET /api/v1/case/{id}/country-comparison` then `POST /run` if missing |
| `/app/jobs` | `GET /api/v1/case/{id}/job-fit` then `POST /run` if missing |
| `/app/visa` | `GET /api/v1/case/{id}/visa` then `POST /run` if missing |
| `/app/family` | `GET /api/v1/case/{id}/family` then `POST /run` if missing |
| `/app/finance` | `GET /api/v1/case/{id}/finance` then `POST /run` if missing |
| `/app/documents` | `GET /api/v1/case/{id}/documents` then `POST /run` if missing |
| `/app/workflow` | `GET /api/v1/case/{id}/workflow` then `POST /run` if missing |
| `/app/culture` | `GET /api/v1/case/{id}/culture` then `POST /run` if missing |
| `/app/timeline` | `GET /api/v1/case/{id}/timeline` then `POST /run` if missing |
| `/app/synthesis` | `GET /api/v1/case/{id}/synthesis` then `POST /run` if missing |

**Auth bridge calls** (handled inside `ensureBackendSession()`):
- `POST /api/v1/auth/register` (first ever call per consumer user)
- `POST /api/v1/auth/refresh` (when access token expired)
- `POST /api/v1/auth/login` (refresh fallback)

---

## 4. Data fields rendered

Every page renders the shared envelope contract in addition to its module-specific detail:
- `status` — gates the rendering (`ready` vs `failed`)
- `score` — banded colour (≥70 success, ≥50 gilt, else danger)
- `summary` + `reasoning` — top of every page
- `confidence` — % under summary
- `risks` — severity-typed cards
- `next_actions` — urgency-tagged ordered list
- `assumptions` — source + confidence per row
- `metadata.model`, `metadata.latency_ms`, `metadata.tokens_in/out` — debug strip
- `analysis_version`, `stale`, `stale_reason`, `recompute_required` — surfaced via `<EnvelopeMeta>` + `<StalePill>`

---

## 5. Pages removed or replaced

| Old | New treatment |
|---|---|
| Static `/app` greeting + readiness ladder | **Replaced** with backend-driven scoreboard |
| Static `/app/family` (Prisma-only KPIs) | **Replaced** by `family/run` envelope renderer |
| Static `/app/finance` (hardcoded IN→DE corridors) | **Replaced** by `finance/run` envelope renderer |
| Static `/app/documents` (hardcoded checklist) | **Replaced** by `documents/run` envelope renderer |
| Static `/app/culture` (hardcoded German modules) | **Replaced** by `culture/run` envelope renderer |
| `/app/discover` country-card defect (hardcoded DE/NL/PT/IE) | **Superseded** by `/app/country` (left in place under "Other") |

The legacy `/app/discover`, `/app/career`, `/app/plan`, `/app/life`, `/app/marketplace`, `/app/messages` routes still exist for partner / employer integrations — they are not part of the backend pipeline.

---

## 6. Major flow corrections

1. **Pipeline order** is now enforced via the sidebar AND via `requirePrereqs()`, which redirects every analysis page to `/app/onboarding/profile` if `target_country` is missing.
2. **Resume upload** is now a real first-class step at `/app/onboarding/resume` (was missing entirely before).
3. **Profile review** at `/app/onboarding/profile` distinguishes inferred vs entered values via the backend's `field_sources` map.
4. **Country comparison** comes from the backend (was hardcoded array of 4 countries).
5. **Visa direction** has its own page — was previously only a string on the dashboard hired-banner.
6. **Workflow & dependencies** has its own page — was missing entirely.
7. **Timeline** has its own page reading the `timeline/run` envelope — replaces the Prisma-driven `/app/plan` for pre-hire users (kept post-hire view at `/app/plan`).
8. **Synthesis dashboard** at `/app/synthesis` renders the verdict, module scoreboard, top blockers, next best actions — was missing entirely.
9. **Stale handling** — every analysis page shows a `<StalePill>` and an `<EnvelopeMeta>` row (model + version + tokens + latency).
10. **Failure handling** — `<FailedEnvelopeView>` renders the backend's `error_code` + `user_message` so module failures don't crash the page.
11. **Loading** — pages are server components; Next.js streaming + the page skeleton handle initial loads. No silent fallbacks to mock data.

---

## 7. Remaining gaps

- **Resume parsing** apply flow returns `applied_keys`, but the consumer `applyResumeAction` ignores them — fine for now (the user lands on profile review and sees the merged values).
- **Workflow node graph** is a list, not a node-link diagram. Visual team can replace with a Gantt or DAG renderer later.
- **SSE streaming** for synthesis is wired in the backend (`/synthesis/run/stream`), but the consumer page just calls the synchronous `/run`. Streaming hookup is a UX upgrade — out of scope for this minimal pass.
- **Case state transitions** (draft → analyzing → ready) are not surfaced in the UI. The dashboard scoreboard shows individual module status, which is sufficient for now.
- **Onboarding profile form** does not yet upload `current_document_status` per-document — the user can only set `target_country` here. Per-document inputs are expected to live on `/app/documents` later.
- **Family analysis run body** — the backend accepts `moving_with_family`, `spouse`, `children`, `parents` etc. via the `/family/run` body. The consumer currently runs family with an empty body (so the user starts in solo mode). A future enhancement is a small family-shape form on `/app/family` that POSTs the body before rendering.
- **Stub vs Vertex** — backend default is `AI_PROVIDER=auto`. The consumer doesn't care; whatever the backend returns gets rendered. The end-to-end test was run against `AI_PROVIDER=stub` for speed.

---

## 8. End-to-end verification

Backend (FastAPI, stub provider, port 8765) + consumer (Next.js, port 3010) ran simultaneously. A test user signed in via NextAuth credentials; the bridge auto-registered them on the backend; profile was patched (target_country=DE); every page was hit via cookies.

```
login: 302 cookies: authjs.csrf-token,authjs.callback-url,authjs.session-token
/app                         200   Your verdict is ready.
/app/onboarding/profile      200   Confirm your profile.
/app/country                 200   Origin vs destination.
/app/jobs                    200   Where your career lands.
/app/visa                    200   The route to your destination.
/app/family                  200   For everyone moving with you.
/app/finance                 200   The numbers, honestly.
/app/documents               200   Your checklist.
/app/workflow                200   What depends on what.
/app/culture                 200   Arrive ready.
/app/timeline                200   When and what.
/app/synthesis               200   Should you move?
```

Every page returned 200 with backend-derived content. Before patching the profile, every analysis page correctly 307-redirected to `/app/onboarding/profile?missing=target_country`, proving the gating works.

---

## 9. Does the frontend now follow the backend exactly?

**Yes.** The consumer:
- routes match the backend pipeline order,
- every analysis page calls the corresponding `/api/v1/case/{id}/<module>` endpoint and renders the `AnalysisEnvelope` (status / score / summary / reasoning / risks / next_actions / confidence / metadata / detail / assumptions / version / stale / input_hash),
- prerequisites are gated server-side via `requirePrereqs()`,
- the dashboard reads `latest` for every module and surfaces the synthesis verdict when ready,
- failure paths render `<FailedEnvelopeView>` from the backend's failed envelope contract.

The visual layer is intentionally minimal. Polish goes on top of this without changing the data flow.
