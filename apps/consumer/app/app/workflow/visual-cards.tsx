/**
 * Visual cards for the Workflow page.
 *
 * Introduces a *critical-path flow diagram* — chevron-connected node
 * cards laid out horizontally with status-coded colours and a glowing
 * "you are here" ring on the current stage. None of the other pages
 * use a flow diagram of this shape.
 */

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Hourglass,
  Ban,
  ChevronRight,
  GitBranch,
  Hash,
  Timer,
  Target,
} from "lucide-react";
import type {
  WorkflowDetail,
  WorkflowEdge,
  WorkflowNode,
} from "@/lib/backend/types";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
      {children}
    </p>
  );
}

// ---- Status meta (used by the flow + grid + filter chips) -----------

type Status = WorkflowNode["status"];

export const STATUS_META: Record<
  Status,
  { label: string; chip: string; node: string; ring: string; iconWrap: string; iconColor: string; icon: React.ReactNode }
> = {
  done: {
    label: "Done",
    chip: "bg-success-100 text-success-800",
    node: "border-success-300 bg-success-50",
    ring: "ring-success-200",
    iconWrap: "bg-success-100",
    iconColor: "text-success-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  in_progress: {
    label: "In progress",
    chip: "bg-gilt-100 text-gilt-800",
    node: "border-gilt-300 bg-gilt-50",
    ring: "ring-gilt-200",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    icon: <Hourglass className="h-4 w-4" />,
  },
  blocked: {
    label: "Blocked",
    chip: "bg-danger-100 text-danger-800",
    node: "border-danger-300 bg-danger-50",
    ring: "ring-danger-200",
    iconWrap: "bg-danger-100",
    iconColor: "text-danger-700",
    icon: <Ban className="h-4 w-4" />,
  },
  not_started: {
    label: "Not started",
    chip: "bg-ink-100 text-ink-700",
    node: "border-ink-200 bg-white",
    ring: "ring-ink-200",
    iconWrap: "bg-ink-100",
    iconColor: "text-ink-500",
    icon: <CircleDashed className="h-4 w-4" />,
  },
  skipped: {
    label: "Skipped",
    chip: "bg-ink-50 text-ink-500",
    node: "border-ink-100 bg-ink-50/40",
    ring: "ring-ink-100",
    iconWrap: "bg-ink-100",
    iconColor: "text-ink-400",
    icon: <Ban className="h-4 w-4" />,
  },
};

// ---- Workflow status hero · ring + KPI tiles ------------------------

