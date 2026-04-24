import Link from "next/link";
import { GlimmoraMark } from "@/components/shared/glimmora-mark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-parchment text-ink-900">
      <header className="sticky top-0 z-50 border-b border-ink-200/60 bg-parchment/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6 md:px-10">
          <Link href="/" aria-label="Glimmora home" className="flex items-center gap-2.5 shrink-0">
            <GlimmoraMark size={24} withWordmark={false} className="text-ink-900" />
            <span className="font-sans text-[15px] font-semibold tracking-tight">Glimmora</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            <Link href="/compare" className="text-[13.5px] text-ink-700 hover:text-ink-900">Compare countries</Link>
            <Link href="/salary" className="text-[13.5px] text-ink-700 hover:text-ink-900">Salary simulator</Link>
            <Link href="/guides" className="text-[13.5px] text-ink-700 hover:text-ink-900">Guides</Link>
            <Link href="/pricing" className="text-[13.5px] text-ink-700 hover:text-ink-900">Pricing</Link>
            <span className="h-4 w-px bg-ink-200" />
            <Link href="/for-employers" className="text-[13.5px] text-ink-700 hover:text-ink-900">For employers</Link>
            <Link href="/for-partners" className="text-[13.5px] text-ink-700 hover:text-ink-900">For partners</Link>
            <Link href="/for-companies" className="text-[13.5px] text-ink-700 hover:text-ink-900">For companies</Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/sign-in" className="text-[13.5px] text-ink-700 hover:text-ink-900">Sign in</Link>
            <Link
              href="/sign-up"
              className="btn-primary inline-flex h-9 items-center gap-1 rounded-full px-4 text-[13px] font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-ink-200/60 bg-parchment py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid gap-10 md:grid-cols-[1.5fr_2fr]">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <GlimmoraMark size={24} withWordmark={false} className="text-ink-900" />
                <span className="font-sans text-[15px] font-semibold tracking-tight">Glimmora</span>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink-600">
                The AI companion for moving your life across borders. Job, visa, housing, family, finance, culture — one plan, one platform.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">
                <span className="pulse-dot text-lagoon-500" /> All systems operational
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
              {([
                {
                  h: "Tools",
                  items: [["Compare countries", "/compare", "live"], ["Salary simulator", "/salary", "live"], ["Guides & blog", "/guides", "live"]],
                },
                {
                  h: "Audience",
                  items: [["For movers", "/sign-up", "live"], ["For employers", "/for-employers", "live"], ["For partners", "/for-partners", "live"], ["For companies", "/for-companies", "live"]],
                },
                {
                  h: "Company",
                  items: [["Pricing", "/pricing", "live"], ["About", null, "W5"], ["Contact", "mailto:hello@glimmora.ai", "live"], ["Careers", null, "W5"]],
                },
                {
                  h: "Legal",
                  items: [["Privacy", null, "W5"], ["Terms", null, "W5"], ["Cookies", null, "W5"], ["Security", null, "W5"]],
                },
              ] as { h: string; items: [string, string | null, string][] }[]).map((col) => (
                <div key={col.h}>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium">{col.h}</p>
                  <ul className="space-y-2.5 text-[13px] text-ink-700">
                    {col.items.map(([label, href, tag]) => (
                      <li key={label}>
                        {href ? (
                          <Link href={href} className="hover:text-ink-900">{label}</Link>
                        ) : (
                          <span
                            title={`${label} page ships with ${tag}.`}
                            className="inline-flex items-center gap-1.5 text-ink-500 cursor-not-allowed"
                          >
                            {label}
                            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink-500">{tag}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 flex items-center justify-between border-t border-ink-200/60 pt-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500">
            <span>© {new Date().getFullYear()} Glimmora Relocate, Inc.</span>
            <span className="hidden md:block">Built with care for people who move.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
