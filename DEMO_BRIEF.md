# Glimmora Relocate · Demo Brief

A relocation **decision engine**, not another "country comparison site."
Captures the user's full context first, then runs 10 deterministic +
LLM-backed analyses that all reason against the same profile.

---

## 1 · The reasoning (why this exists)

- Relocation is not a search problem — it's a decision problem with
  ~30 cross-cutting variables (visa, salary, family, schooling, taxes,
  timeline, sponsorship). Existing tools answer one of those and stop.
- People don't pick a country and then plan. They iterate: "if family
  weight goes up, does Germany still beat UAE?" Every other tool
  forces a re-search. We re-rank in <100 ms.
- Output of a relocation tool must be **defensible**, not vibes-based.
  Every score, threshold, and recommendation in Glimmora can be
  traced back to a numeric input or a curated metric.

---

## 2 · USP (the 3 things nobody else does)

1. **Switchability engine** — for every challenger × lever pair we
   surface the *smallest* weight shift that flips the ranking, and
   flag the unreachable cases honestly. No competitor exposes this.
2. **Decision fingerprint** — same inputs, different mover style →
   different winner. The page tells you *why your shortlist looks the
   way it does* in one phrase (career_first / cost_sensitive / …).
3. **Profile-first orchestration** — a single 8-step intake powers
   all 10 analyses; the user answers each fact once and the engine
   chains every dependent computation automatically.

Secondary differentiators:
- Per-country expandable drilldowns with **real charts on real data**
  (radar + sensitivity line + components + cross-shortlist + transition).
