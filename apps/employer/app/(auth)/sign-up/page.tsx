import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Building2 } from "lucide-react";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your company account" };

export default function SignUpPage() {
  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-lagoon-200 bg-lagoon-50 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-800">
          <Building2 className="h-3 w-3" />
          For hiring teams
        </div>
        <h1 className="mt-6 font-sans text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Post your first role today.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          No card required. Post unlimited roles. Pay only when you hire.
        </p>
      </div>

      <div className="soft-card rounded-2xl p-8">
        <SignUpForm />
      </div>

      <p className="mt-8 text-center text-[14px] text-ink-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-lagoon-600" /> GDPR-ready</span>
        <span className="text-ink-300">·</span>
        <span>12,400+ verified candidates</span>
      </div>
    </div>
  );
}
