# Glimmora Relocate · Consumer App

The first portal — the full end-user experience. Built for hand-off to backend.

## Stack

- **Next.js 14** · App Router · TypeScript
- **Tailwind CSS** · beige design system
- **Fraunces** (display) + Inter Tight (body) + JetBrains Mono (labels)
- **Auth.js v5** (NextAuth) · Credentials provider · bcrypt
- **Prisma 5** · SQLite for local dev (swap to Postgres at W4)
- **Radix UI** primitives · shadcn-style components

## Running locally

```bash
# from apps/consumer
npm install
DATABASE_URL="file:./prisma/dev.db" npx prisma db push
DATABASE_URL="file:./prisma/dev.db" npx tsx prisma/seed.ts
npm run dev
```

The dev server starts on the first free port from 3000 upward.

## Demo account

Pre-seeded for testing:

- **Email:** `demo@glimmora.ai`
- **Password:** `demo1234`

Or create a new account via `/sign-up` — it is real; the user record is persisted, password hashed with bcrypt, session issued by Auth.js.

## Routes

**Public**
- `/` — landing
- `/sign-up` — real account creation
- `/sign-in` — real login
- `/forgot-password` — password reset (console-logs the link in dev)

**Authenticated** (all under `/app`, gated by middleware)
- `/app` — dashboard
- `/app/discover` — country comparison + job discovery + opportunity feed
- `/app/plan` — timeline, milestones, tasks
- `/app/career` — applications, CVs, interview AI, offers
- `/app/life` — housing, schools, banking, healthcare, utilities, community
- `/app/family` — family members, spouse plan, children
- `/app/finance` — salary-vs-cost simulator, tax, FX, savings
- `/app/documents` — dynamic checklist, vault, validation
- `/app/marketplace` — verified partners, bookings, escrow
- `/app/culture` — language + culture modules
- `/app/messages` — Copilot chat UI (streaming wiring pending)
- `/app/profile` — editable profile + Digital Twin
- `/app/settings` — preferences, password change, delete account
- `/app/billing` — plans, subscription, invoices

## What's real vs. wired-later

| Area | Status |
|---|---|
| Signup / Login / Logout | ✅ Real. bcrypt, sessions, JWT. |
| Profile edit | ✅ Real. Persists to SQLite. |
| Digital Twin edit | ✅ Real. Recalculates readiness score on save. |
| Preferences (notifications, privacy, theme) | ✅ Real. Persists. |
| Password change | ✅ Real. Verifies current, rehashes new. |
| Account deletion | ✅ Real. Sets status=DELETED, signs out. |
| Forgot password | 🟡 Token generated + logged to console. Email sending at W4. |
| Stripe payments | 🟡 UI ready. Wiring at W4 (Connect Express model). |
| Copilot streaming | 🟡 UI ready. Wires to Anthropic at W2. |
| Marketplace bookings | 🟡 UI ready. Partner portal + escrow at W4. |

## Design system

- All design tokens live in `tailwind.config.ts` and `app/globals.css`.
- Colors follow the beige palette: `cognac` (primary), `navy` (secondary), `aubergine` (tertiary), `moss` (success), `honey` (warning), `wine` (danger), `neutral` (warm greys).
- Typography uses three fonts, referenced via CSS variables `--font-fraunces`, `--font-geist`, `--font-geist-mono`.
- UI primitives in `components/ui/*` — each one is shadcn-style, Radix-based, fully typed.

## Project structure

```
apps/consumer
├── app/
│   ├── (public)/        — unauthenticated routes
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── layout.tsx
│   ├── app/             — authenticated routes
│   │   ├── layout.tsx   — auth guard
│   │   ├── _shell.tsx   — sidebar + topbar
│   │   ├── [each module]/
│   ├── api/auth/...
│   ├── layout.tsx       — root (fonts, metadata)
│   └── globals.css
├── components/
│   ├── ui/              — primitives (button, input, card…)
│   ├── app/             — authenticated shell (sidebar, topbar)
│   └── shared/          — cross-cutting (page-header, empty-state, mark)
├── lib/                 — db, auth helpers, validations, utilities
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db           — local SQLite
├── auth.ts · auth.config.ts
├── middleware.ts        — protects /app/*
└── tailwind.config.ts
```

## Hand-off to backend

When backend engineering takes over:

1. Replace SQLite with PostgreSQL in `schema.prisma`.
2. Replace the Credentials provider with Clerk / Auth0 per the tech-stack decision.
3. Implement the Copilot streaming endpoint (SSE) at `/api/copilot/stream`.
4. Wire Stripe Connect to the Billing and Marketplace pages.
5. Swap the in-memory / mock data in Discover, Finance, Marketplace with real KG + Country data from the backend API.

The frontend is structured so each of the above is a surgical swap, not a rewrite.
