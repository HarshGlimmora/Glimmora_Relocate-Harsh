import Link from "next/link";
import { GlimmoraMark } from "@/components/shared/glimmora-mark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-parchment text-ink-900">
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6 md:px-10">
          <Link href="/" aria-label="Glimmora for Employers">
            <GlimmoraMark />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/#why" className="hidden text-[14px] text-ink-700 hover:text-ink-900 md:inline">Why Glimmora</Link>
            <Link href="/#pricing" className="hidden text-[14px] text-ink-700 hover:text-ink-900 md:inline">Pricing</Link>
            <Link href="/sign-in" className="text-[14px] text-ink-700 hover:text-ink-900">Sign in</Link>
            <Link href="/sign-up" className="btn-accent inline-flex h-9 items-center gap-1 rounded-full px-4 text-[13px] font-medium">Start hiring</Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-ink-200/60 bg-parchment py-14">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <GlimmoraMark />
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 flex gap-6">
            <span title="Privacy policy ships with W5." className="cursor-not-allowed">Privacy · W5</span>
            <span title="Terms ship with W5." className="cursor-not-allowed">Terms · W5</span>
            <Link href="mailto:employer-sales@glimmora.ai" className="hover:text-ink-900">Contact</Link>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">© {new Date().getFullYear()} Glimmora</span>
        </div>
      </footer>
    </div>
  );
}
