# Glimmora Relocate — Frontend QA Walkthrough

This doc is the runbook for QA-ing the consumer frontend after the
**data-first, intent-aware redesign**. Follow it top-to-bottom; every
section says what to click, what should appear, what counts as a fail, and
which backend contract / data-attribute hooks you can target programmatically.

> **What changed in this rev (2026-05-06).** The flow is now strictly
> data-first: the user passes through 8 onboarding steps (goal → resume
> → profile → destination → jobs → family → visa → budget) before
> reaching any analysis page. The profile schema went from ~17 fields
> to **48** (32 patchable from the UI, 25 counted toward completion).
> Country codes (`IN`, `DE`, `NL`) are no longer the primary
> user-facing label — full country names ("India", "Germany",
> "Netherlands") render in every chip, headline, and breadcrumb. ISO
> codes survive only on the wire. See §3 for the new flow, §4a for the
> step-by-step intake, §6 for the expanded contract.

> **Scope of this rev.** Every major page now has at least one bound
> interactive panel that round-trips through the backend. The shell (header,
> ValueLead, intent framing, envelope meta, failed-state guard) is shared,
> and the per-page panel speaks the same shape: a server action that either
> patches the profile or calls `<module>.run()` with a typed body, then
> `router.refresh()` re-runs the React Server Component for the page so the
> user sees the new analysis without a hard reload.

---

## 0. Glossary of `data-*` test hooks

Every interactive surface emits stable hooks. QA scripts (and Playwright)
should only use these — never CSS classes.

| Selector | Where | What it means |
|---|---|---|
| `[data-value-lead]` | Top of every module page | The single unique-insight headline. Must exist exactly once per module. |
| `[data-emphasis="good\|warn\|bad\|neutral"]` | On the ValueLead | Tone class. Useful for asserting a verdict colour. |
| `[data-intent-framing]` | Under the eyebrow | The intent-driven framing line. Absence = page isn't intent-aware. |
| `[data-destination-switcher]` | Country page | Re-target chips. Each chip is a `<button>` with active `disabled`. |
| `[data-destination-code="<iso>"]` | Inside switcher | ISO of each chip; chip TEXT shows the full country name. |
| `[data-origin-destination]` | Country page ValueLead detail | "India → Germany" rendered with full names. |
| `[data-resume-preview]` | Resume page after parse | Container for the extracted-vs-missing preview. |
| `[data-resume-extracted]` | Inside `[data-resume-preview]` | Two-column "We pulled / We'll still ask" block. |
| `[data-onboarding-step="<id>"]` | Onboarding page root | Identifies the active step page (goal/resume/profile/destination/jobs/family/visa/budget). |
| `[data-onboarding-stepper]` | Top of each onboarding page | The 8-step pill strip. |
| `[data-step="<id>"][data-step-state="active\|past\|future"]` | Stepper item | Which step is current vs past vs future. |
| `[data-onboarding-next]` | Continue button on every step | Submits the step form. |
| `[data-country-select]` / `[data-country-select="<purpose>"]` | Country pickers | `<select>` with country names; values are ISO-2. |
| `[data-target-country-name]` | Destination step | Confirms the picked country's full name renders. |
| `[data-nationality-name]` | Visa step | "<Country> passport". |
| `[data-current-country-name]` | Visa step | "Living in <Country>". |
| `[data-alt="<iso>"]` + `[data-alt-active]` | Destination step alternates | Each alternate chip + selected state. |
| `[data-focus="<id>"]` + `[data-focus-active]` | Jobs step focus chips | Career/cost/speed/family/lifestyle. |
| `[data-with-family]` | Family step | The "family is moving with me" checkbox. |
| `[data-profile-completeness]` | Profile review form, top | Bar + percentage + inferred-count pill. |
| `[data-module-panel="<slug>"]` | Each module page | The interactive panel shell. Slug is one of: `country`, `jobs`, `visa`, `family`, `finance`, `documents`, `workflow`, `culture`, `timeline`, `synthesis`. |
| `[data-panel-apply]` | Inside a module-panel | The submit button. |
| `[data-panel-status="pending"\|"applied"]` | Inside a module-panel | After Apply: `pending` while the server action runs, `applied` after success. |
| `[data-panel-error]` | Inside a module-panel | Server-action error message — present means the run threw. |
| `[data-chip="<id>"]` | Inside a panel | Individual chip toggle. The id matches the option id (e.g. `data-chip="career"`). |
| `[data-chip-active="true"\|"false"]` | On chips | Whether the chip is selected. |
| `[data-document-status="have\|need\|expiring\|unknown"]` | Documents panel rows | Per-doc status button. |
| `[data-doc-active]` | Documents panel | Whether the chosen status chip is active. |
| `[data-document-row="<kind>"]` | Documents panel | Wraps each row; `<kind>` is the canonical document key (e.g. `PASSPORT`). |

---

## 1. Local startup

You need two services running.

### Backend (FastAPI, port 8000)

```bash
cd backend
.venv/bin/uvicorn app.main:app --port 8000
```

