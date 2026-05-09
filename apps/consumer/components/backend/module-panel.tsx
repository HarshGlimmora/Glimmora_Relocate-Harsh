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
  collapsible = false,
  defaultOpen = false,
  topSlot,
  applyDisabled = false,
  applyDisabledMessage,
  elevated = false,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  onApply: () => Promise<{ ok: true } | { ok: false; error: string }>;
  applyLabel?: string;
  busyLabel?: string;
  testid?: string;
  /** When true, the panel becomes a collapsible accordion. */
  collapsible?: boolean;
  /** Open state when `collapsible`. Defaults to closed. */
  defaultOpen?: boolean;
  /** Optional element rendered above the form when expanded — used by
   *  the Job Fit page to inject AI-generated career-angle recommendations
   *  ahead of the form fields. */
  topSlot?: React.ReactNode;
  /** When true, the Apply button is disabled. Use for client-side
   *  validation (e.g. required fields empty). Pair with
   *  `applyDisabledMessage` to explain why. */
  applyDisabled?: boolean;
  /** Inline copy shown next to the Apply button when it's disabled.
   *  Visible to a11y as the button's `aria-describedby` target. */
  applyDisabledMessage?: string;
  /** When true, the panel renders as a "primary input step" with a
   *  thicker border + soft elevation shadow. Pair with a wrapper
   *  `<div className="relative z-10 -mb-…">` in the page if you also
   *  want it to overlap the next section. */
  elevated?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);
  const [open, setOpen] = React.useState<boolean>(collapsible ? defaultOpen : true);

  function apply() {
    if (applyDisabled || pending) return;
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

  const disabledHintId = applyDisabledMessage
    ? `panel-${testid ?? "module"}-disabled-hint`
    : undefined;

  const isOpen = collapsible ? open : true;

  return (
    <section
      data-module-panel={testid}
      data-module-panel-collapsible={collapsible ? "true" : "false"}
      data-module-panel-open={isOpen ? "true" : "false"}
      data-module-panel-elevated={elevated ? "true" : "false"}
      className={
        "rounded-2xl bg-white p-5 transition-shadow " +
        (elevated
          ? "border-2 border-ink-300 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.25)] hover:shadow-[0_22px_48px_-22px_rgba(15,23,42,0.30)]"
          : "border border-ink-200")
      }
    >
      {/* Header — clickable when collapsible */}
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={isOpen}
          data-panel-toggle
          className="-m-1 flex w-full items-start gap-3 rounded-xl p-1 text-left transition-colors hover:bg-ink-50/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
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
          </div>
          <span
            aria-hidden="true"
            className={
              "mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-700 transition-transform " +
              (isOpen ? "rotate-180" : "")
            }
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M3.5 5.5l4.5 5 4.5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ) : (
        <>
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
        </>
      )}

      {/* Smooth expand/collapse using the grid-rows trick — no JS height
          measurement required. When closed, the inner area animates to
          0 rows and is hidden from a11y. */}
      <div
        data-panel-body
        className={
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out " +
          (isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
        }
        aria-hidden={!isOpen}
      >
        <div className="min-h-0 overflow-hidden">
          {topSlot ? <div className="mt-4">{topSlot}</div> : null}
          <div className={topSlot ? "mt-4 space-y-3" : "mt-3 space-y-3"}>
            {children}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={apply}
              disabled={pending || !isOpen || applyDisabled}
              data-panel-apply
              data-panel-apply-disabled={applyDisabled ? "true" : "false"}
              aria-describedby={disabledHintId}
              className="rounded-full bg-ink-900 px-4 py-2 text-[12.5px] font-medium text-parchment hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? busyLabel : applyLabel}
            </button>
            {applyDisabled && applyDisabledMessage ? (
              <p
                id={disabledHintId}
                data-panel-apply-hint
                className="text-[12px] text-danger-700"
              >
                {applyDisabledMessage}
              </p>
            ) : null}
            {error ? (
              <p data-panel-error className="text-[12px] text-danger-700">
                {error}
              </p>
            ) : null}
          </div>
        </div>
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
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  /** When true, the label gets a red asterisk and the input is marked
   *  as required for a11y. Validation itself is owned by the caller. */
  required?: boolean;
  /** Inline validation message rendered under the input. The input gets
   *  a danger border when this is truthy. */
  error?: string | null;
}) {
  const hasError = Boolean(error);
  return (
    <label className="block">
      <span className="block text-[11.5px] font-medium text-ink-700">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger-700">*</span>
        ) : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        required={required}
        aria-invalid={hasError ? true : undefined}
        data-panel-input-error={hasError ? "true" : "false"}
        className={
          "mt-1 w-full rounded-lg border bg-white px-2.5 py-1.5 text-[13px] focus:outline focus:outline-2 focus:-outline-offset-2 " +
          (hasError
            ? "border-danger-400 focus:outline-danger-600"
            : "border-ink-200 focus:outline-ink-900")
        }
      />
      {hasError ? (
        <span
          data-panel-input-message
          className="mt-1 block text-[11.5px] text-danger-700"
        >
          {error}
        </span>
      ) : null}
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
