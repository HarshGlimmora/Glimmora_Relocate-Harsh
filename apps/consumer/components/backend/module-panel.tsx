"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Right-side interactive panel that sits next to every module's analysis.
 * Lets the user adjust assumptions or supply more context, then re-runs
 * the analysis. The shell is shared so every page feels the same — only
 * the form fields differ.
 */
export function ModulePanel({
  title,
  hint,
  children,
  onApply,
  applyLabel = "Re-run with these answers",
  busyLabel = "Updating analysis…",
  testid,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  onApply: () => Promise<{ ok: true } | { ok: false; error: string }>;
  applyLabel?: string;
  busyLabel?: string;
  testid?: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);

  function apply() {
    setError(null);
    setApplied(false);
    start(async () => {
      const r = await onApply();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setApplied(true);
      router.refresh();
    });
  }

  return (
    <section
      data-module-panel={testid}
      className="rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          {title}
        </p>
        {pending ? (
          <span data-panel-status="pending" className="font-mono text-[10px] text-gilt-700">
            {busyLabel}
          </span>
        ) : applied ? (
          <span data-panel-status="applied" className="font-mono text-[10px] text-success-700">
            Applied · refreshing
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-1 text-[12px] leading-[1.5] text-ink-500">{hint}</p>
      ) : null}
      <div className="mt-3 space-y-3">{children}</div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={pending}
          data-panel-apply
          className="rounded-full bg-ink-900 px-4 py-2 text-[12.5px] font-medium text-parchment hover:bg-ink-800 disabled:opacity-50"
        >
          {pending ? busyLabel : applyLabel}
        </button>
        {error ? (
          <p data-panel-error className="text-[12px] text-danger-700">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PanelChips<T extends string>({
  label,
  options,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  options: { id: T; label: string; hint?: string }[];
  value: T[] | T | null;
  onChange: (next: T[] | T) => void;
  multi?: boolean;
}) {
  const selected = new Set<string>(
    Array.isArray(value) ? value : value ? [value] : [],
  );
  function toggle(id: T) {
    if (multi) {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      const has = arr.includes(id);
      const next = has ? arr.filter((x) => x !== id) : [...arr, id];
      onChange(next as T[]);
    } else {
      onChange(id);
    }
  }
  return (
    <div>
      <p className="text-[11.5px] font-medium text-ink-700">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              data-chip={o.id}
              data-chip-active={active ? "true" : "false"}
              onClick={() => toggle(o.id)}
              title={o.hint}
              className={
                "rounded-full border px-3 py-1 text-[11.5px] transition-colors " +
                (active
                  ? "border-ink-900 bg-ink-900 text-parchment"
                  : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PanelInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-medium text-ink-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline focus:outline-2 focus:outline-ink-900 focus:-outline-offset-2"
      />
    </label>
  );
}

export function PanelToggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span className="block">
        <span className="block text-[12.5px] font-medium text-ink-800">{label}</span>
        {hint ? <span className="block text-[11.5px] text-ink-500">{hint}</span> : null}
      </span>
    </label>
  );
}

export function PanelSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-medium text-ink-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline focus:outline-2 focus:outline-ink-900"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
