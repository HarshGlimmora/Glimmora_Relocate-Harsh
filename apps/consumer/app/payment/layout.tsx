import Link from "next/link";
import { GlimmoraMark } from "@/components/shared/glimmora-mark";

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-parchment text-ink-900">
      {/* Soft ambient gradient — matches the (auth) layout for a continuous feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="orb h-[600px] w-[600px] bg-gilt-100 -top-32 -left-32" />
        <div className="orb h-[600px] w-[600px] bg-lagoon-100 -bottom-32 -right-32" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            aria-label="Glimmora home"
            className="flex items-center rounded-full px-2 py-1 transition-colors hover:bg-ink-900/5"
          >
            <GlimmoraMark height={34} className="text-ink-900" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-700 backdrop-blur-sm">
            Step 2 · Choose your plan
          </span>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] items-start justify-center px-6 pb-24 pt-4 md:pt-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-ink-200/60 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-between px-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500 md:px-10">
          <span>© {new Date().getFullYear()} Glimmora</span>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">Secure checkout · Razorpay</span>
            <Link href="mailto:hello@glimmora.ai" className="hover:text-ink-900">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
