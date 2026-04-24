"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { signInAction } from "../(public)/actions";

export function SignInForm() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signInAction(fd);
      if (res.ok) {
        router.push("/app");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue="demo@partner.glimmora.ai"
          className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-plum-600 focus:ring-plum-600/15"
        />
      </div>
      <div>
        <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-plum-600 focus:ring-plum-600/15"
        />
      </div>
      {error ? (
        <p className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-2.5 text-[12.5px] text-danger-700">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-plum-600 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60 disabled:cursor-wait"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
