"use client";

/**
 * Interactive Workflow Nodes Explorer.
 *
 * Adds:
 *   • Status filter chips (All / Done / In progress / Blocked / Not started / Skipped)
 *   • Category filter chips (auto-derived from the data)
 *   • View toggle: "Flat list" vs "By category" (swimlane-style groups)
 *   • Per-node card with status icon, owner chip, duration chip,
 *     description and blocked-reason callout
 */

import * as React from "react";
import { LayoutList, LayoutPanelLeft } from "lucide-react";
import type { WorkflowNode } from "@/lib/backend/types";
import { SectionLabel, STATUS_META } from "./visual-cards";

type Status = WorkflowNode["status"];

export function NodesExplorer({
  nodes,
  currentStageNodeId,
}: {
  nodes: WorkflowNode[];
  currentStageNodeId: string;
}) {
  const [activeStatus, setActiveStatus] = React.useState<Status | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"flat" | "grouped">("grouped");

  // Counts
  const statusCounts = React.useMemo(() => {
    const c: Partial<Record<Status, number>> = {};
    for (const n of nodes) c[n.status] = (c[n.status] ?? 0) + 1;
    return c;
  }, [nodes]);

  const categories = React.useMemo(() => {
    const seen = new Map<string, number>();
    for (const n of nodes) seen.set(n.category, (seen.get(n.category) ?? 0) + 1);
    return Array.from(seen.entries());
  }, [nodes]);

  const visible = React.useMemo(() => {
    return nodes.filter((n) => {
      if (activeStatus && n.status !== activeStatus) return false;
      if (activeCategory && n.category !== activeCategory) return false;
      return true;
    });
  }, [nodes, activeStatus, activeCategory]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, WorkflowNode[]>();
    for (const n of visible) {
      const arr = map.get(n.category) ?? [];
      arr.push(n);
      map.set(n.category, arr);
    }
    return Array.from(map.entries());
  }, [visible]);

  if (!nodes.length) return null;

  return (
    <section data-nodes-explorer>
      <SectionLabel>All nodes · filter, group, drill in</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        {/* ============ Status filter chips ============ */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Status
          </span>
          <FilterChip
            active={activeStatus === null}
            onClick={() => setActiveStatus(null)}
            label={`All (${nodes.length})`}
          />
          {(Object.keys(STATUS_META) as Status[]).map((s) => {
            const n = statusCounts[s];
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

          {/* View toggle on the right */}
          <div
            role="tablist"
            aria-label="View"
            className="ml-auto inline-flex rounded-full border border-ink-200 bg-ink-50/60 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "grouped"}
              data-view-mode="grouped"
              onClick={() => setView("grouped")}
              title="Group by category"
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-all " +
                (view === "grouped"
                  ? "bg-ink-900 text-parchment shadow-sm"
                  : "text-ink-700 hover:text-ink-900")
              }
            >
              <LayoutPanelLeft className="h-3 w-3" /> Group
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "flat"}
              data-view-mode="flat"
              onClick={() => setView("flat")}
              title="Flat list"
              className={
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-all " +
                (view === "flat"
                  ? "bg-ink-900 text-parchment shadow-sm"
                  : "text-ink-700 hover:text-ink-900")
              }
            >
              <LayoutList className="h-3 w-3" /> List
            </button>
          </div>
        </div>

        {/* ============ Category filter chips ============ */}
        {categories.length > 1 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Category
            </span>
            <FilterChip
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
              label={`All (${nodes.length})`}
            />
            {categories.map(([cat, n]) => (
              <FilterChip
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                label={`${cat} (${n})`}
              />
            ))}
          </div>
        ) : null}

        {/* ============ Body — empty / flat / grouped ============ */}
        {visible.length === 0 ? (
          <p
            data-nodes-empty
            className="mt-4 rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
          >
            No nodes match the current filters.
          </p>
        ) : view === "flat" ? (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {visible.map((n) => (
              <NodeCard key={n.id} node={n} isCurrent={n.id === currentStageNodeId} />
            ))}
          </ul>
        ) : (
          <div className="mt-4 space-y-4">
            {grouped.map(([category, list]) => (
              <div key={category} data-category-lane={category}>
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-700">
                    {category}
                  </p>
                  <span className="rounded-full bg-lagoon-50 px-2 py-0.5 font-mono text-[9.5px] tabular-nums text-lagoon-700">
                    {list.length}
                  </span>
                  <span aria-hidden="true" className="ml-2 h-px flex-1 bg-ink-100" />
                </div>
                <ul className="grid gap-2 md:grid-cols-2">
                  {list.map((n) => (
                    <NodeCard key={n.id} node={n} isCurrent={n.id === currentStageNodeId} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NodeCard({ node, isCurrent }: { node: WorkflowNode; isCurrent: boolean }) {
  const meta = STATUS_META[node.status];
  return (
    <li
      data-node={node.id}
      data-status={node.status}
      data-category={node.category}
      className={
        "rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm " +
        meta.node +
        (isCurrent ? " ring-2 ring-ink-900/20" : "")
      }
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.iconWrap} ${meta.iconColor}`}
        >
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <p className="text-[13px] font-semibold tracking-[-0.005em] text-ink-900">
              {node.label}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${meta.chip}`}
            >
              {meta.label}
            </span>
            {isCurrent ? (
              <span className="rounded-full bg-ink-900 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-parchment">
                Now
              </span>
            ) : null}
            <span className="ml-auto font-mono text-[9.5px] tabular-nums text-ink-500">
              {node.estimated_duration_days_min}–{node.estimated_duration_days_max}d
            </span>
          </div>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
            {node.category} · owner · {node.owner}
          </p>
          {node.description ? (
            <p className="mt-1.5 text-[11.5px] leading-[1.5] text-ink-700">{node.description}</p>
          ) : null}
          {node.blocked_reason ? (
            <p className="mt-1.5 rounded-lg bg-danger-100/60 px-2 py-1 text-[11px] leading-[1.45] text-danger-800">
              ⚠ {node.blocked_reason}
            </p>
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
