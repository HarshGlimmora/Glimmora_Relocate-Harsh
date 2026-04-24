import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
          Welcome back
        </div>
        <h1 className="mt-6 font-sans text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Sign in to Glimmora
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Continue managing your hiring pipeline.
        </p>
      </div>

      <div className="soft-card rounded-2xl p-8">
        <Suspense fallback={<div className="h-[340px] animate-pulse rounded-xl bg-ink-100" />}>
          <SignInForm />
        </Suspense>
      </div>

      <p className="mt-8 text-center text-[14px] text-ink-600">
        Don't have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
