/**
 * Visual at-a-glance Profile snapshot.
 *
 * Sits above the editable Profile / Twin forms and presents the same
 * data as visual quick-attribute cards. Read-only — the forms below
 * are still where the user edits anything.
 *
 * Same card design language as the Finance page (rounded-2xl, mono
 * eyebrow labels, tone-graded readiness ring).
 */

import * as React from "react";
import {
  Briefcase,
  Award,
  Clock3,
  Users,
  MapPin,
  Globe2,
  Wallet,
  Plane,
} from "lucide-react";

interface Props {
  profession: string | null;
  seniority: string | null;
  yearsExperience: number | null;
  familySize: number | null;
  hasChildren: boolean;
  childrenCount: number;
  timelineMonths: number | null;
  budgetUSD: number | null;
  readiness: number;
  currentCountry: string | null;
  currentCity: string | null;
  nationality: string | null;
  targetCountries: string[];
}

export function ProfileSnapshot({
  profession,
  seniority,
  yearsExperience,
  familySize,
  hasChildren,
  childrenCount,
  timelineMonths,
  budgetUSD,
  readiness,
  currentCountry,
  currentCity,
  nationality,
  targetCountries,
}: Props) {
  const yearsLabel =
    yearsExperience != null
      ? `${yearsExperience} yr${yearsExperience === 1 ? "" : "s"}`
      : "—";

  const familyLabel =
    familySize == null
      ? "—"
      : familySize === 1
      ? "Solo"
      : hasChildren && childrenCount > 0
      ? `${familySize} (incl. ${childrenCount} kid${childrenCount > 1 ? "s" : ""})`
      : `${familySize} people`;

  const timelineLabel =
    timelineMonths == null
      ? "—"
      : timelineMonths <= 6
      ? `${timelineMonths}mo · ASAP`
      : timelineMonths <= 12
      ? `${timelineMonths}mo · soon`
      : `${timelineMonths}mo · planned`;

  const budgetLabel =
    budgetUSD == null
      ? "—"
      : budgetUSD >= 1000
      ? `$${(budgetUSD / 1000).toFixed(budgetUSD >= 10000 ? 0 : 1)}k`
      : `$${budgetUSD}`;

  const locationLabel =
    currentCity && currentCountry
      ? `${currentCity}, ${currentCountry.toUpperCase()}`
      : currentCountry
      ? currentCountry.toUpperCase()
      : currentCity ?? "—";

  const cards: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "neutral" | "info" | "good" | "warn" }[] = [
    {
      icon: <Briefcase className="h-4 w-4" />,
      label: "Profession",
      value: profession ?? "Not set",
      sub: profession ? "Current focus" : "Add in the form below",
      tone: profession ? "info" : "neutral",
    },
    {
      icon: <Award className="h-4 w-4" />,
      label: "Seniority",
      value: seniority ?? "Not set",
      sub: yearsLabel,
      tone: seniority ? "info" : "neutral",
    },
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: "Experience",
      value: yearsLabel,
      sub: yearsExperience != null ? (yearsExperience >= 10 ? "Senior bracket" : yearsExperience >= 5 ? "Mid bracket" : "Early career") : undefined,
      tone: yearsExperience != null ? "good" : "neutral",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Family",
      value: familyLabel,
      sub: hasChildren ? "Moving with kids" : familySize === 1 ? "Solo move" : "Moving as a household",
      tone: "neutral",
    },
    {
      icon: <Plane className="h-4 w-4" />,
      label: "Timeline",
      value: timelineLabel,
      sub: timelineMonths != null && timelineMonths <= 6 ? "Move-soon track" : "Plan and prep",
      tone: timelineMonths != null && timelineMonths <= 6 ? "warn" : "neutral",
    },
    {
      icon: <Wallet className="h-4 w-4" />,
      label: "Budget",
      value: budgetLabel,
      sub: budgetUSD != null ? "Relocation budget" : undefined,
      tone: budgetUSD != null ? "good" : "neutral",
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      label: "Currently in",
      value: locationLabel,
      sub: nationality ? `Nationality · ${nationality.toUpperCase()}` : undefined,
      tone: "neutral",
    },
    {
      icon: <Globe2 className="h-4 w-4" />,
      label: "Target corridors",
      value: targetCountries.length > 0 ? `${targetCountries.length} picked` : "Not set",
      sub: targetCountries.length > 0 ? targetCountries.slice(0, 4).join(" · ") : undefined,
      tone: targetCountries.length > 0 ? "info" : "neutral",
    },
  ];

  // Readiness ring for the headline card
  const v = Math.max(0, Math.min(100, readiness));
  const tone =
    v >= 70
      ? { ring: "stroke-success-500", text: "text-success-700", verdict: "Ready to move" }
      : v >= 40
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", verdict: "Getting there" }
      : { ring: "stroke-danger-500", text: "text-danger-700", verdict: "Early days" };
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;

  return (
    <section data-profile-snapshot className="mb-6">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
        Snapshot · the relocation-ready you, at a glance
      </p>

      {/* Readiness headline + 8 attribute cards */}
      <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
        {/* Readiness card */}
        <div data-readiness-card className="rounded-2xl border border-ink-200 bg-gradient-to-br from-parchment to-white p-5">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r={radius} className="fill-none stroke-ink-100" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className={`fill-none ${tone.ring}`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                Relocation readiness
              </p>
              <p className={`mt-1 font-sans text-[28px] font-semibold leading-none ${tone.text}`}>
                {v}
                <span className="text-[12px] text-ink-400">/100</span>
              </p>
              <p className="mt-1.5 inline-block rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                {tone.verdict}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] leading-[1.5] text-ink-600">
            Updated as you complete profile, finance, visa and document checks.
          </p>
        </div>

        {/* Quick attribute cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((c) => (
            <AttributeCard key={c.label} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

const TONE_PALETTE: Record<
  "neutral" | "info" | "good" | "warn",
  { card: string; iconWrap: string; iconColor: string; value: string }
> = {
  neutral: {
    card: "border-ink-200 bg-white",
    iconWrap: "bg-ink-50",
    iconColor: "text-ink-700",
    value: "text-ink-900",
  },
  info: {
    card: "border-lagoon-200 bg-lagoon-50/40",
    iconWrap: "bg-lagoon-100",
    iconColor: "text-lagoon-700",
    value: "text-lagoon-800",
  },
  good: {
    card: "border-success-200 bg-success-50/40",
    iconWrap: "bg-success-100",
    iconColor: "text-success-700",
    value: "text-success-800",
  },
  warn: {
    card: "border-gilt-200 bg-gilt-50/40",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    value: "text-gilt-800",
  },
};

function AttributeCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "neutral" | "info" | "good" | "warn";
}) {
  const p = TONE_PALETTE[tone];
  return (
    <div
      data-attribute={label}
      className={`rounded-2xl border ${p.card} p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${p.iconWrap} ${p.iconColor}`}
        >
          {icon}
        </span>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
      </div>
      <p className={`mt-2 font-sans text-[14px] font-semibold leading-snug tracking-[-0.005em] ${p.value}`}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-[10.5px] leading-[1.4] text-ink-600 truncate" title={sub}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
