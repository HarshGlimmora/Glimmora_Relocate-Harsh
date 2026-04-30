"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { switchDestinationAction } from "./actions";

/**
 * Lets the user re-target the analysis to a different destination country
 * without leaving this page. Saves to the backend profile, then refreshes
 * the route — the page re-runs analysis for the new target.
 */
export function DestinationSwitcher({
  current,
  alternates,
}: {
  current: string;
  alternates: string[];
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function pick(country: string) {
    if (country === current) return;
    setError(null);
    start(async () => {
      const r = await switchDestinationAction(country);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section
      data-destination-switcher
      className="rounded-2xl border border-ink-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Re-target destination
        </p>
        {pending ? (
          <span className="font-mono text-[10px] text-ink-500">Re-running…</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {alternates.map((c) => {
          const active = c === current;
          return (
            <button
              key={c}
              type="button"
              disabled={pending || active}
              onClick={() => pick(c)}
              className={
                "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors " +
                (active
                  ? "border-ink-900 bg-ink-900 text-parchment"
                  : "border-ink-200 bg-white text-ink-700 hover:border-ink-400 disabled:opacity-50")
              }
            >
              {c}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-2 text-[12px] text-danger-700">{error}</p>
      ) : (
        <p className="mt-2 text-[11.5px] text-ink-500">
          Picking another country re-runs the analyses for that target.
        </p>
      )}
    </section>
  );
}
