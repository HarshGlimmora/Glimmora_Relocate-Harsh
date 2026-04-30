# Glimmora Relocate — Frontend Migration Reference

**Audience:** Frontend team (the one that built the original Glimmora UI in
a separate repository).
**Purpose:** Migrate the **Consumer / User persona** portion of your UI on
top of the working backend that already lives in this repository, without
modifying a single backend file.
**Status:** Formal handover. Read top-to-bottom before writing any code.

---

## 0. The hard rules

These are non-negotiable. Treat them as the contract you signed by accepting
this work.

1. **Do not change any backend code.** The backend (FastAPI + Vertex Gemini
   + SQLAlchemy + Alembic, located in `backend/`) is the source of truth.
   It is feature-complete, schema-stable, and verified. If something in the
   UI doesn't work, the bug is in the UI — fix the UI.
2. **Do not change the API contract.** The endpoints, request/response
   shapes, error envelopes, status codes, and module bodies are fixed. They
   are documented in §6 of this document and in
   [FRONTEND_QA_WALKTHROUGH.md](FRONTEND_QA_WALKTHROUGH.md).
3. **Do not change the data flow direction.** Profile and analyses are
   stored in the FastAPI backend; the consumer NextAuth DB only stores the
   user account, the intent, and the bridge token. Do not duplicate
   profile fields in the consumer DB.
4. **Migrate only the Consumer / User persona.** Other personas (employer,
   partner, marketplace, etc.) in the original repo are out of scope. Do
   not import their pages, components, or routes into this consumer app.
5. **Keep the working contract proven by the existing implementation.** The
   reference consumer app in `apps/consumer/` already wires every backend
   endpoint correctly. When in doubt about wiring, copy from there.
6. **The visual design is what you bring; the data flow is what we keep.**
   Replace styles, layouts, components, and copy from your repo. Keep
   server actions, the typed client, the bridge session, and the prereq
   gate exactly as they are.
7. **Test with Playwright before declaring a page done.** Every page must
   pass the existing `e2e/full-flow.spec.ts` assertions plus the new ones
   you add for redesigned flows.

---

## 1. The migration model

There are two repositories on disk:

```
~/your-frontend-repo/        ← the original UI (yours)
~/Glimora/Relocate-kavi/     ← this repo (backend + a working consumer)
   ├── backend/              ← DO NOT TOUCH
   ├── apps/
   │   └── consumer/         ← you will migrate INTO this folder
   └── ...
```

You will work in `apps/consumer/`. You will treat the original frontend repo
as a **read-only design reference** — copy markup, styles, design tokens,
and component shells from it, but do not import them as a runtime
dependency.

### What you keep from your repo (visual layer)
- Page layouts and section composition
- Tailwind theme / design tokens / typography scale
- shadcn/ui or custom component primitives (button, card, input, dialog…)
- Iconography, illustrations, copy
- Routing structure of the consumer persona (only)

### What you keep from this repo (working layer)
- `lib/backend/` — typed client, bridge session, page helpers, types
- `lib/intent.ts` — intent model, sidebar reorder helper
- `app/api/auth/[...nextauth]/route.ts` and `auth.ts`, `auth.config.ts`
- `prisma/schema.prisma` — consumer DB shape (User has `intent` field)
- `app/<persona-routes>/<page>/actions.ts` — server actions
- `components/backend/envelope-shell.tsx` — `ValueLead`, `PageHeader`,
  `EnvelopeMeta`, `FailedValueLead`, `readyOrNull`, `isReadyEnvelope`
- `components/backend/module-panel.tsx` — `ModulePanel`, `PanelChips`,
  `PanelInput`, `PanelSelect`, `PanelToggle`
- `e2e/full-flow.spec.ts` — Playwright spec (extend, do not delete)
- The `[data-*]` test hook contract documented in
  [FRONTEND_QA_WALKTHROUGH.md §0](FRONTEND_QA_WALKTHROUGH.md)

You are not rewriting the working code — you are **wrapping it in your
visual shell**.

---

## 2. Pre-flight checklist

Before you write a single line of UI code, complete this list. Don't
skip steps; the migration falls apart at the first one you skip.

### 2.1 Local environment

- [ ] Node 20.x installed (`node --version`).
- [ ] Python 3.11+ installed (`python --version`).
- [ ] `npm` 10+ installed.
- [ ] You can clone both repos.
- [ ] You have `~/your-frontend-repo` checked out next to
      `~/Glimora/Relocate-kavi`.

