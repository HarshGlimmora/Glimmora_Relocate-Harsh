"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { forgotPasswordAction } from "@/app/(public)/actions";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (result.ok) {
        setMessage(result.message ?? "Check your inbox for the reset link.");
      } else {
        setError(result.error);
      }
    });
  }

  if (message) {
    return (
      <div>
        <div className="flex items-start gap-3 rounded-xl border border-lagoon-200 bg-lagoon-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lagoon-700" strokeWidth={2} />
          <div>
            <p className="font-semibold text-lagoon-900">Email sent</p>
            <p className="mt-0.5 text-[13px] text-lagoon-800">{message}</p>
          </div>
        </div>
        <p className="mt-6 text-center text-[12.5px] text-ink-500">
          The link is good for 30 minutes. Don't see it? Check spam, or try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
          {error}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="mono-label mb-1.5 block">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isPending}
          className={cn(
            "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[14.5px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all",
            "focus:outline-none focus:ring-4 focus:border-ink-900 focus:ring-ink-900/10",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send reset link
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
