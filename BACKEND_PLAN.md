# Glimmora Relocate — MVP Backend Plan
**Scope: "Person who has a job and wants to relocate" — the `Mover` persona only.**
Version: 0.2 (planning) · Author: Kiran + Claude · Date: 2026-04-27

**Changelog**
- **v0.2 (2026-04-27)**: Added explicit case state machine (§4.3.1), freshness fields on the envelope (`analysis_version`, `stale`, `recompute_required`, `stale_reason`, `input_hash`) with matching columns on `analyses`, partial-rerun dependency map and orchestration (§5.5), mandatory `assumptions[]` block with rule-based auto-injection (§5.7). Build order, file structure, risks, and DoD updated to match.
- **v0.1 (2026-04-27)**: Initial plan.

---

## 0. Reading guide

This is the single source of truth for the backend MVP. Every section explains both **the decision** and **why we made that decision over the obvious alternatives**, so the engineer building this (or future-you) can re-derive intent.

Order of reading:
1. §1 Goals & non-goals — what we are/aren't building
2. §2 Architecture in one page
3. §3 The 13 frontend pages → backend endpoints (the contract)
4. §4 Data model
5. §5 AI layer (this is most of the system)
6. §6 GCP / infra
7. §7 File structure (modular, page-wise)
8. §8 Build order

---

## 1. Goals, non-goals, and the bet

### 1.1 What this MVP delivers
A **decision-intelligence product** for one persona: a working professional with an existing job who is considering or actively pursuing relocation. The output of the product is a **decisive, explainable verdict** — _"go to X via visa Y, here's the gap list, here's the timeline, here's the runway"_ — produced from minimal user input by leaning hard on a frozen set of well-tuned LLM calls.

The user lands, uploads a resume, answers ~10 short questions across 4 pages, and the system materialises 9 analysis artifacts that compose into one final dashboard.

### 1.2 What we are explicitly **not** building
- Marketplace (partner listings, bookings, escrow, payouts)
- Stripe / subscriptions / billing
- Employer-side ATS, jobs, applications, offers
- Corporate HR mobility (organizations, policies, approvals, invoices)
- Admin/Ops console (verification, disputes, KG curation)
- Partner KYB
- Student / family-as-primary persona variants
- Real document storage / OCR / e-signing
- Real-time messaging / Copilot chat thread
- The four cross-portal HTTP contracts (employer-api, partner-api, relocation bridge)

These are **frozen** in code. The frontend pages exist; we will not write backend for them. Where the Mover flow needs data that today flows from one of those frozen surfaces (e.g., the Relocation row that was previously created by the Employer→Consumer bridge on offer-accept), we **own creation locally** in the Mover flow instead. See §3.4.

### 1.3 The product bet
**Speed and depth come from compressing the build into a small set of high-quality LLM calls, not from building bespoke business logic per feature.** Concretely: visa direction, job fit, family impact, financial feasibility, cultural prep, timeline, document checklist, country comparison, and the final synthesis are **all LLM-produced structured artifacts** validated against a Pydantic schema and persisted. We do not write a tax simulator, a visa rule engine, or a school-fit scorer. We write **one good orchestration layer** around Gemini.

Why this is the right bet for the MVP:
- Eliminates ~80% of typical backend code (no static rule tables, no per-country logic forks).
- Quality scales with prompt + model improvements rather than engineering effort.
- Same Pydantic-validated output shape across all 9 analyses → frontend renders with one component family.
- Latency stays acceptable because each artifact is computed **once per case** and cached. The user is not waiting on every page; analyses are generated in parallel after Profile Review (§3.3).

### 1.4 Why Gemini (not Claude) for the runtime
The user is moving the AI layer to GCP. **Gemini 2.5 Pro** for reasoning-heavy outputs (visa direction, final synthesis), **Gemini 2.5 Flash** for cheap structured extractions (resume parse, document checklist). Both support:
- **Structured output** via response schema (JSON mode) — eliminates a whole class of parser bugs.
- **Long context** — we can pack the full user profile + relocation case + prior analyses into every call, which is exactly the "personalisation" the brief asks for.
- **Native on Vertex AI** — keys/IAM are GCP-native; one cloud, one billing surface.

We keep an `AIProvider` abstraction (§5.4) so swapping back to Claude or adding fallback is a one-file change. This is not over-engineering — the abstraction is ~40 lines and removes vendor lock-in.

### 1.5 What "good" looks like (acceptance bar)
- New user → final dashboard in **under 4 minutes** of active interaction (parse + 3 short forms + read).
- All 9 analyses generated in **under 25 seconds wall-clock** after Profile Review submit (parallel).
- Zero free-text "raw LLM output" anywhere in the UI — every screen consumes a typed, schema-validated artifact.
- Every score has a one-paragraph explanation with the inputs that drove it cited inline.
- Reopening a case is instant (no recompute).

---

## 2. Architecture in one page

```
┌──────────────────────────────────────────────────────────────┐
│  apps/consumer  (Next.js 14, the only live frontend)         │
│  Pages 1–13 of the Mover flow                                │
└────────────────────────┬─────────────────────────────────────┘
                         │  REST + SSE (for streaming synthesis)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  backend/  (FastAPI, modular monolith, one process)          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ auth        │  │ profile     │  │ case        │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ resume      │  │ countries   │  │ jobfit      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ visa        │  │ family      │  │ finance     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ documents   │  │ workflow    │  │ culture     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ timeline    │  │ synthesis   │  one module = one page    │
│  └─────────────┘  └─────────────┘                           │
│                                                              │
│  ai/        ← single Gemini gateway (cache, retry, schema)  │
│  prompts/   ← versioned prompt files, one per analysis      │
│  schemas/   ← Pydantic models = the contract                │
│  storage/   ← Postgres + GCS clients                        │
└──────┬───────────────────────────┬───────────────────────────┘
       │                           │
       ▼                           ▼
┌──────────────┐           ┌──────────────────┐
│ Cloud SQL    │           │ Vertex AI        │
│ Postgres 16  │           │ Gemini 2.5 Pro   │
│ + pgvector   │           │ Gemini 2.5 Flash │
└──────────────┘           │ Document AI      │
                           │ (resume OCR)     │
                           └──────────────────┘
```

**Why a modular monolith and not microservices**: every analysis reads the same `User + UserProfile + RelocationCase` snapshot. Splitting modules across services means duplicating that read or building an internal RPC fabric for no benefit at MVP scale. The module boundaries below are real — clean directory separation, no cross-imports of internals — so extraction later is a refactor, not a rewrite. This matches the tech-stack doc's "modular monolith at W0" recommendation.

