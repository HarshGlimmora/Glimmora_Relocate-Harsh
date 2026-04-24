import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Star } from "lucide-react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="w-full max-w-[440px]">
      {/* Heading */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
          Welcome back
        </div>
        <h1 className="mt-6 font-sans text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Sign in to Glimmora
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Continue where you left off. Your plan and your Twin are waiting.
        </p>
      </div>

      {/* Form card */}
      <div className="soft-card rounded-2xl p-8">
        <Suspense fallback={<div className="h-[340px] animate-pulse rounded-xl bg-ink-100" />}>
          <SignInForm />
        </Suspense>
      </div>

      {/* Sign-up link */}
      <p className="mt-8 text-center text-[14px] text-ink-600">
        Don't have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>

      {/* Social proof */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
        <span className="flex items-center gap-1.5">
          <Star className="h-3 w-3 fill-gilt-500 text-gilt-500" />
          4.9 avg rating
        </span>
        <span className="text-ink-300">·</span>
        <span>2,400+ members</span>
      </div>
    </div>
  );
}
