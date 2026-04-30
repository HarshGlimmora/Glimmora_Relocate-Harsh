"use client";

import * as React from "react";
import { ModulePanel } from "@/components/backend/module-panel";
import { applyDocumentStatusAction } from "./actions";

type Status = "have" | "need" | "expiring" | "unknown";

interface ItemRow {
  kind: string;
  label: string;
  status: Status;
}

const STATUS_OPTIONS: { id: Status; label: string; tone: string }[] = [
  { id: "have", label: "Have", tone: "bg-success-50 text-success-800 border-success-300" },
  { id: "need", label: "Need", tone: "bg-danger-50 text-danger-800 border-danger-300" },
  { id: "expiring", label: "Expiring", tone: "bg-gilt-50 text-gilt-900 border-gilt-300" },
  { id: "unknown", label: "Unknown", tone: "bg-ink-50 text-ink-700 border-ink-200" },
];

export function DocumentsStatusPanel({
  initialItems,
}: {
  initialItems: ItemRow[];
}) {
  const [items, setItems] = React.useState<ItemRow[]>(initialItems);

  function setStatus(kind: string, status: Status) {
    setItems((rs) => rs.map((r) => (r.kind === kind ? { ...r, status } : r)));
  }

  return (
    <ModulePanel
      testid="documents"
      title="Mark what you actually have"
      hint="Tag each document — have / need / expiring. We rebuild the checklist + readiness score from your real status."
      onApply={async () => {
        const map: Record<string, { has?: boolean; notes?: string }> = {};
        for (const it of items) {
          if (it.status === "have") map[it.kind] = { has: true };
          else if (it.status === "need") map[it.kind] = { has: false };
          else if (it.status === "expiring")
            map[it.kind] = { has: true, notes: "expiring soon" };
        }
        return applyDocumentStatusAction(map);
      }}
    >
      <ul className="divide-y divide-ink-100" data-document-status-list>
        {items.map((it) => (
          <li
            key={it.kind}
            className="flex items-center justify-between gap-3 py-1.5"
            data-document-row={it.kind}
          >
            <p className="text-[12.5px] text-ink-800 truncate">{it.label}</p>
            <div className="flex flex-wrap gap-1">
              {STATUS_OPTIONS.map((s) => {
                const active = it.status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatus(it.kind, s.id)}
                    data-doc-status={s.id}
                    data-doc-active={active ? "true" : "false"}
                    className={
                      "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors " +
                      (active
                        ? s.tone + " font-semibold"
                        : "border-ink-200 bg-white text-ink-500 hover:border-ink-400")
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </ModulePanel>
  );
}