### 2.2 This repo bootstrapped

```bash
cd ~/Glimora/Relocate-kavi

# Backend
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env       # then fill in JWT_SECRET, GCP_SERVICE_ACCOUNT_JSON_B64
.venv/bin/uvicorn app.main:app --port 8000

# Health check (in another shell)
curl http://localhost:8000/healthz   # expect {"status":"ok"}

# Consumer
cd ../apps/consumer
npm install
cp .env.local.example .env.local       # fill AUTH_SECRET, GLIMMORA_BACKEND_URL
npx prisma db push
npm run dev                             # http://localhost:3000
```

If both services don't run cleanly, stop here and ask. Do not start
migrating before this works.

### 2.3 Read the source-of-truth docs

- [ ] [FRONTEND_QA_WALKTHROUGH.md](FRONTEND_QA_WALKTHROUGH.md) end to end.
- [ ] `apps/consumer/lib/intent.ts` — understand the 8 intents and how they
      reorder the sidebar.
- [ ] `apps/consumer/lib/backend/types.ts` — every detail shape per module.
- [ ] `apps/consumer/lib/backend/client.ts` — every backend call. Note:
      `ensureLatestOrRun` is the one helper you will call most often.
- [ ] `backend/app/modules/<slug>/schemas.py` for each module — the
      `<Slug>Inputs` body shape your panel will send.

### 2.4 Run the existing Playwright spec to prove the baseline

```bash
cd apps/consumer
npx playwright install --with-deps chromium
npx playwright test e2e/full-flow.spec.ts --reporter=line
```

It must pass before you begin. If it doesn't, the environment is broken;
fix that first.

---

## 3. The persona scope

You are migrating **only** the Consumer / User persona. The full surface
is fixed and is enumerated below. Do not add pages outside this list. Do
not skip pages on this list.

### 3.1 Public routes

| Route | Purpose | Existing reference file |
|---|---|---|
| `/sign-in` | Email + password sign-in via NextAuth credentials | `app/(auth)/sign-in/page.tsx` |
| `/sign-up` | Email + password registration; auto-creates the backend bridge | `app/(auth)/sign-up/page.tsx` |
| `/forgot-password` | (Optional, exists for completeness) | `app/(auth)/forgot-password/page.tsx` |

### 3.2 Onboarding routes (gated; require auth)

| Route | Purpose | Existing reference file |
|---|---|---|
| `/app/onboarding/intent` | Pick the move intent (8 options). Required. | `app/app/onboarding/intent/page.tsx` |
| `/app/onboarding/resume` | Upload PDF/DOCX, see extracted preview, apply. | `app/app/onboarding/resume/page.tsx` |
| `/app/onboarding/profile` | Confirm + fill profile (target_country required). | `app/app/onboarding/profile/page.tsx` |

### 3.3 Module routes (gated; require auth + intent + profile)

Each module page renders one analysis envelope and one interactive panel.
The panel re-runs the analysis when the user clicks Apply.

| Route | Module | Reference page |
|---|---|---|
| `/app/country` | Country comparison | `app/app/country/page.tsx` |
| `/app/jobs` | Job fit | `app/app/jobs/page.tsx` |
| `/app/visa` | Visa direction | `app/app/visa/page.tsx` |
| `/app/family` | Family relocation | `app/app/family/page.tsx` |
| `/app/finance` | Financial feasibility | `app/app/finance/page.tsx` |
| `/app/documents` | Documents & checklist | `app/app/documents/page.tsx` |
| `/app/workflow` | Workflow & dependencies | `app/app/workflow/page.tsx` |
| `/app/culture` | Culture & language | `app/app/culture/page.tsx` |
| `/app/timeline` | Timeline | `app/app/timeline/page.tsx` |
| `/app/synthesis` | Final synthesis (verdict) | `app/app/synthesis/page.tsx` |

### 3.4 Layout & dashboard

| Route | Purpose | Reference |
|---|---|---|
| `/app` | Dashboard landing (intent badge + sidebar shell) | `app/app/page.tsx`, `app/app/_shell.tsx` |
| `/app/layout.tsx` | The authed layout wrapping all `/app/*` routes | `app/app/layout.tsx` |

### 3.5 Out of scope (do NOT migrate in this phase)