On boot the app applies any pending alembic migrations and prints a one-line
env summary. Required env (read from `backend/.env`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite locally (`sqlite:///glimmora.db`); managed Postgres on Render |
| `JWT_SECRET` | 32+ chars |
| `GCP_SERVICE_ACCOUNT_JSON_B64` | Base64 service-account JSON (Vertex AI auth) |
| `GEMINI_MODEL` | `gemini-2.5-flash` (default tier) |
| `GEMINI_MODEL_PRO` | optional override for reasoning-tier modules |

Health check: `curl http://localhost:8000/healthz` → `{"status":"ok"}`.

### Consumer (Next.js, port 3000)

```bash
cd apps/consumer
npm install      # first time only
npm run dev
```

Required env (`apps/consumer/.env.local`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./prisma/dev.db` for local; managed Postgres in prod |
| `AUTH_SECRET` | NextAuth JWT signing |
| `GLIMMORA_BACKEND_URL` | `http://localhost:8000` |

`npm run start` (production form) runs `prisma db push --accept-data-loss
--skip-generate && next start` so the consumer DB is always in sync — no
manual migrations needed on Render.

---

## 2. Architecture summary

### Layer ownership

| Layer | Where | Source of truth |
|---|---|---|
| Auth | NextAuth (consumer) | consumer DB (`User`) |
| Profile | FastAPI | backend DB (`user_profiles`) |
| Case | FastAPI | backend DB (`relocation_cases`) |
| 10 analyses | FastAPI + Vertex Gemini | backend DB (`analyses`) |
| **Intent** | consumer DB (`User.intent`) | consumer-only signal that reorders the UI |

Bridge: each consumer user has one `BackendSession` row with backend tokens
+ caseId. The bridge auto-refreshes on a 401 and falls back to login →
register if the refresh token is dead.

Resilience layers:
- Gateway falls back to `StubProvider` on Vertex transport errors.
- `ensureLatestOrRun` synthesizes a failed envelope on any backend error so
  pages render `FailedEnvelopeView` instead of crashing.
- JSON column serializer handles `date`/`datetime`/`Decimal`/`UUID`.
- API client retries once on 401 with `forceRefresh` to recover from the
  expired-access-token race.

### Frontend interactive primitives

All interactive panels share the same shell defined in
[components/backend/module-panel.tsx](apps/consumer/components/backend/module-panel.tsx):

| Component | Purpose |
|---|---|
| `ModulePanel` | Card shell. Owns `useTransition`, `router.refresh()`, and the pending/applied/error visual states. Calls a parent-supplied `onApply: () => Promise<{ok:true} \| {ok:false, error:string}>`. |
| `PanelChips` | Multi/single chip toggle. `multi` mode caps via the parent. Each chip emits `[data-chip]` + `[data-chip-active]`. |
| `PanelInput` | Plain text/number input. Bound through controlled state. |
| `PanelSelect` | Native select. |
| `PanelToggle` | Checkbox + hint. |

### Server action contract

Every panel is wired to a server action in `app/<module>/actions.ts` that:

1. Calls `requirePrereqs()` to get `caseId` (which also enforces the
   intent + profile gates).
2. Optionally `await patchProfile({...})` to persist persistent fields.
3. Calls `await <module>.run(caseId, body)` with the typed body. `force:
   true` is set so the cache is bypassed for the new inputs.
4. Returns `{ ok: true }` or `{ ok: false, error: <string> }`.

The client component then `router.refresh()`s, which causes Next.js to
re-execute the server component for the route. `ensureLatestOrRun` finds
the brand-new analysis row and renders the updated detail.

### Dependency map invalidation (backend)

Profile patches that the panels do are *not* fire-and-forget — the backend
[`orchestration/dependency_map.py`](backend/app/orchestration/dependency_map.py)
maps each changed profile field to a set of analyses that get marked stale
(`recompute_required = true`). The next time those modules are loaded,
`ensureLatestOrRun` re-runs them. This is why the Country panel's
`patchProfile({priority_ranking})` propagates to synthesis on the next
`/app/synthesis` visit, even if synthesis itself wasn't explicitly
re-run.

---

## 2b. Profile schema (48 fields)

The backend profile is the single source of context. Every field below is
on `UserProfile` (Pydantic) and `user_profiles` (SQLAlchemy/SQLite). Source
tracking lives in `field_sources: dict[str, "resume" | "user" | "merged"]`.

### Identity (resume-fillable)
`full_name`, `phone`, `current_role`, `target_role`, `current_employer`,
`industry`, `years_experience`, `seniority`, `skills[]`, `education[]`,
`companies[]`, `certifications[]`, `languages_known[]`,
`destination_language_confidence` (none / A1 / A2 / B1 / B2 / C1 / C2).

### Relocation context
`current_country` (ISO-2), `current_city`, `target_country` (ISO-2),
`target_city`, `nationality` (ISO-2), `current_visa_status`,
`open_to_alternatives`, `alternatives[]` (ISO-2 list, max 5),
`relocation_goal` (the 8 intent IDs), `reason_for_moving`.

### Finance
`current_salary`, `expected_salary`, `salary_currency` (ISO-4217),
`monthly_budget`, `savings`, `rent_expectation`, `cost_sensitivity`
(low / medium / high).

### Intent + ranking
`move_urgency` (asap / 6m / 12m / exploring), `work_preference`
(onsite / hybrid / remote), `relocation_budget`, `needs_visa_sponsorship`,
`priority_ranking[]` (career / family / cost / lifestyle / speed; max 5).

### Household + lifestyle
`family_status` (single / partnered / married / separated / widowed),
`moving_with_family`, `children_count` (0–12), `parents_moving`,
`family_budget_impact` (low / medium / high), `housing_requirement`
(free text), `school_requirement` (none / preschool / primary /
secondary / high / tertiary / special_needs).

### Readiness
`readiness_level` (low / medium / high), `move_clarity_score` (0–100).

### Documents
`current_document_status: dict[str, {has?, expires_at?, notes?}]`.

### Meta
`field_sources` (per-field source map), `completion_percentage` (auto-
computed across the 25 `COMPLETION_FIELDS` in
[backend/app/modules/profile/merge.py](backend/app/modules/profile/merge.py)).

### Resume → profile auto-fill

[merge_resume_into_profile](backend/app/modules/profile/merge.py) writes
these fields from a successful resume parse, **without ever overriding a
field the user has already touched**:

| Resume signal | Profile field |
|---|---|
| `full_name` | `full_name` |
| `phones[0]` | `phone` |
| `current_role` | `current_role` |
| `inferred_job_category` | `target_role` (soft hint) |
| `current_company` | `current_employer` |
| `inferred_industry` | `industry` |
| `years_experience` | `years_experience` |
| `seniority` | `seniority` |
| `skills[]` | `skills[]` |
| `education[]` | `education[]` |
| `experience[].company` | `companies[]` |
| `certifications[].name` | `certifications[]` (flattened to names) |
| `languages[]` | `languages_known[]` (formatted "name (level)") |

What the resume **does not** fill (and the user must answer in the
intake): `target_country`, `target_city`, `nationality`,
`current_country`, `current_visa_status`, `move_urgency`,
`needs_visa_sponsorship`, `relocation_goal`, `reason_for_moving`,
`family_status`, `moving_with_family`, `children_count`,
`current_salary`, `expected_salary`, `savings`, `cost_sensitivity`.

---

## 2c. Country display layer

Backend stores ISO-3166-1 alpha-2 (e.g. `DE`). Frontend never renders
that as the primary label. Use [lib/countries.ts](apps/consumer/lib/countries.ts):

```ts
import { countryName, originDestinationLabel, lookupCountryByName, countryOptions } from "@/lib/countries";

countryName("DE");                          // "Germany"
countryName(profile.target_country);        // "Germany" (or "" if null)
originDestinationLabel("IN", "DE");         // "India → Germany"
lookupCountryByName("germany");             // "DE"
lookupCountryByName("uk");                  // "GB" (alias)
countryOptions();                           // [{value:"AT",label:"Austria"}, ...] sorted
```

The catalogue is curated to ~50 countries — the destinations the product
actively supports plus common origin countries. Adding more: append to
`COUNTRIES` in [lib/countries.ts](apps/consumer/lib/countries.ts).

Where the layer is used today:
- Onboarding destination step (target country picker + chip grid).
- Onboarding visa step (nationality + current country pickers).
- Country page ValueLead headline ("Match for Germany") + origin →
  destination subtitle (`[data-origin-destination]`).
- Country page DestinationSwitcher chips (`[data-destination-code="DE"]`
  on each chip; chip text is `countryName(c)`).

Where ISO codes still legitimately appear (do **not** flag these):
- Hidden form `value=` attributes on `<select>` / `<button>` elements.
- HTTP request bodies (the wire format).
- The `[data-destination-code]` attribute (present so Playwright can
  target chips by ISO).

Anywhere else, an ISO-only label visible to the user is a regression.

---

## 3. The data-first onboarding flow

```
Sign-up
  ↓
/app/onboarding/goal          ← Step 1. Relocation goal + reason for moving.
  ↓
/app/onboarding/resume        ← Step 2. Auto-fill from PDF/DOCX.
  ↓
/app/onboarding/profile       ← Step 3. Confirm identity gaps the resume couldn't fill.
  ↓
/app/onboarding/destination   ← Step 4. Target country (full name) + city + alternates.
  ↓
/app/onboarding/jobs          ← Step 5. Target role, focus, sponsorship, work mode.
  ↓
/app/onboarding/family        ← Step 6. Family status, who's moving, schooling.
  ↓
/app/onboarding/visa          ← Step 7. Nationality + current country/visa status.
  ↓
/app/onboarding/budget        ← Step 8. Salary, savings, monthly budget, sensitivity.
  ↓
/app/country  /app/jobs  /app/visa  /app/family  /app/finance
/app/documents  /app/workflow  /app/culture  /app/timeline
  ↓
/app/synthesis                ← Verdict + recommended path.
```

The legacy URL `/app/onboarding/intent` redirects to `/app/onboarding/goal`.
The gate (`requirePrereqs`) now uses `evaluateOnboarding()` from
[lib/onboarding.ts](apps/consumer/lib/onboarding.ts), which inspects the
profile and redirects the user to the **first incomplete step**. A user
landing on `/app/jobs` mid-onboarding is bounced back to the right step
automatically — no module page renders against a thin profile.

The user picks one of these intents; the system reorders sidebar,
emphasises specific modules, and reframes module copy:

| Intent ID | Lead module | Story |
|---|---|---|
| `compare_countries` | country | "Best destination match" |
| `relocate_with_offer` | visa | "What it takes to land your offer" |
| `find_job_abroad` | jobs | "Your most realistic job pathway" |
| `visa_feasibility` | visa | "The visa route most likely to clear" |
| `family_relocation` | family | "What this move costs your household" |
| `stress_test_affordability` | finance | "Whether the numbers work" |
| `documents_timeline` | documents | "Shortest realistic path to ready" |
| `move_fast` | timeline | "Fastest path that actually clears" |

The intent is stored on `User.intent` and read by the layout (sidebar
ordering + badge), `requirePrereqs()` (gate), and each module page (eyebrow
framing line + `intentFraming` copy slot).

---

## 4. Page-by-page walkthrough

For each page: **what you click → what should appear → fail signals**.

> Every onboarding page is wrapped in `OnboardingShell` and has the
> `[data-onboarding-step="<id>"]` attribute on its root and a stepper
> (`[data-onboarding-stepper]`) at the top showing all 8 steps. The
> active step is `[data-step="<id>"][data-step-state="active"]`.

### Sign-up `/sign-up`
- Click: fill name/email/password, accept terms, submit.
- Should: redirect to `/app/onboarding/goal` (data-first onboarding step 1).
- Fail: stays on /sign-up with a red error; or lands directly on /app.

### Step 1 — Goal `/app/onboarding/goal`
- Click: pick one of 8 tiles (`[data-intent="<id>"]`) → optionally fill
  the "why this move?" line → Continue.
- Should: `User.intent` AND `profile.relocation_goal` AND
  `profile.reason_for_moving` saved, redirect to `/app/onboarding/resume`.
  Sidebar now shows "Your goal: <label>" badge and the Analysis section
  reorders to lead with the intent's lead module.
- Fail: button disabled (no selection), redirect doesn't happen, sidebar
  unchanged.
- **Unique value**: the system asks the only question that frames every
  page that follows.

### Step 2 — Resume `/app/onboarding/resume`
- Click: pick PDF/DOCX → "Upload + parse". Wait ~30–60s for AI.
- Should: status `ready` → **extracted preview** appears
  (`[data-resume-preview]`) with a "We pulled" column showing name, phone,
  current role, current employer, target role (inferred), industry,
  seniority, years experience, skills, certifications, languages,
  education, companies. The right column lists "We'll still ask"
  (destination, family, visa, budget — always at the bottom).
  Click "Looks right · Apply to my profile" → redirect to profile.
- Status `failed` → "Couldn't parse this file" callout with retry/skip.
- **Unique value**: turns a resume into a 14-field starting profile in
  one shot — then asks you to confirm what was lifted before it goes any
  further.

### Step 3 — Profile `/app/onboarding/profile`
- Should see at the top: **completeness meter** (`data-profile-completeness`)
  with bar tone (red <40%, gilt <75%, green ≥75%) and an "N fields from resume"
  pill. Resume-inferred fields are tagged with `(from resume)` next to the label.
- The form is now identity-only (full name, current role, industry,
  seniority, years experience, work preference). Destination, salary,
  visa, and family fields have moved into dedicated later steps.
- Click: confirm inferred fields, fill any blanks → Save.
- Should: redirect to `/app/onboarding/destination`.
- **Unique value**: confirm what the AI inferred, no longer asked to
  re-type things the resume already provided.

### Step 4 — Destination `/app/onboarding/destination`
- Visual: a country picker that shows full names ("Germany", "Netherlands")
  via [lib/countries.ts](apps/consumer/lib/countries.ts) — never ISO codes.
- Inputs:
  - Target country select (`[data-country-select]`). Confirms by rendering
    `[data-target-country-name]` with the chosen full name.
  - Target city — free text, optional.
  - "Open to alternates" toggle — when on, shows a chip grid of country
    names; pick up to 3 to send as `alternatives` on the run body.
- Click: Continue.
- Saves: `target_country`, `target_city`, `open_to_alternatives`,
  `alternatives` (filtered to exclude target).
- Redirect: `/app/onboarding/jobs`.
- **Unique value**: destination chosen by name, plus a real shortlist
  the country comparison module reads.

### Step 5 — Jobs intake `/app/onboarding/jobs`
- Inputs: target role (text, max 160), industry (text, max 80),
  focus chips (multi, max 2: career/cost/speed/family/lifestyle), expected
  salary + currency, work preference (onsite/hybrid/remote), open-to-role-change
  toggle, needs-visa-sponsorship toggle.
- Saves: `target_role`, `industry`, `priority_ranking`, `expected_salary`,
  `salary_currency`, `work_preference`, `needs_visa_sponsorship`.
- Redirect: `/app/onboarding/family`.
- **Unique value**: the jobfit + culture analyses now have a real career
  angle to score against, not just resume scrap.

### Step 6 — Family intake `/app/onboarding/family`
- Inputs: family status (single/partnered/married/separated/widowed),
  "family is moving with me" toggle, then conditional: children count
  (0–12), schooling need, parents-moving toggle, housing requirement
  (free text), family budget pressure.
- Saves: `family_status`, `moving_with_family`, `children_count`,
  `school_requirement`, `parents_moving`, `housing_requirement`,
  `family_budget_impact`.
- Redirect: `/app/onboarding/visa`.
- **Unique value**: the family analysis is no longer guessing — solo vs
  household decides budget, visa route, school search, timeline.

### Step 7 — Visa intake `/app/onboarding/visa`
- Inputs: nationality (country picker, full names), current country
  (country picker), current city (text), current visa / residence status
  (text).
- Confirms by rendering `[data-nationality-name]` ("India passport") and
  `[data-current-country-name]` ("Living in India").
- Saves: `nationality`, `current_country`, `current_city`,
  `current_visa_status`.
- Redirect: `/app/onboarding/budget`.
- **Unique value**: the visa module knows your passport and your sit
  before it tries to recommend a route.

### Step 8 — Budget intake `/app/onboarding/budget`
- Inputs: current annual salary, expected annual salary (target market),
  savings/runway, monthly post-move budget, currency (3-letter ISO),
  cost sensitivity (low/medium/high), move urgency (asap/6m/12m/exploring).
- Saves: `current_salary`, `expected_salary`, `savings`, `monthly_budget`,
  `salary_currency`, `cost_sensitivity`, `move_urgency`.
- Redirect: `/app/country` — the first analysis page.
- **Unique value**: the finance module gets a real cost picture, not a
  default; the gate also unblocks all 10 analysis pages.

> **Per-module pattern.** Every module page below renders **three** required
> elements:
> 1. `[data-value-lead]` — one unique insight at the top.
> 2. `[data-intent-framing]` — the eyebrow line driven by the user's intent.
> 3. `[data-module-panel="<slug>"]` — the interactive panel. Each panel has a
>    `[data-panel-apply]` button. After clicking it the panel shows
>    `[data-panel-status="pending"]` then `="applied"` and the page refreshes
>    with the new analysis.

### Country `/app/country`
- ValueLead: `Match for DE · 73/100 · Strong fit` with rationale.
- DestinationSwitcher chips (DE / NL / IE / GB / CA / AU / AE / SG) — click
  one to re-run the analysis for that target.
- **Module panel — "What matters most for this comparison?"**:
  - Priority chips (career / cost / family / lifestyle / speed, max 3).
  - "Why this country?" one-liner.
  - Comma-separated alternates (ISO-2, max 3) for cross-comparison.
  - Apply → patches `priority_ranking`, calls `country.run` with
    `open_to_alternatives` + `alternatives` + `reason_for_moving`.
- **Unique value**: one verdict + the ability to swap target *and* tell the
  system what to weight.

### Job fit `/app/jobs`
- ValueLead: "Direction we'd back · <inferred role>" + fastest pathway.
- **Module panel — "Sharpen your career angle"**:
  - Target role, preferred industry.
  - Focus chips (role fit / salary / speed / visa friendly / lifestyle).
  - Salary min/max in your currency.
  - Work mode (onsite/hybrid/remote).
  - Toggles: open to adjacent roles, needs visa sponsorship.
  - Apply → patches profile (industry, work_preference, sponsorship,
    expected_salary, currency, priority_ranking) + calls `jobfit.run` with
    body that includes role/industry/salary/work mode.
- **Unique value**: a real career-direction engine — answers shape every
  pathway, salary realism note, and visa-employability score.

### Visa `/app/visa`
- ValueLead: route name + difficulty + top blocker.
- **Module panel — "Confirm what you have on paper"**:
  - Nationality (ISO-2), current visa status, employment status (5 options),
    sponsor required toggle, family relocation toggle.
  - Apply → patches profile (nationality, current_visa_status, sponsorship)
    + calls `visa.run` with full body.
- **Unique value**: the route depends massively on these inputs — the panel
  surfaces them so the user can refine until the route makes sense.

### Family `/app/family`
- ValueLead: solo vs household + family-fit score.
- **Module panel — "Set up your household"**:
  - Move shape (solo / with_family).
  - Spouse: moving toggle → has career, profession, work-visa-required.
  - Children: add/remove rows; each has age + schooling need (none →
    special_needs).
  - Parents: moving toggle → dependency_level + healthcare_sensitivity.
  - Free-text housing requirement, family budget pressure (low/med/high),
    family priority (schooling/spouse_career/healthcare/housing/speed).
  - Apply → calls `family.run` with the full structure + maps the family
    priority onto `priority_ranking`.
- **Unique value**: turns the move into a real household decision; spouse,
  kids, parents, housing all reshape outlook + warnings + suggestions.

### Finance `/app/finance`
- ValueLead: signed monthly surplus + runway + affordability score.
- **Module panel — "Stress-test the numbers"**:
  - Monthly budget, rent willing to pay, savings, household size.
  - Cost sensitivity (low/medium/high — controls how strict affordability
    is).
  - Apply → patches `relocation_budget` + calls `finance.run` with budget,
    savings, rent, family_size, cost_sensitivity.
- **Unique value**: separates "possible on paper" from "comfortable" by
  letting the user dial the sensitivity.

### Documents `/app/documents`
- ValueLead: readiness % + missing count + next-to-handle.
- **Module panel — "Mark what you actually have"**:
  - Each checklist row gets four chips: Have / Need / Expiring / Unknown.
    The active state has the matching tone (green / red / gilt / ink).
  - Apply → patches `current_document_status` map + calls
    `documents.run` with the same map → readiness % + checklist rebuild.
- **Unique value**: the only practical way to get a real readiness score.

### Workflow `/app/workflow`
- ValueLead: total days end-to-end + blocker count.
- **Module panel — "Reorder how you'd actually do it"**:
  - "Optimise for" priority chips (top 2 of speed/career/family/cost/lifestyle).
  - "Start with" focus chips (visa / documents / jobs / family / finance /
    logistics).
  - Apply → patches `priority_ranking` + force-runs workflow.
- **Unique value**: the user can shape the order of execution.

### Culture `/app/culture`
- ValueLead: top first-week kit item + language target.
- **Module panel — "What worries you about settling in?"**:
  - Top concern chips (language / workplace / isolation / family_adapt /
    daily_life).
  - Local-language confidence select (none → C2).
  - Apply → maps concern → `priority_ranking` (e.g. workplace→career,
    family_adapt→family) + force-runs culture.
- **Unique value**: cultural advice slanted to the worry the user named.

### Timeline `/app/timeline`
- ValueLead: earliest realistic start + week range.
- **Module panel — "Pace this move"**:
  - Move urgency select (asap / 6m / 12m / exploring).
  - Move style chips (fast / safe / with_family).
  - Apply → patches `move_urgency` + style→`priority_ranking` (fast→speed,
    safe→lifestyle, with_family→family) + force-runs timeline.
- **Unique value**: lets the user ask "what if I had to move faster?"

### Synthesis `/app/synthesis`
- ValueLead: verdict + feasibility score + one-line reasoning + CTA.
- Detail: recommended destination, recommended job path, module scoreboard,
  top blockers, next best actions, expandable explanation, risks,
  assumptions.
- **Module panel — "Confirm what matters most"** (at the bottom — verdict
  comes first):
  - Outcome you most want: career / cost / lifestyle / family / speed.
  - Top concern: wrong_country / wrong_role / money_tight / visa_blocks /
    family_disruption / timeline_slips.
  - Apply → patches `priority_ranking` + force-runs synthesis. Verdict and
    next_best_actions reorder around the chosen priority.
- **Unique value**: the verdict makes sense in *your* context, not the
  generic average's.

---

## 4b. Module panels — technical reference

This section is the source of truth for what each panel does, what it
sends to the backend, and what to assert when QA-ing.

> **Convention.** "Patches" means `PATCH /api/v1/profile` with the listed
> keys. "Runs" means `POST /api/v1/case/{caseId}/<slug>/run` with the
> listed body. Both happen inside the panel's server action; the order is
> always patch-first, run-second.

### Country — `data-module-panel="country"`

- **File:** [app/app/country/preferences-panel.tsx](apps/consumer/app/app/country/preferences-panel.tsx)
- **Action:** [app/app/country/actions.ts](apps/consumer/app/app/country/actions.ts) → `applyCountryPreferencesAction`
- **Inputs:**
  - Priority chips, multi, capped at 3. IDs: `career | cost | family | lifestyle | speed`.
  - "Why this country?" free-text (one line).
  - Alternates input: comma-separated ISO-2 codes, max 3. Validated client-side via `/^[A-Z]{2}$/`.
- **Patches:** `priority_ranking: Priority[]`.
- **Runs:** `country.run(caseId, { open_to_alternatives: alts.length > 0, alternatives, reason_for_moving, force: true })`.
- **Body schema:** `CountryComparisonInputs` (`extra="forbid"`). Unknown keys → 422.
- **Backend invalidation map (via priority_ranking change):** `synthesis` only (priority_ranking key triggers synthesis recompute).
- **Backend invalidation map (via reason_for_moving / alternatives in body):** body fields are scoped to this run only — they don't mutate the profile, so no cascade.
- **Companion:** `DestinationSwitcher` (`data-destination-switcher`) saves `target_country` directly via `switchDestinationAction`. Changing target_country invalidates **all** modules.
- **What to assert:**
  - `[data-chip="career"]` exists and toggling it sets `[data-chip-active="true"]`.
  - Selecting > 3 priorities silently caps (panel slices the array).
  - After Apply, `[data-panel-status="applied"]` appears, then the page refreshes; the new `recompute_required` flag on the country row drives a re-run.

### Jobs — `data-module-panel="jobs"`

- **File:** [app/app/jobs/jobs-panel.tsx](apps/consumer/app/app/jobs/jobs-panel.tsx)
- **Action:** [app/app/jobs/actions.ts](apps/consumer/app/app/jobs/actions.ts) → `applyJobsPreferencesAction`
- **Inputs:**
  - `target_role` text (max 160 chars per backend schema).
  - `preferred_industry` text (max 80).
  - Focus chips, multi, capped at 2. Mapped to `priority_ranking`.
  - `salary_min` / `salary_max` numeric inputs (≥0). Currency is read from profile, defaulted to "EUR".
  - `work_mode` select: `onsite | hybrid | remote`.
  - Toggles: `open_to_role_change`, `needs_visa_sponsorship`.
- **Patches:** `industry`, `work_preference`, `needs_visa_sponsorship`, `expected_salary` (max-or-min fallback), `salary_currency`, `priority_ranking`.
- **Runs:** `jobfit.run(caseId, { target_role, preferred_industry, salary_range_min, salary_range_max, salary_currency, work_mode, needs_visa_sponsorship, open_to_role_change, force: true })`.
- **Body schema:** `JobFitInputs`. Salary values `ge=0`, currency `min_length=3 max_length=3`.
- **Cascades:** `industry`, `work_preference`, `needs_visa_sponsorship`, `expected_salary`, `salary_currency` each invalidate the modules listed in `_DEPENDENCY_MAP` (jobfit, finance, culture, etc.).
- **What to assert:**
  - Salary range respects backend `Field(ge=0)`. A negative number returns 422 → `[data-panel-error]` appears.
  - Toggling visa sponsorship to a different value invalidates visa + documents + workflow + timeline (visible on next nav).

### Visa — `data-module-panel="visa"`

- **File:** [app/app/visa/visa-panel.tsx](apps/consumer/app/app/visa/visa-panel.tsx)
- **Action:** [app/app/visa/actions.ts](apps/consumer/app/app/visa/actions.ts) → `applyVisaPreferencesAction`
- **Inputs:**
  - `nationality` ISO-2 (validated `/^[A-Z]{2}$/` client-side; backend rejects with 422 if 422 input).
  - `current_visa_status` text (max 80).
  - `employment_status` select: `employed | with_offer | self_employed | studying | unemployed`.
  - `sponsor_required`, `family_relocation` toggles.
- **Patches:** `nationality`, `current_visa_status`, `needs_visa_sponsorship`.
- **Runs:** `visa.run(caseId, { nationality, current_visa_status, sponsor_required, family_relocation, employment_status, force: true })`.
- **Body schema:** `VisaInputs`.
- **Cascades:** `nationality` and `current_visa_status` each invalidate `visa, documents, workflow, timeline`. `needs_visa_sponsorship` adds `jobfit`.
- **What to assert:**
  - Entering "in" (lowercase) gets uppercased before send: client `.toUpperCase().slice(0, 2)`.
  - 1-letter input throws panel-error (validated before submit).

### Family — `data-module-panel="family"`

- **File:** [app/app/family/family-panel.tsx](apps/consumer/app/app/family/family-panel.tsx)
- **Action:** [app/app/family/actions.ts](apps/consumer/app/app/family/actions.ts) → `applyFamilyShapeAction`
- **Inputs:**
  - `mode` select: `solo | with_family`. Toggles whether spouse/children/parents fields render.
  - Spouse subform (when `mode="with_family"` and "Spouse is moving" toggle is on):
    `moving (true)`, `has_career`, `profession` (max 120), `work_visa_required`.
  - Children rows: dynamic add/remove. Each row has `age` (number, 0-25) and `schooling_need` select (none / preschool / primary / secondary / high / tertiary / special_needs).
    Rows with non-numeric or out-of-range ages are dropped client-side before send.
  - Parents subform (toggle): `moving`, `dependency_level` (none / low / medium / high / full_dependency), `healthcare_sensitivity` (low / medium / high).
  - `housing_requirement` text (max 200).
  - `family_budget_impact` select: `low | medium | high`.
  - `family_priority` select: `schooling | spouse_career | healthcare | housing | speed`.
- **Patches:** `priority_ranking` (mapped from `family_priority`):
  | family_priority | maps to priority_ranking |
  |---|---|
  | schooling | family |
  | spouse_career | career |
  | healthcare | family |
  | housing | cost |
  | speed | speed |
- **Runs:** `family.run(caseId, { moving_with_family, spouse?, children, parents?, housing_requirement, family_budget_impact, force: true })`.
- **Body schema:** `FamilyInputs` with nested `SpouseInput`, `ChildInput`, `ParentsInput`.
- **Cascades:** `moving_with_family`, `spouse`, `children`, `parents` each invalidate family, finance, documents, workflow, timeline. `housing_requirement` and `family_budget_impact` invalidate family + finance.
- **What to assert:**
  - Selecting `mode = "solo"` collapses the spouse/children/parents UI; the run body sends `moving_with_family: false` and no nested objects.
  - Removing a child row removes it from the array sent to backend.

### Finance — `data-module-panel="finance"`

- **File:** [app/app/finance/finance-panel.tsx](apps/consumer/app/app/finance/finance-panel.tsx)
- **Action:** [app/app/finance/actions.ts](apps/consumer/app/app/finance/actions.ts) → `applyFinanceSensitivityAction`
- **Inputs:**
  - `monthly_budget` (≥0), `rent_expectation` (≥0), `savings` (≥0), `family_size` (1–12).
  - `cost_sensitivity` select: `low | medium | high`.
  - Currency comes from `profile.salary_currency`.
- **Patches:** `relocation_budget` ← `savings` (so the figure persists for the next analysis).
- **Runs:** `finance.run(caseId, { monthly_budget, savings, rent_expectation, family_size, cost_sensitivity, salary_currency, force: true })`.
- **Body schema:** `FinanceInputs`.
- **Cascades:** `relocation_budget` invalidates `finance` only (the run-body fields are scoped to the run).
- **What to assert:**
  - Empty inputs are sent as `undefined` (the action uses ternary `value ? Number(value) : null` then drops null via spread).
  - Increasing `cost_sensitivity` should lower `affordability_score` on next render (semantic check, not DOM-assertable — but it's the headline rule).

### Documents — `data-module-panel="documents"`

- **File:** [app/app/documents/documents-panel.tsx](apps/consumer/app/app/documents/documents-panel.tsx)
- **Action:** [app/app/documents/actions.ts](apps/consumer/app/app/documents/actions.ts) → `applyDocumentStatusAction`
- **Inputs:**
  - One row per checklist item from the latest envelope (`envelope.detail.items`).
  - Each row has 4 status chips: `have | need | expiring | unknown`. Active chip styled by status tone.
- **Sent map shape:**
  | UI status | Sent in `current_document_status[kind]` |
  |---|---|
  | have | `{ has: true }` |
  | need | `{ has: false }` |
  | expiring | `{ has: true, notes: "expiring soon" }` |
  | unknown | omitted (no entry sent for that kind) |
- **Patches:** `current_document_status: <map>`.
- **Runs:** `documents.run(caseId, { current_document_status, force: true })`.
- **Body schema:** `DocumentsInputs` with `current_document_status: dict[str, DocumentStatusInput]`. Each value: `{ has?: bool, expires_at?: ISO date, notes?: str (max 240) }`. `extra="forbid"`.
- **Cascades:** `current_document_status` invalidates `documents, workflow, timeline`.
- **What to assert:**
  - Marking a row "have" → after Apply the readiness % rises; "need" → it falls.
  - The kind on the wire must match the canonical document key (e.g. `PASSPORT`, not `passport` — the backend's `ChecklistItem.kind` validator enforces this).

### Workflow — `data-module-panel="workflow"`

- **File:** [app/app/workflow/workflow-panel.tsx](apps/consumer/app/app/workflow/workflow-panel.tsx)
- **Action:** [app/app/workflow/actions.ts](apps/consumer/app/app/workflow/actions.ts) → `applyWorkflowPriorityAction`
- **Inputs:**
  - "Optimise for" priority chips, multi, capped at 2. IDs match backend `Priority` enum.
  - "Start with" focus chips, single. IDs: `visa | documents | jobs | family | finance | logistics`. Currently used only to influence the UI (the workflow run body has only `force`).
- **Patches:** `priority_ranking: Priority[]`.
- **Runs:** `workflow.run(caseId, { force: true })`.
- **Body schema:** `WorkflowInputs` accepts only `force`. Future per-step controls plug in here without a route change.
- **Cascades:** priority_ranking → synthesis.
- **What to assert:**
  - Apply with empty priorities still works (priority_ranking gets set to `[]`).

### Culture — `data-module-panel="culture"`

- **File:** [app/app/culture/culture-panel.tsx](apps/consumer/app/app/culture/culture-panel.tsx)
- **Action:** [app/app/culture/actions.ts](apps/consumer/app/app/culture/actions.ts) → `applyCulturePreferencesAction`
- **Inputs:**
  - Top-concern chips, single: `language | workplace | isolation | family_adapt | daily_life`.
  - `language_confidence` select: `none | A1 | A2 | B1 | B2 | C1 | C2`.
- **Concern → priority_ranking mapping:**
  | concern | priority_ranking |
  |---|---|
  | language | lifestyle |
  | workplace | career |
  | isolation | lifestyle |
  | family_adapt | family |
  | daily_life | lifestyle |
- **Patches:** `priority_ranking: [mapped]`.
- **Runs:** `culture.run(caseId, { force: true })` (body schema accepts only `force`).
- **What to assert:**
  - Different concerns produce different priority ranking on subsequent profile reads.

### Timeline — `data-module-panel="timeline"`

- **File:** [app/app/timeline/timeline-panel.tsx](apps/consumer/app/app/timeline/timeline-panel.tsx)
- **Action:** [app/app/timeline/actions.ts](apps/consumer/app/app/timeline/actions.ts) → `applyTimelinePreferencesAction`
- **Inputs:**
  - `move_urgency` select: `asap | 6m | 12m | exploring`.
  - Move-style chips, single: `fast | safe | with_family`.
- **Style → priority_ranking mapping:**
  | style | priority_ranking |
  |---|---|
  | fast | speed |
  | safe | lifestyle |
  | with_family | family |
- **Patches:** `move_urgency`, `priority_ranking: [mapped]`.
- **Runs:** `timeline.run(caseId, { force: true })`.
- **Cascades:** `move_urgency` invalidates `workflow, timeline`.
- **What to assert:**
  - Switching `asap` → `exploring` should widen the `estimated_total_weeks_max` on the next render.

### Synthesis — `data-module-panel="synthesis"`

- **File:** [app/app/synthesis/synthesis-panel.tsx](apps/consumer/app/app/synthesis/synthesis-panel.tsx)
- **Action:** [app/app/synthesis/actions.ts](apps/consumer/app/app/synthesis/actions.ts) → `applySynthesisFocusAction`
- **Inputs:**
  - Outcome chips, single: `career | cost | lifestyle | family | speed` (matches `Priority` enum).
  - Top-concern chips, single: `wrong_country | wrong_role | money_tight | visa_blocks | family_disruption | timeline_slips` (UI-only signal — currently surfaces in the panel but not on the wire).
- **Patches:** `priority_ranking: [outcome]`.
- **Runs:** `synthesis.run(caseId, { force: true })`.
- **Position on page:** intentionally rendered AFTER the verdict + scoreboard + risks + assumptions block — verdict comes first, the user confirms what mattered second.
- **What to assert:**
  - The `[data-module-panel="synthesis"]` element appears below `[data-value-lead]` (in DOM order), not above.

---

## 5. Backend endpoint mapping

| Page | Read endpoint (initial render) | Run endpoint (panel apply) | Required profile fields |
|---|---|---|---|
| Resume upload | `POST /api/v1/resume/upload`, `POST /api/v1/resume/{id}/apply` | — | — |
| Profile review | `GET /api/v1/profile`, `PATCH /api/v1/profile` | — | — |
| Country | `GET /api/v1/case/{caseId}/country-comparison` | `POST .../country-comparison/run` | `target_country` |
| Jobs | `GET .../job-fit` | `POST .../job-fit/run` | `target_country`, role/skills |
| Visa | `GET .../visa` | `POST .../visa/run` | `target_country`, **`nationality`** |
| Family | `GET .../family` | `POST .../family/run` | `target_country`, family mode |
| Finance | `GET .../finance` | `POST .../finance/run` | salary, target country |
| Documents | `GET .../documents` | `POST .../documents/run` | nationality + visa route |
| Workflow | `GET .../workflow` | `POST .../workflow/run` | upstream |
| Culture | `GET .../culture` | `POST .../culture/run` | target country, role |
| Timeline | `GET .../timeline` | `POST .../timeline/run` | upstream blockers |
| Synthesis | `GET .../synthesis` | `POST .../synthesis/run` | all upstream |

All `ensure` calls go through the typed client's `ensureLatestOrRun`, which
synthesizes a failed envelope on any backend error. The Run endpoints
accept the typed body documented in §4b.

### Profile field → invalidated modules

This is what `_DEPENDENCY_MAP` looks like at a glance. Useful for predicting
side-effects of a panel apply.

| Changed key | Invalidates |
|---|---|
| `current_salary`, `expected_salary`, `salary_currency`, `relocation_budget`, `monthly_budget`, `savings`, `rent_expectation`, `cost_sensitivity` | finance |
| `target_country` | country, visa, jobfit, family, documents, culture, workflow, timeline |
| `target_city` | country, family, culture, workflow, timeline |
| `open_to_alternatives`, `alternatives` | country, jobfit |
| `nationality`, `current_visa_status` | visa, documents, workflow, timeline |
| `needs_visa_sponsorship` | visa, jobfit, documents, workflow, timeline |
| `current_country` | country, finance, timeline |
| `current_city` | country, finance |
| `origin_constraints` | timeline |
| `moving_with_family`, `spouse`, `children`, `parents` | family, finance, documents, workflow, timeline |
| `family_budget_impact`, `housing_requirement` | family, finance |
| `current_role`, `target_role`, `work_preference` | jobfit, culture |
| `industry`, `years_experience`, `seniority`, `skills`, `open_to_role_change` | jobfit |
| `move_urgency` | workflow, timeline |
| `current_document_status` | documents, workflow, timeline |
| `priority_ranking` | synthesis (always appended on any change) |

---

## 5b. Manual QA — how to test a panel by hand

For each module, run this routine in the browser DevTools:

1. Open the Network panel, filter by `Fetch/XHR`, then load the module page.
2. Confirm the initial paint fired one of `GET /api/v1/case/.../<slug>` (latest)
   or `POST /api/v1/case/.../<slug>/run` (when no row existed yet).
3. Locate the panel via DevTools: `document.querySelector('[data-module-panel]')`.
4. Make a change, click the `[data-panel-apply]` button.
5. Confirm in the Network tab:
   - One `PATCH /api/v1/profile` with the panel's expected keys (or none if
     the module's action only re-runs).
   - One `POST /api/v1/case/.../<slug>/run` with `force: true` and the
     typed body keys.
6. Confirm the panel transitions through `[data-panel-status="pending"]` →
   `[data-panel-status="applied"]`.
7. Confirm the page re-renders with the new envelope (analysis_version
   bumps in the meta line, and the ValueLead headline can change).
8. If the run errors, `[data-panel-error]` should show the exact backend
   error message.

---

## 6. Verification checklist

Run this list before declaring a build "demo-ready".

### Stack-up
- [ ] `curl http://localhost:8000/healthz` returns 200.
- [ ] `curl http://localhost:3000/api/auth/csrf` returns CSRF JSON.
- [ ] No TS errors: `npx tsc --noEmit` from `apps/consumer`.

### Auth + intent
- [ ] Sign-up redirects to `/app/onboarding/intent` (not `/app`).
- [ ] All 8 intent tiles render with label + hint.
- [ ] Picking one + Continue saves to `User.intent` and redirects to
      `/app/onboarding/resume`.
- [ ] After login, sidebar shows "Your goal: <label>" badge.
- [ ] Module order in sidebar reflects the intent emphasis (e.g.,
      `find_job_abroad` puts Jobs above Country).

### Resume + profile
- [ ] PDF upload returns `ready` for a clean resume; `failed` shows the
      retry callout (no crash, no `length of undefined`).
- [ ] Profile review pre-fills inferred fields, accepts edits, saves with
      a single click, redirects to /app/country.

### Per-module (run for at least one happy path)
- [ ] Each module page shows a `[data-value-lead]` block at the top.
- [ ] Each module page shows a `[data-intent-framing]` line under the
      eyebrow.
- [ ] Each module page shows a `[data-module-panel]` interactive panel
      with at least one input + an apply button.
- [ ] Clicking apply on a panel shows
      `[data-panel-status="pending"]` then `="applied"` and the page
      refreshes with new envelope data (or shows `[data-panel-error]` if
      the backend rejected the body).
- [ ] No Next.js dev error overlay (`[data-nextjs-dialog]` absent).
- [ ] Country page's destination-switcher chips re-run the analysis when
      clicked (and the URL stays on /app/country).
- [ ] Visa page renders the ValueLead even when blockers exist (does not
      crash with `BackendApiError` overlay).

### Synthesis
- [ ] Verdict tone matches the verdict (Go = green, Reconsider = red,
      etc.).
- [ ] CTA on the verdict ValueLead deep-links to the first
      `next_best_action`.

### No-fallback contract
- [ ] No page shows hard-coded mock data; every score/score-card maps to a
      real envelope field.
- [ ] When the backend returns a failed analysis, the page shows
      `FailedEnvelopeView` with the user-facing message — never an
      uncaught exception.

---

## 7. Automated coverage (Playwright)

```bash
cd apps/consumer
npx playwright test
```

Spec at `e2e/full-flow.spec.ts`. It signs up a fresh user, picks the
`find_job_abroad` intent, uploads `Resume___Extended.pdf`, fills the
profile, walks all 10 module pages, and asserts:

1. No Next.js dev error overlay on any page.
2. Resume page shows `[data-resume-preview]` after upload — extracted-vs-missing
   side-by-side preview.
3. Profile page shows `[data-profile-completeness]` — completeness meter.
4. Each module page contains `[data-value-lead]` (the unique-value rule).
5. Each module page contains `[data-intent-framing]` (the intent-aware
   rule).
6. Each module page contains `[data-module-panel="<slug>"]` — the per-page
   interactive panel with a `[data-panel-apply]` button.
7. The page heading matches its purpose regex.
8. Sidebar order: Jobs comes before Country (intent-driven reorder).
9. **Round-trip proof**: on `/app/jobs` we click a focus chip + Apply, then
   wait for `[data-panel-status="applied"]` (or a `[data-panel-error]` if the
   backend rejected). Either way the panel must give feedback — silent
   pendings fail the test.

A page that loads but has no value lead, no intent framing, or no module
panel is treated as a failure — passive content readers don't pass.

### Spec configuration

- `BASE` defaults to `http://localhost:3000` — override via
  `E2E_BASE=http://localhost:3001 npx playwright test` if Next.js falls
  back to 3001.
- `RESUME_PATH` defaults to a clean PDF on disk — override via
  `E2E_RESUME=/path/to/file.pdf`.
- `test.setTimeout(30 * 60_000)` — 30-minute wall clock, in line with the
  observed 10-minute happy path on a healthy backend.

### Resilience helpers in the spec

- `gotoWithRetry(url)` retries up to 3× on `ERR_NETWORK_IO_SUSPENDED`,
  `ERR_ABORTED`, `ERR_FAILED` with a 2-second cool-off. Chromium can
  suspend IO when it has many concurrent connections to a backend that's
  doing slow Vertex calls; this helper smooths over those flakes.
- The jobs round-trip waits on either `[data-panel-status="applied"]` or
  `[data-panel-error]` — silence is failure.

---

## 7b. Debugging a broken panel

Symptoms → diagnostic steps:

| Symptom | Likely cause | Where to look |
|---|---|---|
| Apply spins forever, no status flip | `router.refresh()` racing with a long Vertex call. Action probably succeeded but the page render is blocked. | Backend log — look for the matching `POST .../<slug>/run`. If it's still pending, the run is the bottleneck, not the action. |
| `[data-panel-error]` shows "extra forbidden" | Panel sent a key the backend's `extra="forbid"` rejected. | Compare the panel action body keys to the module's `<Module>Inputs` schema in `backend/app/modules/<slug>/schemas.py`. |
| `[data-panel-error]` shows "Access token expired" | Cached JWT exp drifted from the backend's. | Reactive 401 retry in [lib/backend/client.ts](apps/consumer/lib/backend/client.ts) should handle this — if it's still failing, the refresh token is dead. Sign out + back in. |
| Page renders FailedEnvelopeView even after Apply | The run-call hit a backend 5xx; `_synthesizeFailedRow` gave you a placeholder. | Backend log — check for `vertex call failed` warnings. Stub provider should fall back; if the stub also failed, the response is a synthetic failed row with `error_code: "client_error"`. |
| Sidebar didn't reorder after picking an intent | `getIntent()` couldn't read `User.intent` from the consumer DB. | `sqlite3 apps/consumer/prisma/dev.db 'select id, intent from User where email = ?'`. |
| Resume preview missing after upload | Backend returned `extracted: null`. The action surface is `extracted: r.extracted ?? null`. | `POST /api/v1/resume/upload` response payload — look for `extracted`. Stub fallback returns `null`. |
| Two `data-value-lead` blocks on a page | A bug — only one is allowed. | Check the page's JSX for both branches (ready + failed) rendering ValueLead simultaneously. |
| Profile completeness shows 0% with inferred fields | `completion_percentage` not surfaced from `getProfile`. | Verify [lib/backend/client.ts:getProfile](apps/consumer/lib/backend/client.ts) flattens `completion_percentage` onto the returned profile. |

### Useful one-liners

```bash
# Tail backend log for the next module run
tail -f /tmp/backend.log | grep --line-buffered "POST /api/v1/case"

# Confirm a panel apply hit the backend
tail -f /tmp/consumer.log | grep --line-buffered "→ 200"

# Inspect the latest envelope for a case
curl -s http://localhost:8000/api/v1/case/<caseId>/job-fit \
  -H "Authorization: Bearer $TOKEN" | jq '.envelope.detail'

# Force a recompute manually
curl -s -X POST http://localhost:8000/api/v1/case/<caseId>/job-fit/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": true, "target_role": "Senior Backend Engineer"}'
```

### Inspecting `priority_ranking` propagation

```bash
# Read profile
curl -s http://localhost:8000/api/v1/profile -H "Authorization: Bearer $TOKEN" | jq '.profile.priority_ranking'

# Patch
curl -s -X PATCH http://localhost:8000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priority_ranking": ["speed", "career"]}' | jq '{changed_keys, impacted_modules}'
```

`impacted_modules` will list which analyses are now `recompute_required`.

---

## 8. Demo readiness

| Surface | Status | Notes |
|---|---|---|
| Intent capture | ✅ | 8 intents, persisted, sidebar reorders |
| Resume upload + apply | ✅ | Falls back to stub if Vertex blips |
| Profile review | ✅ | Server action + redirect |
| All 10 analysis pages | ✅ | ValueLead + intent framing + failed-state guard |
| Destination switcher (country) | ✅ | One interactive control, real |
| Sidebar reordering | ✅ | Driven by intent emphasis |
| Synthesis verdict + CTA | ✅ | Uses real envelope; no mock |
| Module panels (10) | ✅ | Every module has its own interactive intake |
| Sensitivity controls on jobs/finance | ✅ | Now wired through `jobfit.run`/`finance.run` bodies |
| Solo vs family toggle on family page | ✅ | Full structure form (spouse/children/parents) |
| Documents per-item have/need/expiring | ✅ | Round-trips through `documents.run` |
| Workflow priority + start-with | ✅ | Saves `priority_ranking`, force re-runs |
| Resume extracted preview + confirm | ✅ | Side-by-side "We pulled / Still need" |
| Profile completeness meter | ✅ | Inline bar + "N fields from resume" pill |
| Multi-destination shortlist | ⚠️ | Country panel sends alternates to backend; UI still single-target view |
| Streaming synthesis | ⚠️ | Currently synchronous request, not SSE |

Acceptable for an internal/demo build. The ⚠️ items are scoped follow-up
polish — none of them block the core "intent-aware assistant" message.

### Known limits
- First page-load per module triggers a Vertex run (~30–120s). The page
  blocks until ready. Subsequent visits read the cached row instantly.
- The /app/{discover,plan,marketplace} legacy routes still exist under
  "Other" in the sidebar; they're not part of the backend-driven flow
  and are intentionally untouched.
- The Workflow + Culture + Timeline + Synthesis backend bodies still
  expose only `force` — their panels save preferences via
  `priority_ranking` (and `move_urgency` for Timeline). When the schemas
  grow new knobs, only the action needs an update; the panel input
  shapes already exist.

---

## 9. End-to-end data flow per panel apply

```
[Browser]                    [Next.js server]              [FastAPI]              [DB]
   │
   │ click [data-panel-apply]
   │ -- React useTransition starts --
   │
   │── POST /server-action ──► action.ts:applyXAction()
   │                              │
   │                              │── PATCH /api/v1/profile ───► ProfileRouter
   │                              │                                │
   │                              │                                │── update user_profiles ──► DB
   │                              │                                │── compute changed_keys ──┐
   │                              │                                │── impacted_modules() ◄───┘
   │                              │                                │── mark recompute_required on rows
   │                              │   ◄── { profile, changed_keys, impacted_modules }
   │                              │
   │                              │── POST /api/v1/case/.../<slug>/run ─► <Slug>Router
   │                              │                                          │
   │                              │                                          │── compute input_hash
   │                              │                                          │── if cached + !force: return
   │                              │                                          │── else AIGateway.generate
   │                              │                                          │     ├── VertexProvider (gemini-2.5-flash/pro)
   │                              │                                          │     └── on transport error: StubProvider
   │                              │                                          │── persist analysis row
   │                              │                                          │── return ModuleResponse
   │                              │   ◄── { id, envelope (ready), … }
   │                              │
   │                              └── return { ok: true }
   │
   │ -- ModulePanel.setApplied(true) --
   │── router.refresh() ──► Next.js re-renders the route
   │                              │
   │                              │── page.tsx async: requirePrereqs()
   │                              │── module.ensure(caseId) ──► GET /api/v1/case/.../<slug>
   │                              │                                ◄── latest row (the one we just wrote)
   │                              │── render ValueLead, panel, detail
   │   ◄── new HTML stream
   │
   │ -- DOM updates: new analysis_version, refreshed envelope --
```

Notable consequences:

- `[data-panel-status="applied"]` flips before the refreshed HTML lands —
  the user sees feedback during the refresh roundtrip.
- If the run takes >120s, `llm_request_timeout_s` kicks in and the
  gateway falls back to the stub. The user sees a degraded but still
  ready envelope, never an error overlay.
- A panel apply that only patches the profile (no run call) still
  invalidates upstream rows — the user notices on the next module visit.

---

## 10. State machine: ModulePanel

```
       idle  ──click apply──►  pending  ──onApply resolves ok──►  applied
        ▲                        │                                  │
        │                        │                                  │ router.refresh()
        │                        │                                  ▼
        └────────────────────────┴──onApply ok=false──►  error  ──◄─ DOM swap
```

Visual states:
- `idle` — no `[data-panel-status]` attribute.
- `pending` — `[data-panel-status="pending"]` text "Updating analysis…".
- `applied` — `[data-panel-status="applied"]` text "Applied · refreshing".
- `error` — `[data-panel-error]` shows the action's `error` string;
  `[data-panel-status]` not set.

The transitions are owned by `useTransition` + `useState` in
`ModulePanel`; the parent component is stateless about the request. This
means a panel apply never accidentally double-fires — `useTransition`
disables the apply button while pending.

---

## 11. Code map

```
apps/consumer/
  app/
    app/
      onboarding/
        intent/    page.tsx, intent-picker.tsx, actions.ts          ← intent capture
        resume/    page.tsx, resume-upload-card.tsx (preview), actions.ts
        profile/   page.tsx, profile-review-form.tsx (completeness), actions.ts
      country/     page.tsx, destination-switcher.tsx, preferences-panel.tsx, actions.ts
      jobs/        page.tsx, jobs-panel.tsx, actions.ts
      visa/        page.tsx, visa-panel.tsx, actions.ts
      family/      page.tsx, family-panel.tsx, actions.ts
      finance/     page.tsx, finance-panel.tsx, actions.ts
      documents/   page.tsx, documents-panel.tsx, actions.ts
      workflow/    page.tsx, workflow-panel.tsx, actions.ts
      culture/     page.tsx, culture-panel.tsx, actions.ts
      timeline/    page.tsx, timeline-panel.tsx, actions.ts
      synthesis/   page.tsx, synthesis-panel.tsx, actions.ts
  components/
    backend/
      envelope-shell.tsx     ← PageHeader, ValueLead, EnvelopeMeta, FailedValueLead, readyOrNull
      module-panel.tsx       ← ModulePanel, PanelChips, PanelInput, PanelSelect, PanelToggle
  lib/
    backend/
      client.ts              ← typed wrappers + ensureLatestOrRun + 401 retry
      session.ts             ← BackendSession bridge with proactive refresh
      page-helpers.ts        ← requirePrereqs() (intent + profile gates)
      types.ts               ← AnalysisEnvelope<T> contract
    intent.ts                ← INTENTS, getIntent, framingFor, moduleOrder
  e2e/
    full-flow.spec.ts        ← signup → intent → resume → profile → 10 modules + jobs round-trip
backend/
  app/
    modules/<slug>/
      schemas.py             ← <Slug>Inputs (panel body shape) + <Slug>Detail (envelope.detail)
      routes.py              ← /run, /<slug>, /history
      service.py             ← run/latest/history orchestration
    orchestration/
      dependency_map.py      ← _DEPENDENCY_MAP + impacted_modules()
    ai/
      gateway.py             ← VertexProvider + StubProvider fallback
```

---

## 12. Deferred items + assumptions (data-first rev)

### Deferred (intentionally not done in this rev)

| Item | Why deferred | What it would take |
|---|---|---|
| Streaming the analyses while onboarding finishes | Current synthesis is synchronous; SSE would need a backend route + client EventSource. Not a flow correctness issue. | New `GET /api/v1/case/{id}/run-stream` plus a client EventSource hook. |
| `ResumeUploadOut.extracted` field | Backend currently doesn't return the extraction inline on POST /upload; consumer chains `getProfile()` instead, which is fine because the upload flow merges synchronously. | Add `extracted: ResumeExtraction \| None` to `ResumeUploadOut` + populate in `service.upload()`. |
| Multi-target side-by-side country comparison | Country panel sends `alternatives` but the UI still shows a single-target view. | A new `/app/country/compare` route that runs `country.run` per alternate and lays them side-by-side. |
| Resume-extracted email merging into profile | `extraction.emails[]` exists but isn't written; the user's account email already lives on `User`. | One-line fill in `merge_resume_into_profile`. |
| Per-language confidence levels broken into structured records | Today `languages_known` is a flat `string[]` ("English (C2)"). | Sub-schema `Language { name, level }` mirrored on the profile. |
| Onboarding "skip" buttons | All 8 steps are required by `evaluateOnboarding`; you cannot bypass. We considered "skip for now" but decided gate strictness was the point. | Per-step skip → mark step as user-skipped, lower completion threshold. |
| Country map auto-translated label (e.g. Spanish UI) | UI is English-only today. | Replace the `name` field with an i18n key + per-locale catalog. |
| Sidebar "Your goal" badge re-render after goal update | Today the goal change requires a full reload to update the sidebar (server component). | RouterRefresh on goal save (already redirects, so this is a non-issue in practice). |
| Profile completeness > 80 → "ready to analyze" inline status | Profile shows the completeness bar but the analysis page still gates on `evaluateOnboarding` returning null `nextStep`. | A second derived signal `analysisReady = completion >= 80 && requiredMissing.length === 0`. |

### Assumptions

1. **The 50-country catalogue covers our supported destinations + common
   origins.** Adding more is a pure data edit in `lib/countries.ts`.
2. **Resume extractor still uses gemini-2.5-flash via Vertex.** Stub
   fallback covers Vertex outages. The richer `merge_resume_into_profile`
   doesn't introduce new LLM calls — it just maps existing extracted
   fields to additional profile keys.
3. **`User.intent` (consumer DB) and `profile.relocation_goal` (backend)
   stay in sync.** The goal step writes to both. If a future codepath
   updates one without the other, sidebar reorder + module framing will
   diverge.
4. **The `evaluateOnboarding` gate uses target completion of "every
   `missing()` returns []".** It does NOT use the Pydantic
   `completion_percentage`. The two signals are related but not
   identical: completion % counts more fields than the gate strictly
   requires, so a user can be at 60% and still pass the gate.
5. **Resume field merge stamps `field_sources[key] = "resume"` only on
   newly-filled keys.** A user-edited field that was previously set by
   the resume keeps `"user"` after the patch — never reverted.
6. **Existing rows survive the migration.** `0004_profile_richer_intake`
   adds nullable scalar columns and JSON-default-empty list columns —
   no data migration required.
7. **The legacy `/app/onboarding/intent` URL still works** via redirect.
   Bookmarked links from prior sessions land on `/app/onboarding/goal`.
8. **ISO-2 codes are still the wire format.** Backend Pydantic enforces
   `min_length=2 max_length=2` and uppercases. The frontend country layer
   only converts at the display boundary.

### Things that would now warrant a re-test

- Existing users whose profiles were created before this rev have
  no `relocation_goal` on the backend (only on consumer `User.intent`).
  The first time they hit the gate, they'll be redirected to
  `/app/onboarding/goal` to populate the backend record. After that,
  their old data flows normally.
- The `completion_percentage` numbers shift: previously 15 fields
  counted, now 25. Users who saw "73%" before may now see "44%" until
  they complete the new steps. This is intentional — the data was
  always thin; the meter now reports the truth.