export function WorkflowStatusHero({ detail }: { detail: WorkflowDetail }) {
  const total = detail.nodes.length || 1;
  const counts = detail.nodes.reduce(
    (acc, n) => {
      acc[n.status] = (acc[n.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Status, number>,
  );
  const done = counts.done ?? 0;
  const blocked = counts.blocked ?? 0;
  const inProgress = counts.in_progress ?? 0;
  const pct = Math.round((done / total) * 100);

  // tone goes by both completion and blocked count
  const tone =
    blocked > 2
      ? { ring: "stroke-danger-500", text: "text-danger-700", chip: "bg-danger-100 text-danger-800", verdict: "Stalled · multiple blockers", border: "border-danger-200", bg: "bg-danger-50/40" }
      : blocked > 0
      ? { ring: "stroke-gilt-500", text: "text-gilt-700", chip: "bg-gilt-100 text-gilt-800", verdict: "Some friction", border: "border-gilt-200", bg: "bg-gilt-50/40" }
      : pct >= 70
      ? { ring: "stroke-success-500", text: "text-success-700", chip: "bg-success-100 text-success-800", verdict: "Most of the way", border: "border-success-200", bg: "bg-success-50/40" }
      : { ring: "stroke-ink-500", text: "text-ink-700", chip: "bg-ink-100 text-ink-700", verdict: "Plan in motion", border: "border-ink-200", bg: "bg-white" };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // Composition strip segments
  const segmentsAll: { id: Status; n: number; color: string }[] = [
    { id: "done", n: done, color: "bg-success-500" },
    { id: "in_progress", n: inProgress, color: "bg-gilt-500" },
    { id: "blocked", n: blocked, color: "bg-danger-500" },
    { id: "not_started", n: counts.not_started ?? 0, color: "bg-ink-300" },
    { id: "skipped", n: counts.skipped ?? 0, color: "bg-ink-200" },
  ];
  const segments = segmentsAll.filter((s) => s.n > 0);

  return (
    <section
      data-workflow-status-hero
      className={`rounded-2xl border-2 ${tone.border} ${tone.bg} p-5`}
    >
      <div className="grid items-center gap-5 md:grid-cols-[200px_1fr]">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90" aria-hidden="true">
            <circle cx="48" cy="48" r={radius} className="fill-none stroke-white" strokeWidth="9" />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className={`fill-none ${tone.ring}`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Workflow progress
            </p>
            <p className={`mt-0.5 font-sans text-[34px] font-semibold leading-none ${tone.text}`}>
              {pct}
              <span className="text-[14px] text-ink-400">%</span>
            </p>
            <p className={`mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone.chip}`}>
              {tone.verdict}
            </p>
          </div>
        </div>

        <div data-workflow-composition>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            {total} node{total === 1 ? "" : "s"} · {done} done · {inProgress} in flight · {blocked} blocked
          </p>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-white/70">
            {segments.map((s) => (
              <div
                key={s.id}
                data-strip={s.id}
                className={s.color}
                style={{ width: `${(s.n / total) * 100}%` }}
                title={`${STATUS_META[s.id].label}: ${s.n}`}
              />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] text-ink-700 sm:grid-cols-5">
            {segments.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-ink-700">{STATUS_META[s.id].label}</span>
                <span className="font-mono text-[10px] tabular-nums text-ink-500">{s.n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---- KPI tiles (Total days min/max + blocked count) ----------------

export function WorkflowKpiRow({ detail }: { detail: WorkflowDetail }) {
  const blocked = detail.blocked_node_ids.length;
  return (
    <section>
      <SectionLabel>The numbers · how long, how stuck</SectionLabel>
      <div className="grid gap-3 md:grid-cols-3">
        <KpiTile
          icon={<Timer className="h-4 w-4" />}
          label="Days · min"
          value={String(detail.total_estimated_days_min)}
          tone="info"
          hint="If the path runs clean"
        />
        <KpiTile
          icon={<Hash className="h-4 w-4" />}
          label="Days · max"
          value={String(detail.total_estimated_days_max)}
          tone="warn"
          hint="Worst-case duration"
        />
        <KpiTile
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Blocked nodes"
          value={String(blocked)}
          tone={blocked === 0 ? "good" : blocked <= 2 ? "warn" : "bad"}
          hint={blocked === 0 ? "Nothing in the way" : "Clear these to move forward"}
        />
      </div>
    </section>
  );
}

const TILE_TONE: Record<string, { border: string; bg: string; iconWrap: string; iconColor: string; value: string }> = {
  good: { border: "border-success-200", bg: "bg-success-50/40", iconWrap: "bg-success-100", iconColor: "text-success-700", value: "text-success-800" },
  warn: { border: "border-gilt-200", bg: "bg-gilt-50/40", iconWrap: "bg-gilt-100", iconColor: "text-gilt-700", value: "text-gilt-800" },
  bad: { border: "border-danger-200", bg: "bg-danger-50/40", iconWrap: "bg-danger-100", iconColor: "text-danger-700", value: "text-danger-800" },
  info: { border: "border-lagoon-200", bg: "bg-lagoon-50/40", iconWrap: "bg-lagoon-100", iconColor: "text-lagoon-700", value: "text-lagoon-800" },
  neutral: { border: "border-ink-200", bg: "bg-white", iconWrap: "bg-ink-100", iconColor: "text-ink-700", value: "text-ink-900" },
};

function KpiTile({
  icon,
  label,
  value,
  tone = "neutral",
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: keyof typeof TILE_TONE;
  hint?: string;
}) {
  const p = TILE_TONE[tone];
  return (
    <div
      data-kpi={label}
      className={`rounded-2xl border ${p.border} ${p.bg} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${p.iconWrap} ${p.iconColor}`}
        >
          {icon}
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          {label}
        </p>
      </div>
      <p className={`mt-3 font-sans text-[26px] font-semibold leading-none tracking-tight ${p.value}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] leading-[1.4] text-ink-600">{hint}</p> : null}
    </div>
  );
}

// ---- Critical-path flow diagram (chevron-connected nodes) ----------

export function CriticalPathFlow({ detail }: { detail: WorkflowDetail }) {
  if (!detail.critical_path?.length) return null;

  const nodeById = new Map(detail.nodes.map((n) => [n.id, n] as const));
  const seq = detail.critical_path.map((id) => nodeById.get(id)).filter(Boolean) as WorkflowNode[];
  if (!seq.length) return null;

  return (
    <section data-critical-path-flow>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <SectionLabel>Critical path · the order things have to clear</SectionLabel>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          You are at:&nbsp;
          <span className="text-ink-900">
            {nodeById.get(detail.current_stage_node_id)?.label ?? detail.current_stage_node_id}
          </span>
        </p>
      </div>

      {/* Horizontal scrolling flow on small screens */}
      <div
        data-critical-path-rail
        className="-mx-1 flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-1 pb-2"
      >
        {seq.map((n, i) => {
          const isCurrent = n.id === detail.current_stage_node_id;
          const meta = STATUS_META[n.status];
          return (
            <React.Fragment key={n.id}>
              <div
                data-flow-node={n.id}
                data-flow-current={isCurrent ? "true" : "false"}
                data-status={n.status}
                className={
                  "relative flex min-w-[180px] shrink-0 snap-start flex-col gap-1.5 rounded-2xl border-2 p-3 transition-all " +
                  meta.node +
                  (isCurrent ? ` shadow-md ring-4 ${meta.ring}` : "")
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.iconWrap} ${meta.iconColor}`}
                  >
                    {meta.icon}
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                    Step {i + 1}
                  </span>
                  {isCurrent ? (
                    <span className="ml-auto rounded-full bg-ink-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-parchment">
                      Now
                    </span>
                  ) : null}
                </div>
                <p className="text-[12.5px] font-semibold tracking-[-0.005em] text-ink-900">
                  {n.label}
                </p>
                <div className="flex items-baseline justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${meta.chip}`}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-[9.5px] tabular-nums text-ink-600">
                    {n.estimated_duration_days_min}–{n.estimated_duration_days_max}d
                  </span>
                </div>
              </div>
              {i < seq.length - 1 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="my-auto h-5 w-5 shrink-0 text-ink-300"
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

// ---- Dependencies card (edges as connection rows) -------------------

export function DependenciesCard({
  edges,
  nodes,
}: {
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
}) {
  if (!edges?.length) return null;
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
  const hardCount = edges.filter((e) => e.hard).length;
  const softCount = edges.length - hardCount;

  return (
    <section data-dependencies>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>Dependencies · which step waits on which</SectionLabel>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-danger-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-danger-800">
            {hardCount} hard
          </span>
          {softCount > 0 ? (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
              {softCount} soft
            </span>
          ) : null}
        </div>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {edges.map((e, i) => {
          const from = nodeById.get(e.from_node);
          const to = nodeById.get(e.to_node);
          return (
            <li
              key={i}
              data-edge={i}
              data-edge-hard={e.hard ? "true" : "false"}
              className={
                "flex items-start gap-3 rounded-2xl border p-3 transition-shadow hover:shadow-sm " +
                (e.hard ? "border-ink-200 bg-white" : "border-dashed border-ink-200 bg-ink-50/30")
              }
            >
              <span
                aria-hidden="true"
                className={
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                  (e.hard ? "bg-ink-900 text-parchment" : "bg-ink-100 text-ink-500")
                }
              >
                <GitBranch className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-ink-900">
                  <span className="rounded-md bg-parchment px-1.5 py-0.5">{from?.label ?? e.from_node}</span>
                  <span className="mx-1.5 text-ink-400">→</span>
                  <span className="rounded-md bg-parchment px-1.5 py-0.5">{to?.label ?? e.to_node}</span>
                  {!e.hard ? (
                    <span className="ml-2 rounded-full bg-ink-100 px-1.5 py-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">
                      soft
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-600">{e.reason}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- Workflow insight card · summary + collapsible reasoning -------

export function WorkflowInsightCard({
  summary,
  reasoning,
  confidence,
  headline,
}: {
  summary: string;
  reasoning: string;
  confidence: number;
  headline?: string;
}) {
  const pct = Math.round(confidence * 100);
  const confTone =
    confidence >= 0.75 ? "bg-success-500" : confidence >= 0.55 ? "bg-gilt-500" : "bg-danger-500";
  return (
    <section data-workflow-insight>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>The reading · what shapes this workflow</SectionLabel>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700"
          title={`Confidence ${pct}%`}
        >
          <span className={`h-2 w-2 rounded-full ${confTone}`} />
          conf {pct}%
        </span>
      </div>
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        {headline ? (
          <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-lagoon-50 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-800">
            <Target className="h-3 w-3" /> {headline}
          </p>
        ) : null}
        <p className="text-[14px] leading-[1.6] text-ink-800">{summary}</p>
        {reasoning ? (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 hover:text-ink-900">
              <span className="group-open:hidden">Show full reasoning ↓</span>
              <span className="hidden group-open:inline">Hide reasoning ↑</span>
            </summary>
            <p className="mt-2 whitespace-pre-line border-t border-ink-100 pt-3 text-[13px] leading-[1.6] text-ink-700">
              {reasoning}
            </p>
          </details>
        ) : null}
      </div>
    </section>
  );
}
