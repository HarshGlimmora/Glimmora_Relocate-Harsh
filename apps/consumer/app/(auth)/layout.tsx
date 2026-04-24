import Link from "next/link";
import { GlimmoraMark } from "@/components/shared/glimmora-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-parchment text-ink-900">
      {/* Soft ambient gradient — single, subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="orb h-[600px] w-[600px] bg-gilt-100 -top-32 -left-32" />
        <div className="orb h-[600px] w-[600px] bg-lagoon-100 -bottom-32 -right-32" />
      </div>

      {/* Minimal top bar */}
      <header className="relative z-10">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            aria-label="Glimmora home"
            className="flex items-center gap-2.5 rounded-full px-2 py-1 transition-colors hover:bg-ink-900/5"
          >
            <GlimmoraMark size={26} withWordmark={false} className="text-ink-900" />
            <span className="font-sans text-[16px] font-semibold tracking-tight text-ink-900">
              Glimmora
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-700 backdrop-blur-sm transition-all hover:border-ink-900/20 hover:bg-white"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] items-start justify-center px-6 pb-24 pt-4 md:items-center md:pt-0">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 border-t border-ink-200/60 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-between px-6 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500 md:px-10">
          <span>© {new Date().getFullYear()} Glimmora</span>
          <div className="flex items-center gap-6">
            <span title="Privacy policy ships with W5." className="cursor-not-allowed">Privacy · W5</span>
            <span title="Terms ship with W5." className="cursor-not-allowed">Terms · W5</span>
            <Link href="mailto:hello@glimmora.ai" className="hover:text-ink-900">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
