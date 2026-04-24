"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { signInAction } from "@/app/(public)/actions";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/app";

  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await signInAction(formData);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">{error}</div>
      ) : null}

      <div>
        <label htmlFor="email" className="mono-label mb-1.5 block">Work email</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="marta@kontra.com" disabled={isPending}
          className={inputCls(!!fieldErrors.email)}
        />
        {fieldErrors.email ? <p className="mt-1.5 text-[11.5px] text-danger-600">{fieldErrors.email[0]}</p> : null}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="mono-label">Password</label>
          <span title="Password reset flow ships with W3." className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-400 cursor-not-allowed">Forgot · W3</span>
        </div>
        <div className="relative">
          <input
            id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
            placeholder="Your password" disabled={isPending}
            className={cn(inputCls(!!fieldErrors.password), "pr-10")}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password ? <p className="mt-1.5 text-[11.5px] text-danger-600">{fieldErrors.password[0]}</p> : null}
      </div>

      <button
        type="submit" disabled={isPending}
        className="btn-primary group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold"
      >
        {isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>) : (<>Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>)}
      </button>

      <div className="rounded-xl border border-ink-200 bg-ink-50 p-3.5">
        <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">Try the demo</p>
        <div className="space-y-0.5 font-mono text-[12px] text-ink-700">
          <p>Email: <span className="text-ink-900">demo@employer.glimmora.ai</span></p>
          <p>Password: <span className="text-ink-900">employer1234</span></p>
        </div>
      </div>
    </form>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all",
    "focus:outline-none focus:ring-4",
    invalid
      ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/15"
      : "border-ink-200 focus:border-lagoon-600 focus:ring-lagoon-600/15",
    "disabled:cursor-not-allowed disabled:opacity-50"
  );
}
