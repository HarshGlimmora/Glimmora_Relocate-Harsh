/**
 * Visual components for the Final Synthesis page.
 *
 * Pure presentational pieces — no fetching, no client state. They follow
 * the existing finance / country visual-card conventions: inline SVG +
 * Tailwind classes, the project's warm caramel/lagoon/gilt/success/danger
 * palette, monospace eyebrows, and `rounded-2xl border border-ink-200
 * bg-white` cards.
 *
 * Animations rely on Tailwind's built-in `animate-pulse-soft` /
 * `animate-pulse` / `animate-spin` (no new libraries).
 */

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Target,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { RiskSeverity } from "@/lib/backend/types";

// ============================================================================
// 1. Module Scoreboard — cards with traffic-light progress bars
// ============================================================================

interface ModuleScore {
  kind: string;
  label: string;
  score: number;
  confidence: number;
  summary: string;
  available: boolean;
}

function toneForScore(score: number): {
  bar: string;
  text: string;
  ring: string;
} {
  // Pastel palette: soft 300-level fills for bars, darker 700-level for
  // text so contrast stays accessible. Medium band uses `warning` (pale
  // orange) instead of `gilt` to match the lighter pastel direction.
  if (score >= 71) {
    return { bar: "bg-success-300", text: "text-success-700", ring: "ring-success-200" };
  }
  if (score >= 41) {
    return { bar: "bg-warning-300", text: "text-warning-700", ring: "ring-warning-200" };
  }
  return { bar: "bg-danger-300", text: "text-danger-700", ring: "ring-danger-200" };
}

export function ModuleScoreCard({ m }: { m: ModuleScore }) {
  const tone = toneForScore(m.score);
  const pct = Math.max(0, Math.min(100, m.score));
  return (
    <div
      className={
        "flex flex-col rounded-2xl border bg-white p-4 transition-shadow hover:shadow-elev-md " +
        (m.available ? "border-ink-200" : "border-dashed border-ink-300 opacity-70")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13.5px] font-semibold text-ink-900">{m.label}</p>
        <span className={`font-mono text-[12.5px] tabular-nums ${tone.text}`}>
          {m.score}
          <span className="text-ink-400">/100</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full ${tone.bar} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${m.label} score: ${pct} out of 100`}
        />
      </div>

      <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-[1.5] text-ink-600">
        {m.summary}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        conf {Math.round(m.confidence * 100)}%{!m.available ? " · not run" : ""}
      </p>
    </div>
  );
}

export function ModuleScoreGrid({ scores }: { scores: ModuleScore[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scores.map((m) => (
        <ModuleScoreCard key={m.kind} m={m} />
      ))}
    </div>
  );
}

// ============================================================================
// 2. Top Blockers — left/center/right orbit layout
// ============================================================================

interface Blocker {
  label: string;
  detail: string;
  severity: RiskSeverity;
  source_module: string;
}

const SEVERITY_BADGE: Record<RiskSeverity, string> = {
  // Pastel severity tones — 50-level background, 200 border, 700 text so
  // small chip text stays readable. Medium shifts from gilt to `warning`
  // for a softer pale-orange instead of a yellower amber.
  low: "bg-lagoon-50 text-lagoon-700 border-lagoon-200",
  medium: "bg-warning-50 text-warning-700 border-warning-200",
  high: "bg-danger-50 text-danger-700 border-danger-200",
};

function BlockerCard({ b, align }: { b: Blocker; align: "left" | "right" }) {
  return (
    <div
      className={
        "rounded-2xl border border-ink-200 bg-white p-4 shadow-elev-sm transition-all hover:-translate-y-0.5 hover:shadow-elev-md " +
        (align === "right" ? "md:text-right" : "")
      }
    >
      <div
        className={
          "flex items-start gap-2 " +
          (align === "right" ? "md:flex-row-reverse md:justify-start" : "")
        }
      >
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${
            SEVERITY_BADGE[b.severity]
          }`}
        >
          {b.severity}
        </span>
        <p className="flex-1 text-[13px] font-semibold leading-snug text-ink-900">
          {b.label}
        </p>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-600">{b.detail}</p>
      <p
        className={
          "mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 " +
          (align === "right" ? "md:text-right" : "")
        }
      >
        from {b.source_module}
      </p>
    </div>
  );
}