**Why FastAPI**: per the SOW. Async I/O matters because every endpoint waits on Gemini for 1–10s — synchronous frameworks would block worker threads.

**Why Postgres + pgvector and not 5 SQLite files**: collapse the multi-DB simulation immediately. The Mover flow needs relational joins (case → analyses → profile snapshots) that SQLite handles, but Cloud SQL gives us pgvector (for resume/JD embeddings if we add semantic match later), JSONB (for flexible analysis payloads), and managed backups for free.

---

## 3. The 13 frontend pages → backend contracts

Every page section below lists: **route, inputs, what the backend does, what it returns, what the user sees, and the key design decision.** Output shapes are the wire contract — the frontend depends on these.

### 3.0 The universal analysis envelope

Every analysis endpoint (jobfit, visa, family, finance, documents, workflow, culture, timeline, synthesis, country-comparison) returns the **same envelope**, exactly as your brief specified, plus the freshness + assumptions extensions added in v0.2:

```python
class AnalysisEnvelope[T]:
    # --- core (v0.1) ---
    status: Literal["ready", "generating", "failed"]
    score: int | None              # 0-100, null where not applicable
    summary: str                   # 1-2 sentence verdict
    reasoning: str                 # 3-6 sentence explanation citing the inputs
    risks: list[Risk]              # [{severity: low|med|high, label, detail}]
    next_actions: list[NextAction] # [{label, urgency, why}]
    confidence: float              # 0.0-1.0, model self-reported, calibrated
    metadata: dict                 # generated_at, model, prompt_version, tokens
    detail: T                      # analysis-specific structured payload

    # --- freshness (v0.2) ---
    analysis_version: int          # bumps on every successful (re)compute
    stale: bool                    # true if any upstream input changed since generation
    recompute_required: bool       # true if stale AND inputs are valid enough to rerun
    stale_reason: str | None       # e.g. "target_country changed: PT → DE"
    input_hash: str                # sha256 of the canonicalized inputs that produced this

    # --- transparency (v0.2) ---
    assumptions: list[Assumption]  # see below — model-reported and rule-injected

class Assumption:
    label: str                     # short, e.g. "Salary assumed in local currency"
    detail: str | None             # one-sentence explanation
    source: Literal["inferred", "default", "user", "model"]
    confidence: float              # 0.0-1.0
```

**Why this matters**: one render component family on the frontend. One validation layer on the backend. One persistence row shape (`analyses` table). Adding a new analysis is "write a prompt + a Pydantic detail model + a route", nothing else.

**Freshness fields rule**: `stale=true` means the inputs that produced this artifact no longer match the case's current inputs. `recompute_required=true` means the system *can and should* re-run it (inputs are still valid). The frontend uses these to render a discreet "Outdated — refreshing…" pill on the affected cards rather than blanking them out, so the user always sees the last known answer while the new one computes.

**Assumptions block rule**: every prompt is required to emit at least one item in `assumptions[]`. The gateway also auto-injects rule-based assumptions (e.g., "destination city defaulted to capital because none was provided") so the UI can show them even when the model forgets. A `source` of `inferred` means the model derived it; `default` means a system fallback was used; `user` means the value came from a confirmed input; `model` means the LLM is asserting a fact from training data (treat with care).

---

### Page 1 — Login / Register
**Route:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
**Inputs:** `{ email, password, name }` (register); `{ email, password }` (login)
**Backend:** Create `User` row (Argon2id hash), create empty `UserProfile`, create `RelocationCase(status="draft")`, return short-lived JWT (15 min) + refresh token (30 days, rotating, HttpOnly cookie).
**Returns:** `{ user: {id, email, name}, case_id, access_token }`
**Frontend uses:** Stores access token in memory, refresh token is cookie. `case_id` is now in URL on every subsequent page.

