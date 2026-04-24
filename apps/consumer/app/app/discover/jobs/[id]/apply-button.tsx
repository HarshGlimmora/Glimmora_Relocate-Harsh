"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send } from "lucide-react";
import { applyToJobAction } from "../actions";

export function ApplyButton({
  jobId,
  initialApplied,
  readiness,
}: {
  jobId: string;
  initialApplied: boolean;
  readiness: { profession: string | null; passport: string | null };
}) {
  const router = useRouter();
  const [applied, setApplied] = React.useState(initialApplied);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const missing: string[] = [];
  if (!readiness.profession) missing.push("profession");
  if (!readiness.passport) missing.push("passport");

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await applyToJobAction(jobId);
      if (res.ok) {
        setApplied(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (applied) {
    return (
      <div className="inline-flex h-12 items-center gap-2 rounded-full bg-lagoon-50 border border-lagoon-200 px-6 text-[14px] font-semibold text-lagoon-800">
        <Check className="h-4 w-4" strokeWidth={2.5} /> Application submitted
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 px-7 text-[14px] font-semibold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60 disabled:cursor-wait"
      >
        {pending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
        ) : (
          <><Send className="h-4 w-4" /> Apply with my Twin</>
        )}
      </button>
      {missing.length > 0 ? (
        <p className="text-[12px] text-ink-500">
          Tip: add your {missing.join(" and ")} to your Twin for a stronger application.
        </p>
      ) : null}
      {error ? <p className="text-[12px] text-danger-700">{error}</p> : null}
    </div>
  );
}