- Employer portal, partner portal, marketplace, plan, life, career,
  discover, billing, settings as standalone surfaces. They exist in this
  repo as legacy stubs (`app/app/{employer,marketplace,plan,...}`) but
  are not part of the working backend-driven flow.
- Any other persona's pages from your repo.

---

## 4. Page-by-page requirements

Each page below is described with: the visual job (use your design), the
data contract (do not change), the required `data-*` hooks (the
Playwright contract), and the wiring file you must keep.

> The functional details — every input, every body field, every cascade —
> are documented in [FRONTEND_QA_WALKTHROUGH.md §4 and §4b](FRONTEND_QA_WALKTHROUGH.md).
> When in doubt, that document wins.

### 4.1 `/sign-up`

- **Visual job:** Sign-up form per your design (email, password, confirm
  password, name, terms).
- **Wiring:** Posts to NextAuth credentials register. On success, the
  backend bridge auto-creates a backend account + case (handled inside
  `auth.ts` callback). Redirects to `/app/onboarding/intent`.
- **Required hooks:** `input[name="name"]`, `input[name="email"]`,
  `input[name="password"]`, `input[name="confirmPassword"]`,
  `label:has(input[type="checkbox"])` (the terms checkbox),
  `button[type="submit"]`.
- **Fail signals:** stays on `/sign-up`; redirects directly to `/app`
  (regression — must always go through `/app/onboarding/intent`).

### 4.2 `/sign-in`

- **Visual job:** Sign-in form per your design.
- **Wiring:** `signIn("credentials", { email, password })` from NextAuth.
- **On success:** if the user has no `intent`, redirect to
  `/app/onboarding/intent`; else if no `target_country` on backend
  profile, to `/app/onboarding/profile?missing=target_country`; else to
  `/app`.

### 4.3 `/app/onboarding/intent`

- **Visual job:** A picker of 8 intent tiles with label + hint, plus a
  Continue button. Use your tile/card design.
- **Wiring:** `IntentPicker` saves to `User.intent` via
  `saveIntentAction`. Redirects to `/app/onboarding/resume`.
- **Required hooks:** `button[data-intent="<id>"]`, `[data-active]` on
  active tile, `button:has-text("Continue")`.
- **Side-effect contract:** after save, the sidebar reorders by intent
  emphasis. This is automatic via `moduleOrder(intent)` in
  `lib/intent.ts` — do not duplicate it.

### 4.4 `/app/onboarding/resume`

- **Visual job:** Upload card + parsed preview + apply button. Use your
  upload component.
- **Wiring:** `uploadResumeAction` → `applyResumeAction`. Both already
  exist in `app/app/onboarding/resume/actions.ts`.
- **Required hooks:** `input[type="file"]`,
  `button[type="submit"]:has-text("Upload")`,
  `button:has-text("Apply to my profile")`,
  `button:has-text("Try another file")`,
  `[data-resume-preview]` (the parsed-preview block must exist before
  Apply is clickable),
  `[data-resume-extracted]` (the two-column "We pulled / Still need"
  inside the preview).
- **Failure mode:** if the parser returns `failed`, render a callout with
  retry + skip — the existing component handles it.

### 4.5 `/app/onboarding/profile`

- **Visual job:** Profile form with required + optional sections per your
  design. Pre-fill values from `getProfile()`. Mark resume-inferred
  fields visibly (use a "from resume" badge or icon).
- **Wiring:** `saveProfileAction(patch)` → redirects to `/app/country`.
- **Required hooks:**
  - `[data-profile-completeness]` — completeness meter at the top of the
    form (bar + percentage + "N fields from resume" pill).
  - Standard label + input pairs for every field. Playwright targets
    fields via `getByLabel(/Current country/i)` etc.
- **Required fields (backend will 400 without these):** `target_country`.
- **Validators:** ISO-2 country fields are 2 chars uppercase; salary
  numbers are non-negative.

### 4.6 Module pages — the universal pattern

Every module page (`/app/country`, `/app/jobs`, …, `/app/synthesis`)
implements the same structure. **Do not deviate.**