**Decision — JWT vs NextAuth session**: We keep NextAuth on the Next.js side for cookie/session handling but **the backend is the source of truth**. NextAuth's `authorize` callback hits `/auth/login`, gets the JWT, stores it in the encrypted session cookie. Backend never sees NextAuth — it just validates JWTs. This avoids dragging NextAuth's adapter into FastAPI (it's a Node library) and lets us share the auth layer with future native apps.

**Decision — one case per user vs many**: one case per user for MVP. Multiple cases is a future feature; the schema supports it (`case_id` is the FK), but the UI/API surface only ever uses the active one.

---

### Page 2 — Resume Upload
**Route:** `POST /api/v1/resume/upload` (multipart), then `GET /api/v1/resume/{parse_id}` for status
**Inputs:** PDF/DOCX file, max 10 MB
**Backend:**
1. Stream upload to **GCS bucket** `glimmora-resumes/{user_id}/{uuid}.pdf`. Encrypted with CMEK.
2. Insert `ResumeParse(id, user_id, gcs_uri, status="parsing")`.
3. Kick off background task (FastAPI `BackgroundTasks` for MVP; Cloud Tasks later if we need durability):
   - Extract text via **Google Document AI** (form parser) for PDFs; `python-docx` for DOCX.
   - Pass extracted text to **Gemini 2.5 Flash** with structured schema → returns `ResumeExtraction` (see §4.4).
   - Store result in `ResumeParse.extracted_json`, set `status="ready"`.
4. Frontend polls `/resume/{parse_id}` every 1.5s (or we open SSE — we'll use polling for simplicity at MVP; SSE only for the final synthesis).
**Returns (status):** `{ status: "parsing"|"ready"|"failed", extracted: ResumeExtraction | null }`

**Decision — Document AI vs raw Gemini multimodal**: Document AI's form parser is purpose-built for resume layout (handles columns, tables, headers/footers correctly) and is faster/cheaper than feeding a PDF directly to a multimodal LLM. Gemini gets clean text in. ~$0.015/page vs ~$0.05/page multimodal, and ~2x lower latency.

**Decision — async background vs sync wait**: The parse takes 4–8s. Blocking the upload response that long is fragile (timeouts, retries upload the file again). Background + poll is robust. Frontend shows progress states in the order: uploading → parsing → extracting → ready.

---

### Page 3 — Profile Review
**Route:** `GET /api/v1/profile`, `PATCH /api/v1/profile`
**Inputs (PATCH body):**
```
{
  // confirms or overrides resume-derived fields
  full_name, current_role, industry, years_experience, seniority,
  skills[], education[], companies[],
  // user-only fields
  current_country, target_country | null, current_salary, expected_salary,
  move_urgency: "asap"|"6m"|"12m"|"exploring",
  work_preference: "onsite"|"hybrid"|"remote",
  relocation_budget, needs_visa_sponsorship: bool,
  priority_ranking[]   // ["career","family","cost","lifestyle","speed"]
}
```
**Backend:** Merge into `UserProfile`. Compute `completion_percentage` (count non-null required fields / total). Mark each field as `source: "resume"|"user"|"merged"` in the response so the frontend can show the "auto-filled" badges.
**Returns:** `{ profile: UserProfile, field_sources: {field: source}, completion_percentage }`

**Decision — single profile row vs separate "inferred" + "confirmed"**: single row, with a per-field source map stored alongside. Two rows would force a merge view at every read. The source map is small JSON (~30 keys) and gives us the badge rendering for free.

**Decision — what to require vs leave optional**: The minimum to proceed is `current_country`, `target_country` (or "not_decided"), `move_urgency`, `needs_visa_sponsorship`. Everything else can be empty — the analyses degrade gracefully (lower confidence) rather than failing.

---

### Page 4 — Destination Setup / Access Points (the "two countries" page)
**Route:** `POST /api/v1/case/{case_id}/countries`, then `GET /api/v1/case/{case_id}/country-comparison`
**Inputs:**
```
{
  current_country, current_city,
  target_country, target_city | null,
  open_to_alternatives: bool, alternatives: [country_codes],
  current_job_situation: "employed"|"between_roles"|"contracting",
  job_search_status: "active"|"passive"|"not_started",
  origin_constraints: free_text,    // e.g. "house lease until Sep"
  reason_for_moving: free_text
}
```
**Backend:**
1. Persist into `RelocationCase`.
2. Trigger `country-comparison` analysis (Gemini 2.5 Pro). Prompt produces `CountryComparison` artifact (see §4.5) with **paired access-point scores for both countries** across: job market, visa difficulty, cost of living, housing pressure, healthcare, schooling, cultural fit, language fit. Plus a transition delta.
3. Store as a row in `analyses` table, kind=`country-comparison`.
**Returns:** AnalysisEnvelope[CountryComparison]

**Decision — why this is the first analysis run**: it's the only one whose outputs the user sees on the *current* page (not later). All others run in parallel after this page submits, in the background, while the user navigates pages 5–7 (which mostly just collect more inputs and let the user wait briefly for that analysis to complete).

**Decision — pair-based comparison vs separate scores**: model both countries together in a single Gemini call. The relative comparison ("housing in Lisbon is 2x harder than Bangalore for your salary band") is the actual product value. Computing them separately and diffing client-side loses the framing.

---

### Page 5 — Job Fit Analysis
**Route:** `POST /api/v1/case/{case_id}/jobfit/inputs` then `GET /api/v1/case/{case_id}/jobfit`
**Inputs:** `{ current_role, target_role|null, preferred_industry, years_experience, salary_range_min, salary_range_max, work_mode, needs_visa_sponsorship, open_to_role_change }`
**Backend:** Gemini 2.5 Pro with prompt that takes (resume extraction + profile + countries + jobfit inputs). Returns `JobFitDetail`:
```
{
  overall_score: 0-100,
  role_match: { score, target_role_inferred, alternative_roles: [{role, fit_score, why}] },
  salary_realism: { score, market_min, market_p50, market_max, currency, gap_pct },
  visa_employability: { score, friendly_employers_estimate, roles_with_sponsorship: [string] },
  skill_alignment: { aligned: [skill], missing: [skill], transferable: [skill] },
  pathways: [{ name, steps: [string], time_to_offer_weeks, confidence }],
  key_gaps: [string]
}
```
Plus the universal envelope on top.
**Returns:** AnalysisEnvelope[JobFitDetail]

**Decision — no integration with real job boards at MVP**: the brief says ignore the marketplace/employer pieces. The model's training data + the country context produce a useful estimate of market salary and sponsorship friendliness without scraping LinkedIn. We mark confidence appropriately. When we want hard numbers later, we plug in a job-data feed behind the same `JobFitDetail` shape.

---

### Page 6 — Visa Direction
**Route:** `POST /api/v1/case/{case_id}/visa/inputs` then `GET /api/v1/case/{case_id}/visa`
**Inputs:** `{ target_country, nationality, current_visa_status, sponsor_required: bool, employment_status, family_relocation: bool }`
**Backend:** Gemini 2.5 Pro. Returns `VisaDirectionDetail`:
```
{
  primary_route: { name: "EU Blue Card"|..., difficulty: "low"|"med"|"high", typical_processing_weeks, key_requirements: [string] },
  alternative_routes: [{ name, difficulty, why_consider }],
  blockers: [{ issue, severity, fixable_in_weeks }],
  dependencies: [{ requirement, depends_on, status: "have"|"need" }],
  legal_disclaimer: string  // always present
}
```
**Returns:** AnalysisEnvelope[VisaDirectionDetail]

**Decision — explicitly not legal advice**: every visa response carries a fixed disclaimer string the frontend renders verbatim, and the prompt instructs the model to avoid prescriptive language ("you must"). It outputs *direction*, not *answers*. This is in the brief.

**Decision — no scraping of govt portals**: training data is good enough for direction. Real-time gov data is a W4+ feature.

---

### Page 7 — Family Relocation
**Route:** `POST /api/v1/case/{case_id}/family/inputs` then `GET /api/v1/case/{case_id}/family`
**Inputs:** `{ moving_with_family: bool, spouse: {moving, has_career, profession?} | null, children: [{age, schooling_need}], parents: {moving, dependency_level, healthcare_sensitivity} | null, housing_requirement, family_budget_impact }`
**Backend:** Gemini 2.5 Pro using profile + country comparison + family inputs. Returns `FamilyImpactDetail`:
```
{
  household_complexity_score: 0-100,
  spouse: { career_outlook, support_visa_route, language_pressure },
  children: [{age, schooling_recommendation, language_pressure, integration_estimate_months}],
  parents: { healthcare_fit, dependency_management, visa_options },
  family_friendly_destination_fit: 0-100,
  warnings: [Risk],
  suggestions: [NextAction]
}
```
**Returns:** AnalysisEnvelope[FamilyImpactDetail]

**Decision — degrade to "moving alone" mode**: if `moving_with_family=false`, the prompt produces a much shorter artifact and the score = 100 (no family complexity). The frontend page still renders, but collapsed. We don't skip it — consistency of the dashboard depends on every analysis existing for every case.

---

### Page 8 — Financial Analysis
**Route:** `POST /api/v1/case/{case_id}/finance/inputs` then `GET /api/v1/case/{case_id}/finance`
**Inputs:** `{ current_salary, expected_salary, target_country, target_city, monthly_budget, savings, family_size, rent_expectation, cost_sensitivity: "low"|"med"|"high" }`
**Backend:** Gemini 2.5 Pro. Returns `FinanceDetail`:
```
{
  monthly_net_estimate: { gross, tax_estimate, take_home, currency },
  monthly_cost_estimate: { housing, utilities, food, transport, healthcare, other, total },
  surplus_or_deficit: int,
  affordability_score: 0-100,
  savings_runway_months: int,
  salary_to_expense_ratio: float,
  fx_note: string,
  risk_flags: [Risk]
}
```
**Returns:** AnalysisEnvelope[FinanceDetail]

**Decision — no tax engine, no COL API**: Gemini knows broadly that net pay in Berlin on €80k is ~€3,800/month and rent for a 1BR is ~€1,400. It's an estimate, not a tax filing. The artifact is honest about confidence. When we bring in a real FX feed and a country-by-country tax module later, this artifact gets sharper without changing shape.

---

### Page 9 — Document & Compliance
**Route:** `POST /api/v1/case/{case_id}/documents/inputs` then `GET /api/v1/case/{case_id}/documents`
**Inputs:** `{ current_document_status: {passport: {has, expires_at?}, ...}, family_profile_ref }`
**Backend:** Gemini 2.5 Flash (this one is more deterministic — checklist generation). Reads visa direction + family + countries to produce `DocumentChecklist`:
```
{
  items: [{
    kind: "PASSPORT"|"APOSTILLE"|"BIRTH_CERT"|...,
    label, required_for: [route_or_purpose], status: "have"|"need"|"expiring",
    urgency: "now"|"30d"|"90d"|"6m", notes
  }],
  readiness_percentage: 0-100,
  next_to_handle: { kind, why }
}
```
**Returns:** AnalysisEnvelope[DocumentChecklist]

**Decision — Flash not Pro**: this is enumeration, not reasoning. ~10x cheaper, ~3x faster. Quality is fine.

**Decision — no real document upload yet**: the user self-reports document status. Real OCR + storage is post-MVP. Frontend shows checkboxes + dates, persists via PATCH.

---

### Page 10 — Workflow / Dependencies
**Route:** `GET /api/v1/case/{case_id}/workflow`
**Inputs:** all prior analyses (no new user input)
**Backend:** Gemini 2.5 Pro. Reads visa, documents, finance, family, jobfit, countries. Produces `WorkflowGraph`:
```
{
  nodes: [{ id, label, kind: "DOC"|"VISA"|"JOB"|"HOUSING"|"FINANCE"|"FAMILY"|"MOVE", est_duration_weeks, blocked_by: [node_id], status: "todo"|"doing"|"done"|"blocked" }],
  edges: [{ from, to, kind: "depends_on"|"unblocks" }],
  current_stage_node_id: string,
  critical_path: [node_id]
}
```
**Returns:** AnalysisEnvelope[WorkflowGraph]

**Decision — Gemini-generated DAG vs hardcoded template**: the bridge in the existing frontend uses a fixed 8-step template ([apps/consumer/app/api/internal/relocation/route.ts:30-113](apps/consumer/app/api/internal/relocation/route.ts#L30-L113)). We replace that with a contextual DAG: a Bangalore-to-Lisbon contractor with no kids has a wildly different graph from a Mumbai-to-Toronto family of four with school-aged children. The template was a placeholder. Real differentiation is here.

---

### Page 11 — Cultural & Language
**Route:** `GET /api/v1/case/{case_id}/culture`
**Inputs:** target_country, target_city, role, work_preference, language_profile (inferred from resume + profile)
**Backend:** Gemini 2.5 Flash. Returns `CulturePrep`:
```
{
  workplace: { norms: [tip], communication_style, hierarchy_note, meeting_etiquette },
  daily_life: { greetings, tipping, transit, do_donts: [tip] },
  language: { primary, work_language, basic_phrases: [{phrase, meaning, when}], proficiency_target: "A1|A2|B1|B2|C1" },
  first_week_kit: [tip]
}
```
**Returns:** AnalysisEnvelope[CulturePrep]

---

### Page 12 — Timeline
**Route:** `GET /api/v1/case/{case_id}/timeline`
**Inputs:** workflow + visa + documents + jobfit + family + urgency
**Backend:** Gemini 2.5 Pro. Returns `TimelinePlan`:
```
{
  phases: [{
    name: "Decide"|"Prepare"|"Apply"|"Approve"|"Move"|"Settle",
    start_offset_weeks, duration_weeks,
    milestones: [{ label, due_offset_weeks, depends_on_nodes: [workflow_node_id] }],
    risks: [Risk]
  }],
  estimated_total_weeks: int,
  earliest_realistic_start_date: date,
  blockers: [Risk]
}
```
**Returns:** AnalysisEnvelope[TimelinePlan]

---

### Page 13 — Final Results Dashboard
**Route:** `GET /api/v1/case/{case_id}/synthesis` (returns immediately if cached); `GET /api/v1/case/{case_id}/synthesis/stream` for SSE if generating
**Inputs:** all 9 prior analyses (no user input)
**Backend:** Gemini 2.5 Pro, **streaming**. The prompt is a synthesis: read all envelopes, produce a single decisive verdict. Returns `FinalRecommendation`:
```
{
  feasibility_score: 0-100,
  verdict: "go"|"go_with_conditions"|"reconsider"|"hold",
  one_line_reasoning: string,
  recommended_destination: { country, city, why },
  recommended_job_path: { name, why },
  module_scores: { jobfit, visa, family, finance, documents, workflow, culture, timeline },
  module_summaries: { ...one_line_each },
  top_blockers: [Risk],
  next_best_actions: [NextAction],
  ai_explanation: string  // 4-6 sentences
}
```
**Returns:** AnalysisEnvelope[FinalRecommendation]

**Decision — streaming on this one only**: it's the longest call (~8–12s) and the only one where the user is staring at the screen waiting for one specific answer. SSE makes it feel responsive. Other pages render their card lists from already-cached artifacts.

**Decision — synthesis reads stored artifacts, not re-runs them**: the synthesis prompt receives the JSON of all prior envelopes verbatim. That's the personalisation lever — the model sees consistent facts across analyses and can call out contradictions ("strong job fit but visa says high difficulty").

---

## 4. Data model

Single Cloud SQL Postgres 16 database. One schema, `glimmora`. All money stored as integer **minor units** (cents) — the existing frontend uses whole units; we'll normalise on API boundary.

### 4.1 Identity
```
users (id uuid pk, email citext unique, password_hash text, name text,
       email_verified_at timestamptz, status text default 'ACTIVE',
       created_at, updated_at)

refresh_tokens (id uuid pk, user_id fk, token_hash text, expires_at,
                rotated_to uuid null, revoked_at)
```

### 4.2 Profile
```
user_profiles (
  user_id uuid pk fk users(id),
  -- identity
  full_name, current_role, industry, seniority,
  years_experience int, skills jsonb, education jsonb, companies jsonb,
  -- relocation context
  current_country char(2), current_city,
  target_country char(2) null, target_city null,
  current_salary int null, expected_salary int null,
  move_urgency text, work_preference text,
  relocation_budget int null, needs_visa_sponsorship bool,
  priority_ranking jsonb,           -- ["career","family",...]
  -- meta
  field_sources jsonb,               -- {field: "resume"|"user"|"merged"}
  completion_percentage int,
  created_at, updated_at
)
```

### 4.3 Case
```
relocation_cases (
  id uuid pk, user_id fk users(id),
  state text default 'draft',        -- see §4.3.1 state machine below
  state_changed_at timestamptz,
  -- frozen snapshot of inputs at the time the most recent batch ran
  inputs_snapshot jsonb,
  -- monotonic counter; bumped every time inputs change in a way that
  -- invalidates one or more analyses. Each analysis row records the
  -- value of this counter it was generated under.
  inputs_revision int default 1,
  active bool default true,
  created_at, updated_at
)
```

### 4.3.1 Case state machine

The case's `state` column is the single source of truth for what the frontend renders at the global level. Transitions are owned by the orchestration layer (§5.5) — modules don't write to it directly.

| State | Meaning | Allowed transitions |
|---|---|---|
| `draft` | Just-created case, no resume yet | → `profile_ready` (after Profile Review submit), → `archived` |
| `profile_ready` | Profile complete, no analyses run yet | → `analyzing` |
| `analyzing` | One or more analyses are in flight, no module is `ready` yet | → `partially_ready`, → `ready`, → `failed` |
| `partially_ready` | Some analyses ready, others still generating or failed | → `ready`, → `stale`, → `failed` |
| `ready` | All 9 analyses are `status=ready` and `stale=false` | → `stale` (on input edit), → `analyzing` (on full rerun), → `archived` |
| `stale` | At least one analysis is marked `stale=true` after an input edit; partial rerun is in flight | → `partially_ready`, → `ready` |
| `failed` | Terminal failure of the whole batch (rare; module-level failure stays in `partially_ready`) | → `analyzing` (on retry) |
| `archived` | User soft-deleted the case | terminal |

The state is recomputed by `orchestration/state_machine.py` after every analysis status change using a deterministic rule:
```
if any(stale): "stale" if any inflight else compute_from_module_states
elif all(ready): "ready"
elif any(generating): "analyzing" if none(ready) else "partially_ready"
elif any(failed) and none(generating): "failed" if all(failed) else "partially_ready"
```

Why an explicit state and not derive on read: the frontend's global page chrome (the top-of-screen status pill, the dashboard CTA copy, the "you can proceed" gating on Pages 4–13) needs a single value to bind to. Computing it on every request from 9 sub-rows is wasteful and racy. We persist it and emit it via SSE on change.

### 4.4 Resume
```
resume_parses (
  id uuid pk, user_id fk, gcs_uri text, mime_type text, file_size int,
  status text,                       -- parsing|ready|failed
  raw_text text null,
  extracted_json jsonb null,         -- ResumeExtraction shape
  doc_ai_response_uri text null,     -- raw response for debugging
  error text null,
  created_at, updated_at
)
```

`ResumeExtraction` (Pydantic):
```
{ full_name, emails[], phones[], headline, summary,
  current_role, current_company, years_experience: int,
  seniority: junior|mid|senior|staff|principal,
  skills: [{name, category, evidence_snippet}],
  experience: [{company, role, start, end, location, bullets:[]}],
  education: [{school, degree, field, start, end}],
  certifications:[], languages: [{name, level}],
  inferred_industry, inferred_job_category }
```

### 4.5 Analyses (generic table for all 9)
```
analyses (
  id uuid pk, case_id fk, kind text,    -- 'country-comparison'|'jobfit'|...
  envelope jsonb,                       -- the AnalysisEnvelope (incl. stale/version/assumptions)
  status text,                          -- generating|ready|failed
  model text, prompt_version text,
  input_hash text,                      -- sha256 of canonicalized prompt inputs; cache key
  inputs_revision_at_gen int,           -- value of relocation_cases.inputs_revision at gen time
  analysis_version int default 1,       -- bumps on each successful (re)compute of (case_id, kind)
  stale bool default false,             -- materialized from envelope; indexable
  recompute_required bool default false,
  stale_reason text null,
  superseded_by uuid null,              -- when a rerun produces a new row, point old → new
  tokens_in int, tokens_out int, latency_ms int, cost_usd numeric(10,6),
  created_at, updated_at,
  unique(case_id, kind, input_hash)     -- enables cache hits on identical re-runs
)
create index on analyses (case_id, kind, analysis_version desc);
create index on analyses (case_id, stale) where stale = true;
```

**One generic table over 9 specific tables**: every analysis has the same envelope; the `detail` payload is JSONB. Querying by `(case_id, kind)` is fast with a composite index. Migrating to typed tables later is straightforward — by then we know which fields need to be queried structurally.

**Versioning model**: a rerun produces a *new row* with `analysis_version = previous + 1`. The previous row's `superseded_by` is set to the new row's id. The "current" artifact for `(case_id, kind)` is `MAX(analysis_version) WHERE superseded_by IS NULL`. We never mutate envelopes after write — this gives us a free audit trail and lets us roll back a bad prompt version by re-pointing `superseded_by` to NULL on the older row.

**Staleness is a flag on the row, not just the envelope**: keeping `stale` and `recompute_required` as indexed columns lets the orchestration layer answer "what do I need to recompute for case X?" with a single query, without scanning JSONB.

### 4.6 Optional: vector store (for resume↔market embeddings, post-MVP)
```
embeddings (id uuid, owner_kind, owner_id, content text, vector vector(768),
            created_at, idx ivfflat(vector vector_cosine_ops))
```

### 4.7 Telemetry (lightweight)
```
ai_calls (id, case_id, kind, model, prompt_version, tokens_in, tokens_out,
          latency_ms, cost_usd, request_id text, created_at)
```
This is **separate from `analyses`** so we record every call (including retries and failures) without polluting the artifact table. Lets us calculate per-user cost and monitor model drift.

---

## 5. The AI layer (most of the system)

### 5.1 Single gateway
All Gemini calls go through `ai/gateway.py`. Responsibilities:
- Resolve model from `kind` (e.g., `"finance" → "gemini-2.5-pro"`).
- Apply the **shared system prompt prefix** that defines the assistant's persona and the universal envelope contract.
- Inject `response_schema` (Pydantic → JSON schema) so Gemini returns valid JSON or 400s.
- **Retry** on schema validation failure once with feedback ("your previous response was missing field X — return only valid JSON").
- Apply **prompt caching** for the static parts of system prompt + envelope schema (Vertex AI supports this on 2.5 series).
- Record to `ai_calls` table.
- Emit OpenTelemetry span with model, tokens, latency.

Roughly 200–250 lines, single source of truth for everything model-related.

### 5.2 Prompt files
`prompts/` is a directory of versioned text files, one per analysis:
```
prompts/
  resume_extraction.v1.md
  country_comparison.v1.md
  jobfit.v1.md
  visa_direction.v1.md
  family_impact.v1.md
  finance.v1.md
  document_checklist.v1.md
  workflow_graph.v1.md
  culture_prep.v1.md
  timeline.v1.md
  synthesis.v1.md
```
Each prompt is loaded at boot, hashed for the `prompt_version` field. Editing a prompt is a deploy. Versioning lets us A/B compare and roll back without code changes.

**Why files, not strings in code**: prompt review is a non-engineer activity. PR diffs of `.md` files are reviewable by you.

### 5.3 Personalisation
Every prompt receives a **standard context block**:
```
## User profile
<UserProfile JSON>

## Resume extraction
<ResumeExtraction JSON>

## Case context
<RelocationCase inputs JSON>

## Prior analyses (if any)
<list of relevant prior envelopes>
```
This is what makes outputs "highly personalised" — every model call sees the entire user, not just the local form inputs. Token cost is bounded (the full context is ~3–5 K tokens) and Vertex prompt caching makes it nearly free across the parallel batch.

### 5.4 Provider abstraction
```python
class AIProvider(Protocol):
    async def generate(self, *, system: str, user: str, schema: type[BaseModel],
                       model_hint: ModelTier) -> tuple[BaseModel, AICallMetrics]: ...

class VertexGeminiProvider(AIProvider): ...   # the default
class AnthropicProvider(AIProvider): ...      # fallback / future
```
~40 lines plus the implementations. Lets us swap providers per-environment (e.g., Anthropic in dev to avoid GCP cost, Gemini in prod) and add a fallback chain for outages.

### 5.5 Parallelism, latency budget, and partial reruns
After Profile Review (Page 3) submission, the backend kicks off **all 9 analyses in parallel** using `asyncio.gather`. Country-comparison is awaited (the user is still on Page 4). The remaining 8 stream into the database as they complete. Each page from 5–12 either hits a cached result or waits briefly on a still-running task.

**Partial-rerun orchestration (the dependency map).** When the user edits a profile or case input after analyses have run, we don't rerun all 9 — we mark only the affected modules as `stale` and re-execute the smallest correct subset. The map is a single Python constant in `orchestration/dependency_map.py`:

| Input changed | Modules invalidated (in dependency order) |
|---|---|
| `current_salary`, `expected_salary`, `relocation_budget`, `monthly_budget`, `savings`, `cost_sensitivity`, `rent_expectation` | `finance` → `synthesis` |
| `target_country`, `target_city`, `open_to_alternatives`, `alternatives` | `country-comparison` → `visa` → `jobfit` → `documents` → `culture` → `workflow` → `timeline` → `synthesis` |
| `nationality`, `current_visa_status`, `needs_visa_sponsorship` | `visa` → `documents` → `workflow` → `timeline` → `synthesis` |
| `current_country`, `current_city`, `origin_constraints` | `country-comparison` → `finance` → `timeline` → `synthesis` |
| `moving_with_family`, `spouse.*`, `children.*`, `parents.*`, `family_budget_impact`, `housing_requirement` | `family` → `finance` → `documents` → `workflow` → `timeline` → `synthesis` |
| `current_role`, `target_role`, `years_experience`, `seniority`, `skills`, `industry`, `work_preference`, `open_to_role_change` | `jobfit` → `culture` → `workflow` → `timeline` → `synthesis` |
| `move_urgency` | `workflow` → `timeline` → `synthesis` |
| `current_document_status` | `documents` → `workflow` → `timeline` → `synthesis` |
| `priority_ranking` | `synthesis` only |

Algorithm on input edit:
1. Compute the diff between previous `inputs_snapshot` and new inputs. Determine the changed-keys set.
2. For each changed key, look up the impacted modules in the map and union them into `to_invalidate`.
3. Bump `relocation_cases.inputs_revision`; persist new `inputs_snapshot`.
4. For each module in `to_invalidate`, mark its current row `stale=true, recompute_required=true, stale_reason="<key> changed: <old> → <new>"`.
5. Transition case state to `stale`.
6. Schedule reruns in topological order (the map already lists them in that order). Modules within the same "depth" (e.g., `documents` and `culture` both depending on country) run in parallel; downstream ones wait. `synthesis` is always last.
7. Each successful rerun inserts a new row (new `analysis_version`), sets `superseded_by` on the old row, and clears the stale flag. State machine recomputes after each.

Why a static map and not a runtime dependency graph: the dependencies are domain-level invariants, not data-derived. A constant table is greppable, reviewable in PR diffs, and trivially testable. Runtime dependency tracking adds machinery for no win at this scale.

Why we keep the synthesis on every path: the dashboard verdict is the product. Anything that moves a module score must move the verdict.

Two safety rails:
- **Debounce**: rapid consecutive edits within 2 seconds collapse to one rerun batch (the orchestration layer holds a per-case debounce window).
- **Cap**: never auto-rerun more than 3 partial batches per minute per case; the 4th switches to manual ("Refresh analyses" button) to prevent edit-loop cost spikes.

Target wall-clocks (single user, p50):
- Resume parse: 4–6 s (Document AI + Flash)
- Country comparison: 3–5 s (Pro)
- Each of jobfit/visa/family/finance: 4–7 s (Pro, parallel)
- Documents/culture: 2–4 s (Flash, parallel)
- Workflow/timeline: 5–8 s each (Pro, sequential after dependencies)
- Synthesis: 8–12 s (Pro, streamed)

Total wall-clock from Profile Review submit to dashboard ready: ~25 s with parallelism.

### 5.6 Cost estimate
Per complete case (one user end-to-end):
- ~12 Gemini calls, average ~5 K input tokens, ~1.5 K output tokens
- 2 Pro-tier calls (~$0.012 in, $0.018 out per call → ~$0.06)
- 10 Flash + Pro mixed (~$0.04 average each → ~$0.40)
- Document AI parse: ~$0.03
- **Total per user end-to-end: ~$0.50–0.80**

With prompt caching of the standard context block (90% reuse across the 9 calls in one case), realistic cost is **~$0.30 per user**.

### 5.7 Quality controls
- **Schema validation** is non-negotiable. If Gemini returns invalid JSON twice, the analysis returns `status="failed"` with a friendly user message. The frontend shows "We hit a snag generating this — retry?" rather than crashing.
- **Confidence calibration**: prompts instruct the model to self-report confidence using anchored language ("0.3 = guess from limited data, 0.7 = grounded in 3+ user-provided facts, 0.9 = grounded in resume + profile + case + prior analyses"). We log calibration drift in telemetry.
- **Assumptions are mandatory**: the prompt contract requires `assumptions[]` to be non-empty. The gateway rejects (and retries with feedback) any response with an empty list. The gateway also auto-injects rule-based assumptions for known fallbacks: defaulted target city, missing salary currency, family fields inferred from profile, no current_visa_status given, etc. Frontend renders these as a small "Assumptions used" disclosure on every card — visible by default, expandable for detail.
- **Eval set**: 10–20 hand-built case fixtures per analysis live in `tests/fixtures/`. CI runs them on every prompt change and fails the build if scores drift more than ±15%, if any artifact fails to validate, or if `assumptions[]` is empty.
- **Disclaimer footer**: every visa/finance/legal-adjacent envelope includes a non-removable advisory note rendered by the frontend.

---

## 6. GCP setup

### 6.1 Services in use
- **Cloud Run** — FastAPI container (autoscaling 0–10, min 1 in prod for warm starts)
- **Cloud SQL Postgres 16** — single primary, daily backups, `pgvector` extension
- **Vertex AI** — Gemini 2.5 Pro / Flash, region `us-central1` (cheapest, also has prompt caching GA)
- **Document AI** — form parser processor for resume OCR
- **Cloud Storage** — bucket `glimmora-resumes-{env}` with CMEK + lifecycle rule (delete after 90 days unless flagged)
- **Secret Manager** — service account keys, JWT signing key, DB password
- **Cloud Logging + Trace** — OpenTelemetry sink
- **Cloud Tasks** — for the resume parse job (post-MVP; `BackgroundTasks` is fine for v1)

### 6.2 The provided key
> SHA-256 of your provided key + its location are stored in `infra/secrets/.gcp_key.sha256`. It's a placeholder — the real key replaces it via Secret Manager. **The hash itself does not authenticate; only the actual private key file does.** Never log the file contents. Mounted into Cloud Run via Secret Manager volume at `/var/secrets/gcp/key.json`. Backend reads `GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/gcp/key.json`.

### 6.3 IAM (least privilege)
Service account `glimmora-backend@<project>.iam` gets:
- `aiplatform.user` (Vertex AI Gemini)
- `documentai.editor` (Document AI processors)
- `storage.objectAdmin` on the resumes bucket only
- `cloudsql.client` (DB connection)
- `secretmanager.secretAccessor` (JWT key, DB password)

No project-wide editor. No bucket-wide admin.

### 6.4 Regions
Single region `us-central1` for MVP. EU residency comes when we onboard EU users — the architecture supports it (move bucket + DB to `europe-west4`, route via region-aware load balancer), but the doc's W5+ recommendation is good enough for MVP.

---

## 7. File structure (the code is shaped page-by-page on purpose)

```
backend/
├── pyproject.toml
├── README.md
├── alembic/                        # DB migrations
│   └── versions/
├── app/
│   ├── main.py                     # FastAPI app factory, routes registration
│   ├── config.py                   # Pydantic settings (env vars)
│   ├── deps.py                     # FastAPI dependencies (get_db, current_user)
│   ├── middleware/
│   │   ├── auth.py
│   │   ├── tracing.py
│   │   └── error_handler.py
│   │
│   ├── modules/                    # ONE FOLDER PER PAGE/CONCEPT
│   │   ├── auth/
│   │   │   ├── routes.py           # POST /register, /login, /logout
│   │   │   ├── service.py          # business logic
│   │   │   ├── schemas.py          # request/response Pydantic
│   │   │   └── repository.py       # DB queries
│   │   ├── profile/
│   │   │   ├── routes.py           # GET/PATCH /profile
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   ├── case/
│   │   ├── resume/
│   │   │   ├── routes.py
│   │   │   ├── service.py          # GCS upload, Doc AI, kick off parse task
│   │   │   ├── parser.py           # Doc AI client
│   │   │   ├── extractor.py        # Gemini call for ResumeExtraction
│   │   │   ├── schemas.py
│   │   │   └── repository.py
│   │   ├── countries/              # Page 4
│   │   ├── jobfit/                 # Page 5
│   │   ├── visa/                   # Page 6
│   │   ├── family/                 # Page 7
│   │   ├── finance/                # Page 8
│   │   ├── documents/              # Page 9
│   │   ├── workflow/               # Page 10
│   │   ├── culture/                # Page 11
│   │   ├── timeline/               # Page 12
│   │   └── synthesis/              # Page 13 (with SSE streaming)
│   │
│   ├── ai/
│   │   ├── gateway.py              # the single Gemini entry point
│   │   ├── providers/
│   │   │   ├── base.py             # AIProvider Protocol
│   │   │   ├── vertex_gemini.py
│   │   │   └── anthropic.py        # fallback
│   │   ├── caching.py              # prompt context cache
│   │   ├── retry.py
│   │   └── telemetry.py            # writes to ai_calls table
│   │
│   ├── prompts/                    # one .md file per analysis, versioned
│   │   ├── resume_extraction.v1.md
│   │   ├── country_comparison.v1.md
│   │   ├── jobfit.v1.md
│   │   ├── visa_direction.v1.md
│   │   ├── family_impact.v1.md
│   │   ├── finance.v1.md
│   │   ├── document_checklist.v1.md
│   │   ├── workflow_graph.v1.md
│   │   ├── culture_prep.v1.md
│   │   ├── timeline.v1.md
│   │   └── synthesis.v1.md
│   │
│   ├── schemas/                    # shared cross-module Pydantic models
│   │   ├── envelope.py             # AnalysisEnvelope, Risk, NextAction
│   │   ├── profile.py              # UserProfile, ResumeExtraction
│   │   └── case.py                 # RelocationCase
│   │
│   ├── storage/
│   │   ├── db.py                   # SQLAlchemy async engine
│   │   ├── gcs.py                  # Google Cloud Storage client
│   │   └── models.py               # SQLAlchemy ORM models
│   │
│   └── orchestration/
│       ├── analysis_runner.py      # parallel asyncio.gather for the 9 analyses
│       ├── dependency_map.py       # input-key → impacted-modules constant table
│       ├── partial_rerun.py        # diff inputs, mark stale, schedule reruns
│       ├── state_machine.py        # case state transitions
│       └── debounce.py             # per-case 2s debounce + 3-batches/min cap
│
├── tests/
│   ├── unit/                       # one folder mirroring modules/
│   ├── integration/
│   ├── fixtures/                   # eval cases for AI quality
│   │   ├── case_bangalore_to_lisbon_solo.json
│   │   ├── case_mumbai_to_toronto_family.json
│   │   └── ...
│   └── ai_evals/                   # CI-runnable artifact-quality checks
│
└── infra/
    ├── Dockerfile
    ├── cloudrun.yaml
    └── secrets/
        └── .gcp_key.sha256          # placeholder
```

**Why one folder per page/module**: matches the user's stated requirement. Anyone debugging the family page opens `app/modules/family/` and sees: the route, the service, the schema, the repo. No grep across the codebase. Onboarding a new engineer to "fix the visa output" takes 5 minutes.

**Why `ai/` is shared**: 11 modules can't each own a Gemini client. The gateway is the contract; modules construct prompts and consume validated outputs.

**Why `prompts/` is sibling to `ai/` not nested in modules**: prompt review is a cross-module activity. Keeping them in one directory makes them easy to diff, version, and review independently of code changes.

---

## 8. Build order

Sequenced so each step is independently shippable and demoable.

### Week 1 — Foundation (no AI)
1. Project scaffold, Postgres, Alembic, Docker, Cloud Run.
2. Auth module (register/login/refresh). NextAuth on the consumer frontend wired to it.
3. Profile + Case modules (CRUD only).
4. GCS upload + Document AI integration (raw text out, no LLM yet).

**Demo:** user can sign up, upload resume, see extracted text. Boring but solid.

### Week 2 — AI gateway + first 3 analyses
5. AI gateway (Gemini 2.5 client, schema validation, retry, telemetry, prompt caching).
6. Prompt files: `resume_extraction`, `country_comparison`, `jobfit`.
7. Resume extraction wired (Page 2 produces structured ResumeExtraction).
8. Profile review screen consumes auto-fill (Page 3).
9. Country comparison + jobfit analyses (Pages 4, 5).

**Demo:** user uploads resume, gets auto-filled profile, sees their first two real AI-generated artifacts.

### Week 3 — Remaining analyses
10. Visa, family, finance, documents (4 prompt files + routes).
11. Parallel orchestration after Profile Review submit (`asyncio.gather`).
12. Frontend renders all 8 analysis pages from cached envelopes.
13. Case state machine (`state_machine.py`) and SSE channel for state changes.

**Demo:** complete decision-intelligence flow works end-to-end (minus the final synthesis).

### Week 4 — Workflow, timeline, synthesis, freshness, polish
14. Workflow graph + timeline prompts (these depend on prior outputs).
15. Synthesis module with SSE streaming for the final dashboard.
16. Partial-rerun orchestration (`dependency_map.py`, `partial_rerun.py`, `debounce.py`) wired to the profile/case PATCH endpoints. Frontend renders the "Outdated — refreshing…" pill on stale cards.
17. Assumptions block enforcement in the gateway + auto-injected rule-based assumptions. Frontend "Assumptions used" disclosure on every card.
18. Eval suite, telemetry dashboards, error states polished, retry UX.
19. Load test for the parallel batch and the partial-rerun debounce/cap behavior.

**Demo:** the full Page 13 dashboard, streaming verdict in real time, with all module drilldowns wired; editing salary on Page 8 only re-runs finance + synthesis and shows the stale pill briefly.

### Post-MVP backlog (frozen for now)
- Real document upload + OCR validation
- Job board feed integration (job-fit precision)
- FX + tax module (finance precision)
- Family persona variants
- Multiple cases per user
- Multi-region deployment
- Real Stripe billing

---

## 9. Risk register and mitigations

| Risk | Mitigation |
|---|---|
| Gemini returns malformed/non-schema JSON intermittently | Schema-validation retry with feedback in gateway; circuit-break to "failed" state with user-friendly UI after 2 attempts |
| Synthesis prompt is too long (token blowout) | Cap prior-envelope size; truncate `reasoning` strings to 500 chars when feeding into synthesis; monitor `tokens_in` |
| User edits inputs after analyses generated → stale results | Dependency-map-driven partial rerun (§5.5): only invalidate impacted modules; mark `stale=true` + `recompute_required=true`; debounce 2s; cap 3 batches/min/case; case state transitions through `stale → partially_ready → ready` with SSE updates |
| User loses trust because outputs feel hand-wavy | Mandatory `assumptions[]` block on every envelope (gateway-enforced); rule-based auto-injected assumptions cover known fallbacks; frontend renders an "Assumptions used" disclosure on every card |
| Cost spike from a runaway user (replays uploads, edit-loops) | Per-user soft daily quota at the gateway (default 50 analyses/day), 429 above; the partial-rerun cap (3 batches/min/case) blocks edit-loop blowouts; alert on cost-per-user p99 |
| Resume parse fails on weird formats | Document AI handles 95% of layouts; fallback to plain text extraction with `pypdf`; if both fail, prompt user to fill manually |
| Slow Gemini call holds up the parallel batch | Per-call timeout 30s; the batch surfaces partial results — dashboard shows "still computing" badge for any unfinished module; case state stays `partially_ready` until all resolve |
| Prompt regression after an edit | CI runs the eval fixtures on every prompt change; PR fails if outputs differ structurally, if `assumptions[]` is empty, or if scores drift > ±15% |

---

## 10. Definition of Done for v1

- [ ] All 13 frontend pages render real data from the backend, no mocks.
- [ ] Every analysis envelope validates against its Pydantic schema, including non-empty `assumptions[]`.
- [ ] End-to-end happy path (signup → dashboard) under 4 minutes of active interaction, p50.
- [ ] All 9 analyses generate in under 25 seconds wall-clock after Profile Review submit, p50.
- [ ] Editing a single field (salary) triggers only the impacted modules per the dependency map; verified by integration test.
- [ ] Case state transitions (`draft → profile_ready → analyzing → partially_ready → ready → stale → ready`) are observable via SSE and exercised in tests.
- [ ] `analysis_version` increments correctly across reruns; `superseded_by` chain is intact and queryable.
- [ ] Per-user GCP cost < $1.00 at p95.
- [ ] Eval suite passes on a baseline set of 10 case fixtures (validates schema, scores, and assumptions).
- [ ] OpenTelemetry traces for every Copilot turn, queryable in Cloud Trace.
- [ ] Cloud Run autoscales without cold-start over 8s p99.
- [ ] All secrets in Secret Manager; no keys in code.
- [ ] Docs: this file, an OpenAPI spec generated from FastAPI, and a one-page runbook.

---

*End of plan v0.1. Next step on signoff: scaffold the FastAPI repo + Cloud Run setup (Week 1 step 1).*
