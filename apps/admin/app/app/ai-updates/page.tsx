import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ExternalLink, Check, X, AlertCircle, Bot, Newspaper, Landmark } from "lucide-react";

export const metadata: Metadata = { title: "AI updates queue" };

type SourceKind = "GOV" | "NEWS" | "VENDOR";

type Update = {
  id: string;
  country: string;
  flag: string;
  field: string;
  oldValue: string;
  newValue: string;
  confidence: number; // 0-100
  source: string;
  sourceKind: SourceKind;
  sourceUrl: string;
  extractedAt: string; // display string
  summary: string;
};

const UPDATES: Update[] = [
  {
    id: "u1",
    country: "Germany",
    flag: "🇩🇪",
    field: "pathToPermanent",
    oldValue: "33 months",
    newValue: "27 months (for B1+ German)",
    confidence: 92,
    source: "BAMF official bulletin",
    sourceKind: "GOV",
    sourceUrl: "https://www.bamf.de",
    extractedAt: "2h ago",
    summary: "Skilled worker residency now accelerated to 27 months for applicants with B1 German proficiency.",
  },
  {
    id: "u2",
    country: "Netherlands",
    flag: "🇳🇱",
    field: "30 % ruling duration",
    oldValue: "5 years",
    newValue: "5 years (capped at €233k salary)",
    confidence: 88,
    source: "Belastingdienst announcement",
    sourceKind: "GOV",
    sourceUrl: "https://www.belastingdienst.nl",
    extractedAt: "8h ago",
    summary: "New salary ceiling of €233k introduced for the 30%-ruling; applies to new arrivals from 1 Jan 2027.",
  },
  {
    id: "u3",
    country: "Portugal",
    flag: "🇵🇹",
    field: "rentMedianEUR",
    oldValue: "€980",
    newValue: "€1,080",
    confidence: 75,
    source: "Idealista Q1 report",
    sourceKind: "VENDOR",
    sourceUrl: "https://www.idealista.pt",
    extractedAt: "1d ago",
    summary: "Lisbon 1-BR median rent rose 10% QoQ — aggregated across three major listing platforms.",
  },
  {
    id: "u4",
    country: "Ireland",
    flag: "🇮🇪",
    field: "visaTurnaround",
    oldValue: "6-10 weeks",
    newValue: "10-14 weeks",
    confidence: 82,
    source: "Irish Examiner",
    sourceKind: "NEWS",
    sourceUrl: "https://www.irishexaminer.com",
    extractedAt: "2d ago",
    summary: "Critical Skills Permit backlog lengthens to 10-14 weeks after application volume spike in March.",
  },
  {
    id: "u5",
    country: "Spain",
    flag: "🇪🇸",
    field: "Beckham Law eligibility",
    oldValue: "Former non-resident 10 yrs",
    newValue: "Former non-resident 5 yrs",
    confidence: 95,
    source: "BOE (Boletín Oficial del Estado)",
    sourceKind: "GOV",
    sourceUrl: "https://www.boe.es",
    extractedAt: "3d ago",
    summary: "Residency lookback requirement for Beckham Law cut from 10 to 5 years as of 2026 fiscal year.",
  },
];

export default function AiUpdatesPage() {
  const high = UPDATES.filter((u) => u.confidence >= 85);
  const medium = UPDATES.filter((u) => u.confidence >= 70 && u.confidence < 85);
  const low = UPDATES.filter((u) => u.confidence < 70);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Knowledge & Support</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            AI-extracted updates.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
            Models watch regulators, news, and vendor feeds for country-rule changes. Every candidate update needs a curator's sign-off before it reaches the live KG.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gilt-200 bg-gilt-50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
          Promotion action · W4
        </span>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={UPDATES.length}  l="In queue" sub="awaiting review" tone="gilt" />
        <Kpi n={high.length}     l="High confidence" sub="≥ 85% · auto-promote candidates" tone="lagoon" />
        <Kpi n={medium.length}   l="Medium"  sub="70-84% · needs curator" />
        <Kpi n={low.length}      l="Low"     sub="< 70% · discard likely" />
      </section>

      <section>
        <SectionHead num="01" label="Proposed updates" />
        <div className="space-y-4">
          {UPDATES.map((u) => (
            <article key={u.id} className="rounded-2xl border border-ink-200 bg-white p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-sans text-[16px] font-semibold tracking-tight text-ink-900">
                      <span className="mr-1.5 text-[18px]">{u.flag}</span>{u.country}
                    </h3>
                    <span className="rounded-full border border-ink-200 bg-parchment px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700 font-medium">
                      {u.field}
                    </span>
                    <ConfidenceBadge pct={u.confidence} />
                  </div>

                  <p className="mt-3 text-[13.5px] text-ink-700 leading-[1.55]">{u.summary}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-danger-100 bg-danger-50/40 p-3">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-danger-700 font-semibold">Current</p>
                      <p className="mt-1 font-sans text-[14px] font-medium text-ink-900 line-through decoration-danger-400/70 decoration-1">{u.oldValue}</p>
                    </div>
                    <div className="rounded-xl border border-lagoon-100 bg-lagoon-50/60 p-3">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-lagoon-700 font-semibold">Proposed</p>
                      <p className="mt-1 font-sans text-[14px] font-semibold text-ink-900">{u.newValue}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                      <SourceIcon kind={u.sourceKind} /> {u.source}
                    </span>
                    <Link
                      href={u.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-ink-700 hover:text-ink-900"
                    >
                      View source <ExternalLink className="h-3 w-3" />
                    </Link>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400 font-medium">
                      extracted {u.extractedAt}
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-[180px] md:shrink-0">
                  <button
                    type="button"
                    disabled
                    title="KG promotion ships with W4."
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-lagoon-200 bg-lagoon-50 px-4 text-[12.5px] font-semibold text-lagoon-800 cursor-not-allowed"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Promote
                    <span className="rounded-full bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-lagoon-700">W4</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Discard flow ships with W4."
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-500 cursor-not-allowed"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} /> Discard
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Escalation flow ships with W4."
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-500 cursor-not-allowed"
                  >
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.25} /> Escalate
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function Kpi({ n, l, sub, tone }: { n: number; l: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function ConfidenceBadge({ pct }: { pct: number }) {
  const cls = pct >= 85
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : pct >= 70
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : "border-ink-200 bg-ink-50 text-ink-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${cls}`}>
      <Bot className="h-2.5 w-2.5" strokeWidth={2.25} /> {pct}% conf
    </span>
  );
}

function SourceIcon({ kind }: { kind: SourceKind }) {
  if (kind === "GOV") return <Landmark className="h-3 w-3 text-ink-500" strokeWidth={2} />;
  if (kind === "NEWS") return <Newspaper className="h-3 w-3 text-ink-500" strokeWidth={2} />;
  return <Sparkles className="h-3 w-3 text-ink-500" strokeWidth={2} />;
}