```tsx
// (pseudocode of the required structure — re-skin freely, keep the data hooks)

const { caseId, profile, intent } = await requirePrereqs();
const row = await <module>.ensure(caseId);
const ready = readyOrNull(row.envelope);

return (
  <YourPageShell>
    <YourPageHeader
      eyebrow="N · <Module name>"
      title="<Concise question this page answers>"
      intentFraming={framingFor("<slug>", intent)}   // renders [data-intent-framing]
    />
    <EnvelopeMeta row={row} />

    {ready ? (
      <YourValueLead /* renders [data-value-lead] */ ... />
    ) : (
      <FailedValueLead envelope={row.envelope} />     // [data-value-lead]
    )}

    <YourModulePanel /* MUST emit [data-module-panel="<slug>"] */ ... />

    {!isReadyEnvelope(row.envelope)
      ? <FailedEnvelopeView envelope={row.envelope} />
      : <YourDetailLayout envelope={row.envelope}>{/* re-skin freely */}</YourDetailLayout>}
  </YourPageShell>
);
```

The three immutable contracts:
1. `[data-value-lead]` — exactly one per page. Top of the content.
2. `[data-intent-framing]` — exactly one per page. Inside the header.
3. `[data-module-panel="<slug>"]` — exactly one per page, with at least
   one `[data-panel-apply]` button.

### 4.7 Per-module wiring map

For each module, the panel inputs, the patches, and the run body are
specified in [FRONTEND_QA_WALKTHROUGH.md §4b](FRONTEND_QA_WALKTHROUGH.md).
Re-skin the panel, keep the action.

| Slug | Reference panel | Reference action |
|---|---|---|
| country | `app/app/country/preferences-panel.tsx` | `app/app/country/actions.ts:applyCountryPreferencesAction` |
| jobs | `app/app/jobs/jobs-panel.tsx` | `app/app/jobs/actions.ts:applyJobsPreferencesAction` |
| visa | `app/app/visa/visa-panel.tsx` | `app/app/visa/actions.ts:applyVisaPreferencesAction` |
| family | `app/app/family/family-panel.tsx` | `app/app/family/actions.ts:applyFamilyShapeAction` |
| finance | `app/app/finance/finance-panel.tsx` | `app/app/finance/actions.ts:applyFinanceSensitivityAction` |
| documents | `app/app/documents/documents-panel.tsx` | `app/app/documents/actions.ts:applyDocumentStatusAction` |
| workflow | `app/app/workflow/workflow-panel.tsx` | `app/app/workflow/actions.ts:applyWorkflowPriorityAction` |
| culture | `app/app/culture/culture-panel.tsx` | `app/app/culture/actions.ts:applyCulturePreferencesAction` |
| timeline | `app/app/timeline/timeline-panel.tsx` | `app/app/timeline/actions.ts:applyTimelinePreferencesAction` |
| synthesis | `app/app/synthesis/synthesis-panel.tsx` | `app/app/synthesis/actions.ts:applySynthesisFocusAction` |

You may rename or re-organize the panel files (e.g., consolidate into a
`components/modules/` folder). You **may not** change what the action
sends to the backend.

---

## 5. The migration procedure

Follow this order. Do not jump steps. After each numbered step, the app
must still build and the existing Playwright test must still pass.

### Step 1 — Branch and snapshot

```bash
cd ~/Glimora/Relocate-kavi
git checkout -b ui-migration
git status                                # must be clean
cd apps/consumer && npx tsc --noEmit      # must pass
npx playwright test e2e/full-flow.spec.ts # must pass before you start
```

### Step 2 — Bring in your design system

1. Copy `tailwind.config.ts`, `globals.css`, design tokens, and font setup
   from your repo into `apps/consumer/` (overwriting where needed).
2. Copy your shared UI primitives (`components/ui/*` if you use shadcn,
   or whatever the equivalent is) into `apps/consumer/components/ui/`.
3. Run `npm run dev` and visit `/sign-in`. The auth pages still work but
   now look like your repo. Fix any Tailwind / token errors.
4. Run `npx tsc --noEmit` — must be clean before continuing.

### Step 3 — Re-skin auth pages (`/sign-in`, `/sign-up`, `/forgot-password`)

For each page:
- Replace JSX with your design's markup.
- Keep the form `name=` attributes the same so Playwright still finds them.
- Keep the server actions and NextAuth wiring untouched.
- Smoke test the sign-up → sign-in loop in a fresh browser session.

### Step 4 — Re-skin onboarding (`intent`, `resume`, `profile`)

In order:
- `/app/onboarding/intent` — replace tile design, keep `[data-intent]` and
  `[data-active]` and the `Continue` button label.