- Origin → destination *transition deltas* (most tools score countries
  in isolation, ignoring where you're moving from).
- Strict, hallucination-resistant resume extraction (only what's
  literally in the file — explicitly tested for).

---

## 3 · Market + competitor analysis

| Class of tool | Examples | What they do | What they miss |
|---|---|---|---|
| Country comparison sites | Numbeo, Expatistan, MoveHub | Cost-of-living, QoL indices side-by-side. | No personalisation, no visa, no timeline, no "what if." |
| Visa platforms | Boundless, VisaHQ, Envoy | Process one visa per session. | No country comparison, no jobs/finance integration. |
| Job + relocation hybrids | Relocate.me, LinkedIn, Indeed (jobs view) | Sponsor-friendly job feeds. | No decision support — answer one role at a time. |
| Concierge agencies | EOR / mobility consulting | Human-driven end-to-end moves. | $5K–$30K, weeks of latency, no self-serve iteration. |
| Generic AI assistants | ChatGPT/Perplexity prompts | Free-form conversational answers. | No structured profile, no traceability, no charts. |

**Glimmora's position:** the only *self-serve, deterministic, profile-
driven* layer that sits between "free comparison sites" and "$10K
human consultants." Sub-second iteration, defensible numbers, full
10-module coverage.

---

## 4 · Flow (top to bottom)

```
Sign-up
  └─> 8-step onboarding (gated by evaluateOnboarding)
        goal → resume → profile review → destination
              → jobs → family → visa → budget
  └─> 10 analysis modules, each:
        ┌ data-value-lead     (one unique insight)
        ┌ data-intent-framing (eyebrow tuned to user's goal)
        └ data-module-panel   (interactive — re-runs on Apply)
  └─> Synthesis (final go / wait / reconsider verdict)
```

Onboarding is **strictly sequential**: missing fields redirect to the
first incomplete step. The synthesis page reads from all 10 module
outputs — so the verdict can never be computed before the inputs.

---

## 5 · Internals (the parts that make the demo defensible)

- **Backend** — FastAPI + SQLAlchemy + Alembic. Pydantic v2 schemas
  with `extra="forbid"` for every contract. All 10 modules return the
  same `AnalysisEnvelope` shape (status, score, summary, risks,
  next_actions, confidence, detail, assumptions).
- **AI layer** — Vertex Gemini primary, deterministic stub fallback.
  Strict v2 resume-extraction prompt: "extract only what's literally
  in the resume — never infer."
- **Country shortlist engine** — pure Python, no LLM, sub-100 ms per
  call. Lever-decomposed weighted scoring → sensitivity sweeps →
  switchability matrix → fingerprint.
- **Frontend** — Next.js 14 App Router. Server components prefetch
  the first analysis so pages paint instantly; client components
  handle interactivity. Pure SVG charts (no chart library) so they
  render in SSR + Playwright.
- **Country display layer** — `lib/countries.ts` ensures full names
  in UI; ISO-2 stays on the wire. The e2e test asserts no ISO-only
  leaks.
- **Test surface** — every page exposes `data-*` hooks documented in
  `FRONTEND_QA_WALKTHROUGH.md`. One Playwright test walks the entire
  pipeline (sign-up → 10 modules) and verifies value-leads, panel
  interactions, decision-board drilldowns, and switchability.

---

## 6 · Page-by-page unique points

### 01 · Country `/app/country` — interactive decision board
- Hard cap of 3 countries (focus over breadth).
- Each ranked card expands to a **drilldown**: radar (composition),
  sensitivity line per lever, components bars, cross-shortlist line,
  origin→destination transition.
- "Who wins on what" rows expand to show the **contributing metrics**
  (e.g. Career = job_market 40% + salary_power 35% + sponsor 25%) with
  per-country bars.
- Switchability panel — every (challenger × lever) threshold with
  unreachable rows flagged. *The unique feature.*
- Decision fingerprint badge classifies the user's mover style.
- Sub-100 ms re-rank on every weight slider tick.

### 02 · Job fit `/app/jobs`
- Three-axis score: role match, salary realism, visa employability.
- **Salary realism** computes gap_pct between user's expectation and
  local market estimate — most "jobs abroad" tools don't surface this.
- Inferred target role from resume (with confidence + rationale).
- Sponsor-friendly employer density score per market.
- Job pathways with `time_to_offer_weeks` so career planning is
  numeric, not narrative.

### 03 · Visa `/app/visa`
- Picks a **primary route** from per-nationality eligibility, returns
  difficulty + processing window + sponsor requirement.
- Per-requirement `user_meets` flag — checks the user's actual profile
  against the route's requirements one by one.
- Distinguishes **fixable vs hard blockers** — most visa tools dump a
  list; we tell the user which ones they can resolve themselves.
- Always carries a legal disclaimer; never gives legal advice.

### 04 · Family `/app/family`
- Mode-aware: solo vs with-family changes the entire output, not just
  a flag.
- Per-child schooling recommendation by age.
- Spouse work-authorisation outlook is computed against destination's
  dependant-visa rules.
- Healthcare sensitivity for parents — dependency-level matched to
  destination's healthcare access score.

### 05 · Finance `/app/finance`
- Real **monthly net** (gross − tax) using destination's effective
  tax rate, not gross headline salary.
- Six-line monthly cost (housing, utilities, food, transport, health,
  childcare, discretionary) → surplus/deficit.
- `salary_to_expense_ratio` and `savings_runway_months` — affordability
  framed as runway, not just "is the salary enough?"
- FX notes flag currency-direction risk for cross-border flows.

### 06 · Documents `/app/documents`
- Status per-document (`have / need / expiring / unknown`) with
  expiry dates.
- **`required_for_summary`** — every document maps to which downstream
  modules need it (e.g. passport → visa, FBI check → US visa).
- `next_to_handle` is a single concrete action; no overwhelming list.
- Readiness percentage threads through synthesis.

### 07 · Workflow `/app/workflow`
- DAG of nodes + edges (not a linear checklist) with hard/soft
  dependencies.
- **Critical path** is computed automatically — surfaces the longest
  chain of unavoidable work.
- Blocked nodes tagged with reason; user sees what's actually
  gating the move.
- `total_estimated_days_min/max` is the single number the user cares
  about.

### 08 · Culture `/app/culture`
- Workplace norms + daily life + language target proficiency.
- **First-week kit** — concrete must/should/nice items with effort
  hours, not generic "learn the language" advice.
- Basic phrases include usage context, not just translations.
- Family adaptation notes branch on whether the user is moving with
  family.

### 09 · Timeline `/app/timeline`
- Anchored to either today or **earliest realistic start** based on
  document/visa readiness.
- Phases + milestones + blockers are first-class — blockers list
  estimated_unblock_weeks.
- Critical milestones flagged separately so the user knows which
  dates are non-negotiable.

### 10 · Synthesis `/app/synthesis`
- Aggregates the 10 module scores into a single `feasibility_score`
  and a 5-state verdict (`go / go_with_conditions / wait / reconsider
  / blocked`).
- Recommended destination + recommended job path with confidence and
  rationale.
- **Top blockers** are surfaced from whichever module produced them
  — so the user sees "your visa route fails because you don't have a
  job offer yet" rather than ten disconnected warnings.
- Next-best actions ranked by urgency × effort hours.

---

## 7 · Demo script (90 seconds)

1. **Sign up** — type-as-they-watch; resume upload auto-fills 60% of
   the profile. *"One file, half the form already done."*
2. **Onboarding** — show the stepper. *"They answer each thing once."*
3. **Country page** —
   - Show ranking. Bump the cost slider. *"Re-ranks instantly."*
   - Click rank-1 to expand. *"Every chart is real data."*
   - Click "Who wins on Career." *"Here's the reasoning trail."*
   - Open switchability matrix. *"This is the unique feature — what
     would actually have to change for the order to flip."*
4. **Synthesis** — *"All 10 modules feeding one verdict, with the
   actual blockers surfaced."*
5. **Close** — *"Numbeo gives you a cost index. Boundless gives you a
   visa form. Glimmora gives you the decision."*

---

## 8 · What this is NOT (so the demo doesn't overpromise)

- Not legal advice. Visa module always carries the disclaimer.
- Not real-time market data. Country metrics are curated 2026-Q1
  baselines (`source.last_updated` is shown in the UI).
- Not a replacement for an immigration lawyer for complex cases —
  but it tells you *whether you need one*.
- Not multi-country relocation logistics (movers, freight). That's
  out of scope.
