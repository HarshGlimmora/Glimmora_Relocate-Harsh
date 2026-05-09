/**
 * Buffering / skeleton primitives.
 *
 * Used by every module page's `loading.tsx` (Next.js convention) so the
 * user sees a stable layout while the server component awaits
 * `requirePrereqs` + `module.ensure(caseId)` (which can take seconds
 * because each `ensure` may trigger a Vertex generation). The same
 * `<Skeleton>` block is also reusable inline — e.g. while a client-side
 * action recomputes a panel.
 */

import * as React from "react";

export function Skeleton({
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-skeleton
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-ink-100 ${className}`}
      {...rest}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={
            "h-3 animate-pulse rounded bg-ink-100/80 " +
            (i === lines - 1 ? "w-2/3" : "w-full")
          }
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className = "",
  height = "h-28",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      data-skeleton-card
      className={`rounded-2xl border border-ink-200 bg-white p-4 ${className}`}
    >
      <div className={`animate-pulse rounded-xl bg-ink-100/70 ${height}`} />
    </div>
  );
}

/**
 * Whole-page skeleton matching the shape every analysis page (country,
 * jobs, finance, visa, timeline, workflow…) renders: header + meta strip
 * + value-lead card + two grids of metric cards. Centralised here so a
 * future restyle only has to update one file.
 */
export function ModulePageSkeleton({
  eyebrow,
  title,
  hint,
  metricCount = 4,
  panelCount = 2,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  /** How many metric tiles to render in the first grid. Defaults to 4. */
  metricCount?: number;
  /** How many large card panels to render below the metric strip. */
  panelCount?: number;
}) {
  return (
    <div
      className="mx-auto max-w-[1100px] px-6 py-12"
      data-module-page-skeleton
      aria-busy="true"
      aria-live="polite"
    >
      <header className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.01em] text-ink-900">
          {title}
        </h1>
        {hint ? (
          <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-600">
            {hint}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </header>

      <div className="space-y-6">
        <SkeletonCard height="h-24" />
        <SkeletonCard height="h-32" />

        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(metricCount, 4)}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: metricCount }).map((_, i) => (
            <SkeletonCard key={i} height="h-24" />
          ))}
        </div>

        {Array.from({ length: panelCount }).map((_, i) => (
          <SkeletonCard key={i} height="h-40" />
        ))}
      </div>
    </div>
  );
}
