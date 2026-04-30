"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, User, Users, GraduationCap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const audienceLinks: { href: string; label: string; tag: string; Icon: LucideIcon }[] = [
  { href: "/for-individuals", label: "For individuals", tag: "Job offer in hand", Icon: User },
  { href: "/for-families",    label: "For families",    tag: "Whole household",   Icon: Users },
  { href: "/for-students",    label: "For students",    tag: "Admitted to study", Icon: GraduationCap },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // close on escape
  React.useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  // close when route changes
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const audienceActive = audienceLinks.some((l) => pathname === l.href);

  return (
    <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
      {/* For dropdown */}
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            "inline-flex items-center gap-1.5 text-[13.5px] transition-colors",
            audienceActive ? "text-ink-900" : "text-ink-700 hover:text-ink-900"
          )}
        >
          For
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-180" : "")}
            strokeWidth={2}
          />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[320px] -translate-x-1/2 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_24px_60px_-20px_rgba(14,18,28,0.25)]"
          >
            <ul className="p-1.5">
              {audienceLinks.map((l) => {
                const Icon = l.Icon;
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      role="menuitem"
                      className={cn(
                        "group flex items-start gap-3 rounded-xl p-3 transition-colors",
                        active ? "bg-ink-50" : "hover:bg-ink-50"
                      )}
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-parchment">
                        <Icon className="h-[16px] w-[16px] text-ink-700" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-[13.5px] font-semibold tracking-tight text-ink-900">
                          {l.label}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                          {l.tag}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <Link href="/compare" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Compare countries
      </Link>
      <Link href="/salary" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Salary simulator
      </Link>
      <Link href="/guides" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Guides
      </Link>
      <Link href="/pricing" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Pricing
      </Link>

      <span className="h-4 w-px bg-ink-200" />

      <Link href="/for-employers" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Employers
      </Link>
      <Link href="/for-partners" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Partners
      </Link>
      <Link href="/for-companies" className="text-[13.5px] text-ink-700 hover:text-ink-900">
        Companies
      </Link>
    </nav>
  );
}