- `/app/onboarding/resume` — replace upload card + preview design, keep
  `[data-resume-preview]` and `[data-resume-extracted]` wrappers.
- `/app/onboarding/profile` — replace form layout, keep
  `[data-profile-completeness]` and the field labels.

After each, run:
```bash
npx tsc --noEmit
npx playwright test e2e/full-flow.spec.ts -g "intent|resume|profile" || true
```

### Step 5 — Re-skin the authed layout

`/app/layout.tsx` — replace shell, sidebar, header. Keep:
- The `Your goal: <intent label>` badge logic
- The Analysis-section ordering driven by `moduleOrder(intent)`
- The intent gate redirect (`requirePrereqs()`)

### Step 6 — Re-skin module pages, one at a time

Migrate them in this order (low risk first):

1. `/app/country`
2. `/app/jobs`
3. `/app/visa`
4. `/app/family`
5. `/app/finance`
6. `/app/documents`
7. `/app/workflow`
8. `/app/culture`
9. `/app/timeline`
10. `/app/synthesis`

For each:
- Replace the visual layout of detail sections (you may rearrange,
  consolidate, or split — as long as every envelope field still surfaces
  somewhere).
- Replace the panel chrome but keep the `<ModulePanel>` shell or replicate
  its contract (data attributes + state machine).
- Run `npx tsc --noEmit` and re-run Playwright after each module.
- **Do not advance to the next module until the current one passes.**

### Step 7 — Update Playwright

Add assertions for any new visual signal the design depends on (icons,
toasts, modals). Do **not** remove any existing assertion in
`e2e/full-flow.spec.ts`. Extend it.

### Step 8 — Build

```bash
cd apps/consumer
npm run build                  # must succeed
npx tsc --noEmit               # must be clean
npx playwright test            # must pass end to end
```

### Step 9 — Manual smoke test

Walk the app as a fresh user, in this order:
1. `/sign-up` → `/app/onboarding/intent` → pick `find_job_abroad`
2. Upload a clean resume PDF; confirm preview shows extracted fields.
3. Confirm profile; save.
4. Visit each module in order. For each:
   - ValueLead is visible.
   - Intent framing line is visible.
   - Module panel is visible with apply button.
   - Click Apply. Wait for the panel to flip to applied state. Confirm
     the page re-renders (analysis_version bumps).
5. Visit `/app/synthesis`. Confirm verdict shows.

### Step 10 — Hand back

Open a PR titled `UI migration: <persona> from <repo>`. The PR description
must include:
- A screenshot of each migrated page.
- Confirmation Playwright passed (`1 passed (X.Xm)`).
- The list of routes migrated vs. left alone.

---

## 6. The API contract — read-only reference

This is the subset of the backend API your migrated UI must continue to
call. Full schemas: `backend/app/modules/<slug>/schemas.py`.

### Auth

| Method | Path | Used for |
|---|---|---|
| POST | `/api/v1/auth/register` | First-time backend bridge creation |
| POST | `/api/v1/auth/login` | Refresh the bridge token |
| POST | `/api/v1/auth/refresh` | Rotate access token |

### Profile

| Method | Path | Used for |
|---|---|---|
| GET | `/api/v1/profile` | Reads profile + completion + field_sources |
| PATCH | `/api/v1/profile` | Persists user-confirmed values; returns `changed_keys` and `impacted_modules` |

### Resume

| Method | Path | Used for |
|---|---|---|
| POST | `/api/v1/resume/upload` (multipart) | Upload + parse |
| GET | `/api/v1/resume/{id}` | Status |
| POST | `/api/v1/resume/{id}/apply` | Merge into profile |

### Modules (all 10 follow the same shape)

| Method | Path | Used for |
|---|---|---|
| GET | `/api/v1/case/{caseId}/<slug>` | Latest envelope (404 if none) |
| POST | `/api/v1/case/{caseId}/<slug>/run` | Generate + persist a new analysis |
| GET | `/api/v1/case/{caseId}/<slug>/history` | Full version history |

`<slug>` ∈ `country-comparison | job-fit | visa | family | finance | documents | workflow | culture | timeline | synthesis`.

The `run` body for each slug is documented in
[FRONTEND_QA_WALKTHROUGH.md §4b](FRONTEND_QA_WALKTHROUGH.md). It is
strictly typed; unknown keys → 422.

### Envelope shape

