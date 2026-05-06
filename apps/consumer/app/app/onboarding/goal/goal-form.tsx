"use client";

import * as React from "react";
import { saveGoalAndContinue } from "../_actions";
import { StepNav } from "../_step-nav";

interface Option {
  id: string;
  label: string;
  hint: string;
}

export function GoalForm({
  initialIntent,
  options,
}: {
  initialIntent: string | null;
  options: Option[];
}) {
  const [selected, setSelected] = React.useState<string | null>(initialIntent);
  const [reason, setReason] = React.useState<string>("");
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      setError("Pick a goal to continue.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await saveGoalAndContinue({
          relocation_goal: selected,
          reason_for_moving: reason.trim() || null,
        });
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              data-intent={o.id}
              data-active={active ? "true" : "false"}
              className={
                "rounded-2xl border p-4 text-left transition-all " +
                (active
                  ? "border-ink-900 bg-ink-900 text-parchment shadow-sm"
                  : "border-ink-200 bg-white text-ink-800 hover:border-ink-400")
              }
            >
              <p className="text-[14px] font-semibold tracking-tight">{o.label}</p>
              <p
                className={
                  "mt-1 text-[12.5px] leading-[1.5] " +
                  (active ? "text-parchment/70" : "text-ink-600")
                }
              >
                {o.hint}
              </p>
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="block text-[12.5px] font-medium text-ink-700">
          Why this move? (one line — optional)
        </span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. partner has family in Berlin"
          maxLength={600}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13.5px] focus:outline focus:outline-2 focus:outline-ink-900"
        />
      </label>

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <StepNav pending={pending} />
    </form>
  );
}