/** Center visual for Top Blockers — concentric pulsing rings around a warning icon. */
function BlockerCenterVisual({ count }: { count: number }) {
  return (
    <div className="relative flex h-[200px] w-[200px] items-center justify-center">
      {/* Concentric pulsing rings — softened to pastel warning/orange. */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 rounded-full bg-warning-300/25 animate-ping"
          style={{ animationDuration: "3.2s" }}
        />
        <div
          className="absolute inset-3 rounded-full bg-warning-300/30 animate-ping"
          style={{ animationDuration: "2.4s", animationDelay: "0.4s" }}
        />
        <div
          className="absolute inset-6 rounded-full bg-warning-200/45 animate-ping"
          style={{ animationDuration: "1.8s", animationDelay: "0.8s" }}
        />
      </div>

      {/* Solid central plate — pastel orange gradient with warmer border */}
      <div className="relative flex h-[110px] w-[110px] flex-col items-center justify-center rounded-full border-2 border-warning-200 bg-gradient-to-br from-warning-50 to-white shadow-elev-md">
        <AlertTriangle
          className="h-9 w-9 text-warning-600 animate-pulse-soft"
          strokeWidth={2}
        />
        <span className="mt-1 font-sans text-[14px] font-bold leading-none text-ink-800">
          {count}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
          blocker{count === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function TopBlockersOrbit({ blockers }: { blockers: Blocker[] }) {
  if (!blockers.length) return null;
  const left = blockers.slice(0, 2);
  const right = blockers.slice(2, 4);

  return (
    <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
      {/* Left column */}
      <div className="flex flex-col gap-3">
        {left.map((b, i) => (
          <BlockerCard key={i} b={b} align="left" />
        ))}
        {/* If fewer than 2, balance the layout with a placeholder */}
        {left.length === 1 ? <div aria-hidden /> : null}
      </div>

      {/* Center visual */}
      <div className="flex justify-center py-2 md:py-0">
        <BlockerCenterVisual count={blockers.length} />
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-3">
        {right.length > 0 ? (
          right.map((b, i) => <BlockerCard key={i} b={b} align="right" />)
        ) : (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white/40 p-4 text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-400">
            no other major blockers
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. Risks — orbit layout with a radar-style center
// ============================================================================

interface Risk {
  severity: RiskSeverity;
  label: string;
  detail: string;
}

function RiskCard({ r, align }: { r: Risk; align: "left" | "right" }) {
  return (
    <div
      className={
        "rounded-2xl border border-ink-200 bg-white p-4 shadow-elev-sm transition-all hover:-translate-y-0.5 hover:shadow-elev-md " +
        (align === "right" ? "md:text-right" : "")
      }
    >
      <div
        className={
          "flex items-start gap-2 " +
          (align === "right" ? "md:flex-row-reverse md:justify-start" : "")
        }
      >
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${
            SEVERITY_BADGE[r.severity]
          }`}
        >
          {r.severity}
        </span>
        <p className="flex-1 text-[13px] font-semibold leading-snug text-ink-900">
          {r.label}
        </p>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-600">{r.detail}</p>
    </div>
  );
}

/** Center visual for Risks — slowly-rotating radar sweep with severity dots. */
function RiskRadarCenterVisual({ risks }: { risks: Risk[] }) {
  // Pastel severity palette — 300-level so the dots read as soft markers
  // rather than alarming bright spots.
  const SEV_COLOR: Record<RiskSeverity, string> = {
    low: "#A6F3C8",     // success-200 (soft mint)
    medium: "#F5B552",  // warning-300 (pale orange)
    high: "#F06F7B",    // danger-300 (soft coral)
  };
  const radius = 70;

  return (
    <div className="relative flex h-[200px] w-[200px] items-center justify-center">
      {/* Static rings */}
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
        {[30, 55, 80].map((r) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke="#F2E5C9"
            strokeWidth={1.25}
          />
        ))}
        {/* Cross-hairs */}
        <line x1="-90" y1="0" x2="90" y2="0" stroke="#F2E5C9" strokeWidth={1} />
        <line x1="0" y1="-90" x2="0" y2="90" stroke="#F2E5C9" strokeWidth={1} />
      </svg>

      {/* Rotating sweep — softened to a paler caramel wash. */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ animation: "spin 6s linear infinite" }}
      >
        <svg viewBox="-100 -100 200 200" className="h-full w-full">
          <defs>
            <linearGradient id="rrSweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(232,185,123,0.35)" />
              <stop offset="100%" stopColor="rgba(232,185,123,0)" />
            </linearGradient>
          </defs>
          <path
            d="M 0 0 L 88 0 A 88 88 0 0 0 62.2 -62.2 Z"
            fill="url(#rrSweep)"
          />
        </svg>
      </div>

      {/* Severity dots placed deterministically around the radar */}
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
        {risks.slice(0, 8).map((r, i) => {
          const angle = (Math.PI * 2 * i) / Math.max(risks.length, 1) - Math.PI / 2;
          const cx = Math.cos(angle) * radius;
          const cy = Math.sin(angle) * radius;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={5} fill={SEV_COLOR[r.severity]} />
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill={SEV_COLOR[r.severity]}
                opacity={0.35}
                style={{
                  animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite",
                  animationDelay: `${i * 0.18}s`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center hub */}
      <div className="relative flex h-[80px] w-[80px] flex-col items-center justify-center rounded-full border-2 border-gilt-300 bg-gradient-to-br from-gilt-50 to-white shadow-elev-sm">
        <Radar className="h-7 w-7 text-gilt-700" strokeWidth={2} />
        <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
          {risks.length} risk{risks.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function RisksOrbit({ risks }: { risks: Risk[] }) {
  if (!risks.length) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-success-600" />
        <p className="mt-2 text-[13.5px] font-semibold text-ink-900">No major risks surfaced.</p>
        <p className="mt-1 text-[12.5px] text-ink-600">
          Your upstream analyses didn't flag enough material risk to surface here.
        </p>
      </div>
    );
  }

  const left = risks.slice(0, 2);
  const right = risks.slice(2, 4);

  return (
    <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
      <div className="flex flex-col gap-3">
        {left.map((r, i) => (
          <RiskCard key={i} r={r} align="left" />
        ))}
        {left.length === 1 ? <div aria-hidden /> : null}
      </div>

      <div className="flex justify-center py-2 md:py-0">
        <RiskRadarCenterVisual risks={risks} />
      </div>

      <div className="flex flex-col gap-3">
        {right.length > 0 ? (
          right.map((r, i) => <RiskCard key={i} r={r} align="right" />)
        ) : (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white/40 p-4 text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-400">
            no further risks flagged
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 4. Should You Move? — circular score gauge + YES/NO badge
// ============================================================================

type Verdict = "go" | "go_with_conditions" | "wait" | "reconsider" | "blocked";

const VERDICT_TO_DECISION: Record<Verdict, { decision: "YES" | "NO"; note: string }> = {
  go: { decision: "YES", note: "Conditions are favourable across the board." },
  go_with_conditions: {
    decision: "YES",
    note: "Move is recommended once the listed conditions are met.",
  },
  wait: { decision: "NO", note: "Hold for now — key inputs need to firm up first." },
  reconsider: { decision: "NO", note: "Material gaps exist on the recommended path." },
  blocked: { decision: "NO", note: "Critical blockers must be cleared before moving." },
};

function confidenceLabel(score: number): "Low" | "Medium" | "High" {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function ShouldYouMoveCard({
  verdict,
  feasibilityScore,
  oneLineReasoning,
  modelConfidence,
}: {
  verdict: Verdict;
  feasibilityScore: number;
  oneLineReasoning: string;
  /** AI's self-reported confidence (0–1), used as a secondary signal. */
  modelConfidence: number;
}) {
  const dec = VERDICT_TO_DECISION[verdict];
  const pct = Math.max(0, Math.min(100, feasibilityScore));
  const conf = confidenceLabel(pct);

  // Circular gauge geometry — stroke-dasharray progress on an SVG circle.
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  const isYes = dec.decision === "YES";
  // Pastel stroke colours — soft mint / soft coral instead of saturated 500s.
  const ringStroke = isYes ? "#6FE6A5" : "#F06F7B"; // success-300 / danger-300
  // Decision pill — pastel background with darker text + soft tonal ring,
  // replacing the previous heavy filled pill with white text.
  const decisionTone = isYes
    ? "bg-success-100 text-success-800 ring-1 ring-inset ring-success-300 shadow-[0_4px_12px_-6px_rgba(16,178,126,0.30)]"
    : "bg-danger-100 text-danger-800 ring-1 ring-inset ring-danger-300 shadow-[0_4px_12px_-6px_rgba(220,42,63,0.30)]";

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]">
        {/* Circular gauge */}
        <div className="relative h-[200px] w-[200px] shrink-0 self-center">
          <svg viewBox="-100 -100 200 200" className="h-full w-full -rotate-90">
            <circle r={radius} fill="none" stroke="#F2E5C9" strokeWidth={12} />
            <circle
              r={radius}
              fill="none"
              stroke={ringStroke}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              style={{
                transition: "stroke-dasharray 900ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Overall score
            </span>
            <span className="mt-1 font-sans text-[40px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
              {pct}
              <span className="ml-0.5 text-[15px] font-mono text-ink-400">/100</span>
            </span>
            <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              conf {conf}
            </span>
          </div>
        </div>

        {/* Decision badge + explanation */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
            The decision
          </p>
          <div
            className={
              "mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2 font-sans text-[22px] font-bold leading-none tracking-tight " +
              decisionTone
            }
          >
            {isYes ? (
              <Check className="h-5 w-5" strokeWidth={3.25} />
            ) : (
              <X className="h-5 w-5" strokeWidth={3.25} />
            )}
            {dec.decision}
          </div>

          <p className="mt-4 text-[14px] leading-[1.55] text-ink-800">
            {oneLineReasoning}
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-600">{dec.note}</p>

          {/* Secondary confidence bar — uses the model's self-reported confidence */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              <span>AI confidence</span>
              <span>{Math.round(modelConfidence * 100)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className={`h-full rounded-full ${isYes ? "bg-success-300" : "bg-danger-300"}`}
                style={{ width: `${Math.round(modelConfidence * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. Next Best Actions — vertical roadmap timeline
// ============================================================================

interface NextAction {
  label: string;
  why: string;
  urgency: string;
  effort_hours: number;
}

/** Map the AI's free-form urgency string to a discrete priority level. */
function priorityForUrgency(urgency: string): "High" | "Medium" | "Low" {
  const u = urgency.toLowerCase();
  if (/(immediate|urgent|asap|now|critical|high)/.test(u)) return "High";
  if (/(soon|this week|month|medium|next)/.test(u)) return "Medium";
  return "Low";
}

const PRIORITY_STYLE: Record<
  "High" | "Medium" | "Low",
  { ring: string; bg: string; text: string; dot: string; icon: LucideIcon }
> = {
  // All pastels: 50/100-level background, 200-level ring, 700-level text for
  // readability, 300-level accent dot. Low uses lagoon (light teal) to vary
  // hue without falling back to heavy ink.
  High: {
    ring: "ring-danger-200",
    bg: "bg-danger-50",
    text: "text-danger-700",
    dot: "bg-danger-300",
    icon: Flame,
  },
  Medium: {
    ring: "ring-warning-200",
    bg: "bg-warning-50",
    text: "text-warning-700",
    dot: "bg-warning-300",
    icon: Zap,
  },
  Low: {
    ring: "ring-lagoon-200",
    bg: "bg-lagoon-50",
    text: "text-lagoon-700",
    dot: "bg-lagoon-300",
    icon: Target,
  },
};

export function NextActionsRoadmap({ actions }: { actions: NextAction[] }) {
  if (!actions.length) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-7 w-7 text-success-600" />
        <p className="mt-2 text-[13.5px] font-semibold text-ink-900">No actions queued.</p>
        <p className="mt-1 text-[12.5px] text-ink-600">
          Synthesis hasn't generated a next-best-actions list yet.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative ml-3 space-y-4 border-l-2 border-dashed border-ink-200 pl-7">
      {actions.map((a, i) => {
        const priority = priorityForUrgency(a.urgency);
        const style = PRIORITY_STYLE[priority];
        const Icon = style.icon;
        return (
          <li key={i} className="relative">
            {/* Timeline node */}
            <span
              className={`absolute -left-[37px] top-2 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white ${style.bg} ring-offset-0`}
              aria-hidden
            >
              <span className={`absolute inset-0 rounded-full ${style.dot} opacity-15`} />
              <Icon className={`relative h-3.5 w-3.5 ${style.text}`} strokeWidth={2.25} />
            </span>

            <article className="rounded-2xl border border-ink-200 bg-white p-4 shadow-elev-sm transition-all hover:-translate-y-0.5 hover:shadow-elev-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    Step {i + 1}
                  </span>
                  <span className={`rounded-full ${style.bg} px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${style.text}`}>
                    {priority} priority
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">
                  <Clock className="h-3 w-3" /> {a.effort_hours}h
                </span>
              </div>
              <p className="mt-2 text-[14px] font-semibold leading-snug text-ink-900">
                {a.label}
              </p>
              <p className="mt-1 text-[12.5px] leading-[1.55] text-ink-600">{a.why}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                urgency · {a.urgency}
              </p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================================
// Section heading (consistent label for every section on the page)
// ============================================================================

export function SynthesisSectionHeading({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <header className="mb-3 flex items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
          {number}
        </p>
        <h2 className="mt-1 inline-flex items-center gap-2 font-sans text-[20px] font-semibold tracking-[-0.015em] text-ink-900">
          {icon ? <span className="text-ink-500">{icon}</span> : null}
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-[1.55] text-ink-600">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