Every analysis returns the same envelope shell. See
[`apps/consumer/lib/backend/types.ts`](apps/consumer/lib/backend/types.ts):

```ts
interface AnalysisEnvelope<TDetail> {
  status: "generating" | "ready" | "failed";
  score: number | null;
  summary: string;
  reasoning: string;
  risks: Risk[];
  next_actions: NextAction[];
  confidence: number;
  metadata: EnvelopeMetadata;
  detail: TDetail;                 // module-specific
  analysis_version: number;
  stale: boolean;
  recompute_required: boolean;
  stale_reason: string | null;
  input_hash: string;
  assumptions: Assumption[];
}
```

Failed envelopes have a different shape (`status: "failed"`, `error_code`,
`user_message`). Use `isReadyEnvelope` and `readyOrNull` from
`components/backend/envelope-shell.tsx` to narrow.

---

## 7. Required `data-*` hooks (the Playwright contract)

Your re-skinned UI **must** preserve every selector below. These are how
the automated test verifies the migration. Removing them is a regression.

| Selector | Where it must appear |
|---|---|
| `[data-intent="<id>"]` and `[data-active]` | Each intent tile on `/app/onboarding/intent` |
| `[data-resume-preview]` | The post-upload preview block |
| `[data-resume-extracted]` | The two-column extracted-vs-missing block |
| `[data-profile-completeness]` | The meter on `/app/onboarding/profile` |
| `[data-value-lead]` | Top of every module page (exactly one per page) |
| `[data-emphasis]` | On the ValueLead with values `good \| warn \| bad \| neutral` |
| `[data-intent-framing]` | The framing line in the page header |
| `[data-module-panel="<slug>"]` | The interactive panel on every module page |
| `[data-panel-apply]` | The apply button inside each panel |
| `[data-panel-status="pending"\|"applied"]` | The transient status indicator |
| `[data-panel-error]` | The error block when the action throws |
| `[data-chip="<id>"]` and `[data-chip-active]` | Chip toggles inside any panel |
| `[data-document-status="have\|need\|expiring\|unknown"]` and `[data-doc-active]` | Documents-panel row chips |
| `[data-document-row="<kind>"]` | Each row in the documents-panel checklist |
| `[data-destination-switcher]` | The country re-target chips |

---

## 8. Definition of done

A page is **done** only when ALL of the following are true:

- [ ] `npx tsc --noEmit` is clean (no errors in your files).
- [ ] `npx playwright test e2e/full-flow.spec.ts` passes end-to-end.
- [ ] Every `data-*` hook from §7 that applies to the page is present.
- [ ] The page renders the failed-envelope state without crashing
      (`FailedEnvelopeView` is shown, no Next.js dev overlay).
- [ ] The page's interactive panel re-runs the analysis (you can see the
      `analysis_version` bump in `EnvelopeMeta` after Apply).
- [ ] The page renders cleanly on widths 360px, 768px, 1280px (mobile,
      tablet, desktop).
- [ ] No backend file was modified (`git diff backend/` is empty).
- [ ] The PR description includes a screenshot.

---

## 9. Anti-patterns — do not do these

| Anti-pattern | Why it's wrong |
|---|---|
| Adding a `useEffect` to fetch envelope data on the client | The page is a Server Component. Data is fetched server-side via `<module>.ensure(caseId)`. Going client-side breaks the prereq gate and adds a flash of empty content. |
| Calling `fetch("http://localhost:8000/...")` directly from a component | Bypasses auth, retry, type safety, error envelope. Always go through `lib/backend/client.ts`. |
| Caching profile/analysis data in `localStorage` | The user can sign in from another device; the bridge handles session-level caching. Do not duplicate. |
| Mutating the existing `lib/backend/types.ts` to "match" your component shape | The types mirror the backend Pydantic schema. If they're wrong, the backend is the source of truth. |
| Deleting the existing reference panel file before your replacement is wired | Leave the working file in place until your replacement passes Playwright. Then remove. |
| Removing or relaxing a `data-*` hook because the design doesn't need it | The hook is a test contract, not a visual signal. Hide it visually (`sr-only`) if you must. |
| Adding new backend fields and changing Pydantic schemas | Backend is locked. If you genuinely need a new field, file an issue first. |
| Skipping Playwright "because it's slow" | Slow is the cost of integration testing against a real Vertex backend. The e2e is the only thing that proves you didn't break the contract. |
| Sending unknown body keys to a `<module>.run()` call | Every module schema sets `extra="forbid"` → 422. If a body key isn't in `<Module>Inputs`, do not send it. |
| Modifying `lib/intent.ts` to add a new intent | Intents are wired into the dependency map and module-order helpers. Adding one is a coordinated change, not a UI change. |

