"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { saveIntentAction } from "./actions";

interface Option {
  id: string;
  label: string;
  hint: string;
}

export function IntentPicker({
  initial,
  options,
}: {
  initial: string | null;
  options: Option[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(initial);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onContinue() {
    if (!selected) {
      setError("Pick an intent to continue.");
      return;
    }
    setError(null);
    start(async () => {
      const r = await saveIntentAction(selected);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push("/app/onboarding/resume");
    });
  }

  return (
    <div className="mt-8 space-y-4">
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

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-ink-200 pt-4">
        <p className="text-[12.5px] text-ink-500">
          You can change this anytime from settings.
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={pending}
          className="rounded-full bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-parchment hover:bg-ink-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
