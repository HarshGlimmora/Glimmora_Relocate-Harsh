"use client";

/**
 * Interactive Documents checklist grid.
 *
 * Card grid of every required document with:
 *   • status icon + chip (have / need / expiring / unknown)
 *   • urgency chip (now / 30d / 90d / 6m / later)
 *   • required-for chips
 *   • optional notes / expires_at
 *   • status filter chips at the top
 *   • urgency sort toggle (now-first / later-first)
 *
 * Read-only view of the data — the actual editing happens in the
 * separate `DocumentsStatusPanel` already on the page. This grid is
 * purely for scanning and filtering, like a kanban board view.
 */

import * as React from "react";
import type { ChecklistItem } from "@/lib/backend/types";
import { SectionLabel, STATUS_META, URGENCY_META } from "./visual-cards";

type StatusKey = ChecklistItem["status"];
type SortDir = "now-first" | "later-first";

export function ChecklistGrid({ items }: { items: ChecklistItem[] }) {
  const [activeStatus, setActiveStatus] = React.useState<StatusKey | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("now-first");

  // Status counts (always reflect the unfiltered list)
  const counts = React.useMemo(() => {
    const c: Record<StatusKey, number> = { have: 0, need: 0, expiring: 0, unknown: 0 };
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  // Filtered + sorted view
  const visible = React.useMemo(() => {
    const base = activeStatus ? items.filter((i) => i.status === activeStatus) : items.slice();
    base.sort((a, b) => {
      const ra = URGENCY_META[a.urgency]?.rank ?? 99;
      const rb = URGENCY_META[b.urgency]?.rank ?? 99;
      return sortDir === "now-first" ? ra - rb : rb - ra;
    });
    return base;
  }, [items, activeStatus, sortDir]);

  if (!items.length) return null;

  return (
    <section data-checklist-grid>
      <SectionLabel>Document checklist · scan, filter by status, act</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        {/* ============ Filter chips + sort toggle ============ */}
        <div
          data-checklist-filters
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Filter
          </span>
          <FilterChip
            active={activeStatus === null}
            onClick={() => setActiveStatus(null)}
            label={`All (${items.length})`}
          />
          {(Object.keys(STATUS_META) as StatusKey[]).map((s) => {
            const n = counts[s];
            if (!n) return null;
            const meta = STATUS_META[s];
            return (
              <FilterChip
                key={s}
                active={activeStatus === s}
                onClick={() => setActiveStatus(activeStatus === s ? null : s)}
                label={`${meta.label} (${n})`}
                tone={meta.chip}
              />
            );
          })}

          <button
            type="button"
            onClick={() =>
              setSortDir((d) => (d === "now-first" ? "later-first" : "now-first"))
            }
            data-sort={sortDir}
            className="ml-auto rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            {sortDir === "now-first" ? "Sort · most urgent first ↑" : "Sort · later first ↓"}
          </button>
        </div>

        {/* ============ Empty state ============ */}
        {visible.length === 0 ? (
          <p
            data-checklist-empty
            className="mt-4 rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
          >
            No documents in this status.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {visible.map((it) => (
              <ChecklistCard key={it.kind} item={it} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ChecklistCard({ item }: { item: ChecklistItem }) {
  const status = STATUS_META[item.status];
  const urgency = URGENCY_META[item.urgency] ?? URGENCY_META.later;
  return (
    <li
      data-checklist-item={item.kind}
      data-status={item.status}
      data-urgency={item.urgency}
      className={`group rounded-2xl border ${status.border} ${status.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${status.iconWrap} ${status.iconColor}`}
        >
          {status.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <p className="text-[13.5px] font-semibold tracking-[-0.005em] text-ink-900">
              {item.label}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${status.chip}`}
            >
              {status.label}
            </span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${urgency.chip}`}
              title={`Urgency: ${item.urgency}`}
            >
              {urgency.short}
            </span>
          </div>

          {/* Required-for chips */}
          {item.required_for?.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                For
              </span>
              {item.required_for.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-700"
                >
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          ) : null}

          {/* Expiry */}
          {item.expires_at ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">
              expires · {item.expires_at}
            </p>
          ) : null}

          {/* Notes */}
          {item.notes ? (
            <p className="mt-2 text-[12px] leading-[1.5] text-ink-700">{item.notes}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-filter-active={active ? "true" : "false"}
      className={
        "rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors " +
        (active
          ? "border-ink-900 bg-ink-900 text-parchment"
          : (tone ?? "bg-white text-ink-700") + " border-ink-200 hover:border-ink-400")
      }
    >
      {label}
    </button>
  );
}