---

## 10. Coordination & handover

- **Open issues** for anything that requires backend support. Do not
  freelance backend changes.
- **Communicate breaking visual changes** that may affect the test spec
  (e.g., changing a button label that Playwright targets via text).
- **Tag the backend owner** on any PR that touches `lib/backend/`,
  `lib/intent.ts`, or `e2e/`.
- **Daily checkpoint:** at end of each working day, push your branch and
  paste the latest Playwright result in the team channel.

---

## 11. The exact prompt to give to your AI tooling

If you use Claude / Cursor / Copilot agents to do the migration, copy this
prompt verbatim into a new agent session. It's deliberately strict.

> ---
>
> **You are migrating the Consumer / User persona UI from
> `~/your-frontend-repo` (read-only design reference) into
> `~/Glimora/Relocate-kavi/apps/consumer/` (this repo).**
>
> **Hard rules — non-negotiable:**
>
> 1. **Do not modify any file under `backend/`.** Run `git diff backend/`
>    before every commit; it must be empty.
> 2. **Do not change the API contract.** Routes, request bodies, response
>    shapes, status codes, and error envelopes are fixed. Read
>    `MIGRATION_DOCUMENT_REFERENCE.md §6` and
>    `FRONTEND_QA_WALKTHROUGH.md §4b` for the contract.
> 3. **Do not modify `lib/backend/`, `lib/intent.ts`, `auth.ts`,
>    `auth.config.ts`, or `prisma/schema.prisma` unless you have an
>    explicit reason and you confirm with me first.**
> 4. **Do not delete any `data-*` test hook listed in
>    `MIGRATION_DOCUMENT_REFERENCE.md §7`.** Hide them with `sr-only` if
>    your design has no visual home for them, but keep them in the DOM.
> 5. **Do not add new pages, routes, or backend modules.** The persona
>    scope is fixed in `MIGRATION_DOCUMENT_REFERENCE.md §3`.
>
> **Working scope:**
>
> - You may edit any file under `apps/consumer/app/` (routes + actions),
>   `apps/consumer/components/` (your design system + module shells), and
>   `apps/consumer/tailwind.config.ts` / `globals.css`.
> - You may copy markup, styles, and component primitives from
>   `~/your-frontend-repo` into `apps/consumer/`.
> - You may add new files; you may not delete a working reference file
>   until your replacement passes Playwright.
>
> **Method — follow this loop for every page:**
>
> 1. Read the existing reference page in `apps/consumer/app/<route>/page.tsx`
>    so you know what envelope fields it uses, what panel it renders, and
>    what `data-*` hooks it emits.
> 2. Read the corresponding section in
>    `FRONTEND_QA_WALKTHROUGH.md §4 / §4b` to understand the unique value
>    + the panel inputs.
> 3. Re-skin the page using your repo's design system. **Keep:**
>    - All `await` calls to `<module>.ensure(caseId)`,
>      `requirePrereqs()`, `getProfile()`, `getIntent()`, `framingFor()`,
>      `readyOrNull()`, `isReadyEnvelope()`, `applyXAction()`.
>    - Every `data-*` hook listed in `§7`.
>    - The page header `intentFraming` slot.
>    - The `FailedValueLead` failure-state branch.
> 4. After you finish each page, run **all** of these:
>    ```bash
>    cd apps/consumer
>    npx tsc --noEmit
>    git diff backend/        # must be empty
>    npm run build            # must succeed
>    npx playwright test e2e/full-flow.spec.ts --reporter=line
>    ```
> 5. If Playwright fails, **fix the UI**. Do not change the spec, do not
>    change the backend, do not change the typed client. Read the failure
>    message — it tells you exactly which hook or behaviour is missing.
> 6. After the page passes, commit with:
>    `git commit -m "ui(<route>): migrate to <design-name> design"`
> 7. Move to the next page. Order: sign-in, sign-up, layout, intent,
>    resume, profile, country, jobs, visa, family, finance, documents,
>    workflow, culture, timeline, synthesis.
>
> **Anti-patterns — do not do these:**
>
> - Do not add `useEffect` data fetches to module pages; they are Server
>   Components and use `await <module>.ensure(caseId)`.
> - Do not call `fetch()` directly to the backend; always go through
>   `lib/backend/client.ts`.
> - Do not duplicate profile data into the consumer Prisma DB.
> - Do not send body keys not listed in the module's `<Module>Inputs`
>   schema; the backend rejects with 422.
> - Do not touch `e2e/full-flow.spec.ts` except to add new assertions for
>   new visual elements you introduced.
> - Do not declare a page "done" without passing Playwright on it.
>
> **Done criteria for the whole migration:**
>
> - All 14 pages re-skinned (3 auth + 3 onboarding + 1 layout + 10
>   module + 0 dashboard tweaks).
> - `git diff backend/` is empty.
> - `npm run build` succeeds.
> - `npx playwright test` reports `1 passed`.
> - PR description shows a screenshot per page and the Playwright result.
>
> Start now. Begin by running the Pre-flight checklist in
> `MIGRATION_DOCUMENT_REFERENCE.md §2`. Don't skip steps.
>
> ---

