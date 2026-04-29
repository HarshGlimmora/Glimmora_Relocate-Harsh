/**
 * Minimal envelope-rendering primitives.
 *
 * Every analysis page needs the same scaffolding: a header, the
 * `summary`, `score`, `confidence`, `risks`, `next_actions`,
 * `assumptions`, plus a state line ("Generated 2 minutes ago, model =
 * gemini-2.5-pro"). These components do exactly that. The
 * module-specific `detail` rendering goes inside the `children` slot.
 */

import * as React from "react";
import type {
  AnalysisEnvelope,
  Assumption,
  FailedEnvelope,
  ModuleResponse,
  NextAction,
  Risk,
} from "@/lib/backend/types";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-ink-600">{description}</p>
      ) : null}
    </header>
  );
}

export function StalePill({ stale, reason }: { stale: boolean; reason: string | null }) {
  if (!stale) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 border border-success-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-success-800">
        Current
      </span>
    );
  }
  return (
    <span
      title={reason ?? undefined}
      className="inline-flex items-center gap-1.5 rounded-full bg-gilt-50 border border-gilt-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800"
    >
      Stale{reason ? " · upstream changed" : ""}
    </span>
  );
}

export function EnvelopeMeta<T>({ row }: { row: ModuleResponse<T> }) {
  const md = "metadata" in row.envelope ? row.envelope.metadata : {};
  const model = (md as { model?: string }).model ?? row.model ?? "—";
  const lat = (md as { latency_ms?: number }).latency_ms ?? row.latency_ms ?? null;
  const ti = (md as { tokens_in?: number }).tokens_in ?? row.tokens_in ?? null;
  const to = (md as { tokens_out?: number }).tokens_out ?? row.tokens_out ?? null;
  const ver = row.analysis_version;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-ink-500">
      <StalePill stale={row.stale} reason={row.stale_reason} />
      <span>v{ver}</span>
      <span>·</span>
      <span>model: {model}</span>
      {lat != null ? (
        <>
          <span>·</span>
          <span>{lat}ms</span>
        </>
      ) : null}
      {ti != null && to != null ? (
        <>
          <span>·</span>
          <span>tokens: {ti}/{to}</span>
        </>
      ) : null}
      {row.cached ? (
        <>
          <span>·</span>
          <span>cached</span>
        </>
      ) : null}
    </div>
  );
}

export function ScoreCard({ label, value, hint }: { label: string; value: number | null | undefined; hint?: string }) {
  if (value == null) return null;
  const tone =
    value >= 70 ? "text-success-700" : value >= 50 ? "text-gilt-700" : "text-danger-700";
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className={`mt-2 font-sans text-[34px] font-semibold leading-none ${tone}`}>{value}<span className="text-[14px] text-ink-400">/100</span></p>
      {hint ? <p className="mt-2 text-[12px] text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function SummaryReasoning({ envelope }: { envelope: AnalysisEnvelope<unknown> }) {
  return (
    <section className="grid gap-4 md:grid-cols-[1fr_2fr]">
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Summary</p>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-800">{envelope.summary}</p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Confidence</p>
        <p className="mt-1 text-[13px] text-ink-800">{Math.round(envelope.confidence * 100)}%</p>
      </div>
      <div className="rounded-2xl border border-ink-200 bg-white p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">Reasoning</p>
        <p className="mt-2 whitespace-pre-line text-[13.5px] leading-[1.6] text-ink-700">
          {envelope.reasoning}
        </p>
      </div>
    </section>
  );
}

export function RisksList({ risks }: { risks: Risk[] }) {
  if (!risks.length) return null;
  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Risks</h2>
      <ul className="space-y-2">
        {risks.map((r, i) => (
          <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className={
                  "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] " +
                  (r.severity === "high"
                    ? "bg-danger-50 text-danger-700"
                    : r.severity === "medium"
                    ? "bg-gilt-50 text-gilt-700"
                    : "bg-ink-50 text-ink-700")
                }
              >
                {r.severity}
              </span>
              <p className="text-[13.5px] font-semibold text-ink-900">{r.label}</p>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-600">{r.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NextActionsList({ actions }: { actions: NextAction[] }) {
  if (!actions.length) return null;
  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Next actions</h2>
      <ol className="space-y-2">
        {actions.map((a, i) => (
          <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-ink-900">{a.label}</p>
              <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                {a.urgency}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-600">{a.why}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AssumptionsList({ items }: { items: Assumption[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">Assumptions used</h2>
      <ul className="space-y-2">
        {items.map((a, i) => (
          <li key={i} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-ink-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                {a.source}
              </span>
              <p className="text-[13.5px] font-semibold text-ink-900">{a.label}</p>
              <span className="ml-auto font-mono text-[10px] text-ink-500">
                conf {Math.round(a.confidence * 100)}%
              </span>
            </div>
            {a.detail ? (
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-600">{a.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FailedEnvelopeView({ envelope }: { envelope: FailedEnvelope }) {
  return (
    <div className="rounded-2xl border border-danger-200 bg-danger-50 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-700">Module failed</p>
      <p className="mt-2 text-[14px] font-semibold text-danger-900">{envelope.user_message}</p>
      <p className="mt-1 font-mono text-[11px] text-danger-700/80">code: {envelope.error_code}</p>
    </div>
  );
}

export function isReadyEnvelope<T>(
  env: AnalysisEnvelope<T> | FailedEnvelope,
): env is AnalysisEnvelope<T> {
  return env.status !== "failed";
}

export function BlockedState({ message, actionHref, actionLabel }: { message: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">Need more data</p>
      <p className="mt-3 text-[14px] text-ink-700">{message}</p>
      {actionHref && actionLabel ? (
        <a
          href={actionHref}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-parchment hover:bg-ink-800"
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
