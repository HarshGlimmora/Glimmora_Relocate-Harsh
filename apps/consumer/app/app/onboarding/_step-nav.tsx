"use client";

import * as React from "react";
import Link from "next/link";

/**
 * Client-side step navigation row used at the bottom of every onboarding
 * step form. Lives in its own `"use client"` file so the parent
 * `_step-shell.tsx` (a server component) is never double-bundled when a
 * client form imports this — that double-bundling was producing
 * `useContext is null` from `<Link>`'s navigation context.
 */
export function StepNav({
  prevHref,
  nextLabel = "Continue",
  pending,
}: {
  prevHref?: string;
  nextLabel?: string;
  pending?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-ink-200 pt-4">
      {prevHref ? (
        <Link
          href={prevHref}
          className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
        >
          ← Back
        </Link>
      ) : (
        <span />
      )}
      <button
        type="submit"
        disabled={pending}
        data-onboarding-next
        className="rounded-full bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-parchment hover:bg-ink-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : `${nextLabel} →`}
      </button>
    </div>
  );
}