---

## 12. Reference index

| Topic | File |
|---|---|
| Backend architecture, env vars, dependencies | `FRONTEND_QA_WALKTHROUGH.md §1–2` |
| Intent model + sidebar reorder | `FRONTEND_QA_WALKTHROUGH.md §3`; `apps/consumer/lib/intent.ts` |
| Per-page UI contract + visual job | `FRONTEND_QA_WALKTHROUGH.md §4`; this doc §4 |
| Per-panel inputs + body schemas + cascades | `FRONTEND_QA_WALKTHROUGH.md §4b` |
| Backend endpoints | `FRONTEND_QA_WALKTHROUGH.md §5`; this doc §6 |
| Playwright assertions | `FRONTEND_QA_WALKTHROUGH.md §7`; `apps/consumer/e2e/full-flow.spec.ts` |
| `data-*` hooks (test contract) | `FRONTEND_QA_WALKTHROUGH.md §0`; this doc §7 |
| Debugging a broken panel | `FRONTEND_QA_WALKTHROUGH.md §7b` |
| Data flow diagram (panel → backend → DB → re-render) | `FRONTEND_QA_WALKTHROUGH.md §9` |
| State machine for ModulePanel | `FRONTEND_QA_WALKTHROUGH.md §10` |
| Code map | `FRONTEND_QA_WALKTHROUGH.md §11` |
| Backend Pydantic schemas (source of truth) | `backend/app/modules/<slug>/schemas.py` |
| Backend dependency map | `backend/app/orchestration/dependency_map.py` |

---

## 13. Frequently asked questions

**Q: Can I rename the existing files?**
A: Yes — as long as imports are updated and the `data-*` hooks survive.

**Q: Can I change the directory structure under `apps/consumer/`?**
A: For visual components yes. For `lib/backend/`, `lib/intent.ts`,
`auth.ts`, `auth.config.ts`, and `prisma/`, no — these are wired into
NextAuth + Prisma + the bridge.

**Q: What if my design needs a value the backend doesn't return?**
A: First check the envelope `detail` for the module — most fields are
already there. If genuinely missing, **file an issue**. Do not derive from
client-side fakes.

**Q: What if Playwright fails on a flake?**
A: Re-run once. If it fails twice, it's a real regression — fix the UI.
Network-suspended retries are already in `gotoWithRetry` in the spec.

**Q: Can I migrate two pages in parallel?**
A: Yes, on separate branches, but merge them sequentially with Playwright
passing between each merge.

**Q: Can I deprecate the existing reference panel?**
A: Only after your replacement passes Playwright. Then delete in the same
PR that introduces the replacement.

**Q: My design uses a modal where the reference uses an inline panel.
Allowed?**
A: Yes — as long as the modal still emits `[data-module-panel="<slug>"]`
and `[data-panel-apply]` and the user reaches the apply button without
breaking the test path. (You may need to extend Playwright to open the
modal first.)

**Q: My team uses tRPC / RTK / TanStack Query. Can I introduce them?**
A: No, not in this migration. The reference uses Next.js Server Actions +
Server Components which is the contract the prereq gate relies on.
Introducing client-side data layers is a separate, coordinated proposal.

---

**End of document. Treat any conflict between this and the codebase as a
bug in this document — open an issue, do not freelance.**
