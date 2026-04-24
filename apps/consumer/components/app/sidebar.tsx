"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlimmoraMark } from "@/components/shared/glimmora-mark";
import { navSections, accountNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col bg-parchment">
      {/* Brand */}
      <div className="flex h-20 shrink-0 items-center px-6">
        <Link
          href="/app"
          aria-label="Glimmora home"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <GlimmoraMark size={24} withWordmark={false} className="text-ink-900" />
          <span className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">
            Glimmora
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400 font-medium">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                        active
                          ? "bg-ink-900 text-parchment font-medium"
                          : "text-ink-700 hover:bg-ink-900/5"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[15px] w-[15px] shrink-0",
                          active ? "text-parchment" : "text-ink-500"
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account */}
      <div className="border-t border-ink-200/60 px-3 py-3">
        <ul className="space-y-0.5">
          {accountNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                    active
                      ? "bg-ink-900 text-parchment font-medium"
                      : "text-ink-700 hover:bg-ink-900/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[15px] w-[15px] shrink-0",
                      active ? "text-parchment" : "text-ink-500"
                    )}
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
