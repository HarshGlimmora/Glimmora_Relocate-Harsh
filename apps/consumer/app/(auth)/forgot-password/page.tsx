import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-10 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-200 bg-white shadow-sm">
          <Mail className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-sans text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Reset your password
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          Enter the email on your account. We'll send a reset link good for 30 minutes.
        </p>
      </div>

      <div className="soft-card rounded-2xl p-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-8 text-center text-[14px] text-ink-600">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
