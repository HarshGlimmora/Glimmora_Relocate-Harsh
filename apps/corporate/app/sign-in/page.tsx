import type { Metadata } from "next";
import { SignInForm } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-ink-200/60">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-moss-600 text-white font-semibold text-[12px]">G</div>
            <p className="font-sans text-[14px] font-semibold text-ink-900">Glimmora <span className="text-moss-700 font-normal">for companies</span></p>
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">Global mobility</p>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[440px] flex-col justify-center px-6 py-12">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-moss-700 font-medium">Mobility console</p>
          <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
            Run your mobility program.
          </h1>
          <p className="mt-3 text-[14px] leading-[1.6] text-ink-600">
            Every active relocation, every policy exception, every euro spent — across your global workforce.
          </p>
        </div>
        <SignInForm />
        <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Demo credentials</p>
          <p className="mt-2 font-mono text-[12px] text-ink-700">demo@corporate.glimmora.ai</p>
          <p className="font-mono text-[12px] text-ink-700">corporate1234</p>
        </div>
      </main>
    </div>
  );
}
