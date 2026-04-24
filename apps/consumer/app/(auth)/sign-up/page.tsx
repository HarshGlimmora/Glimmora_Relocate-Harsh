import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <div className="w-full max-w-[440px]">
      {/* Heading */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gilt-200 bg-gilt-50 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-800">
          <Sparkles className="h-3 w-3" />
          Free to start
        </div>
        <h1 className="mt-6 font-sans text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Create your account
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Twenty minutes with the Copilot gives you a first plan. No card required.
        </p>
      </div>

      {/* Form card */}
      <div className="soft-card rounded-2xl p-8">
        <SignUpForm />
      </div>

      {/* Sign-in link */}
      <p className="mt-8 text-center text-[14px] text-ink-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>

      {/* Trust strip */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-lagoon-600" />
          GDPR-ready
        </span>
        <span className="text-ink-300">·</span>
        <span>2,400+ members</span>
        <span className="text-ink-300">·</span>
        <span>47 corridors</span>
      </div>
    </div>
  );
}
