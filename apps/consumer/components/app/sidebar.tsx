"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { GlimmoraMark } from "@/components/shared/glimmora-mark";
import { navSections, navSectionsForIntent, accountNav, type NavSection } from "@/lib/nav";
import type { WorkflowCompletion } from "@/lib/workflow";
import { cn } from "@/lib/utils";

export function AppSidebar({
  onNavigate,
  intentEmphasis,
  intentLabel,
  completion,
}: {
  onNavigate?: () => void;
  intentEmphasis?: readonly string[] | null;
  intentLabel?: string | null;
  completion?: WorkflowCompletion;
}) {
  const pathname = usePathname();
  const sections: NavSection[] = intentEmphasis
    ? navSectionsForIntent(intentEmphasis)
    : navSections;

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
          className="flex items-center"
        >
          <GlimmoraMark height={36} className="text-ink-900" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {intentLabel ? (
          <div className="mb-4 rounded-xl border border-ink-200 bg-white px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-500">
              Your goal
            </p>
            <p className="mt-1 text-[12px] font-medium text-ink-900">{intentLabel}</p>
          </div>
        ) : null}
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400 font-medium">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const isCompleted =
                  !!item.stepId &&
                  item.stepId !== "dashboard" &&
                  !!completion?.[item.stepId];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
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
                      {isCompleted ? (
                        <span
                          aria-label="completed"
                          title="Completed"
                          className={cn(
                            "ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            active
                              ? "bg-parchment/15 text-parchment"
                              : "bg-success-100 text-success-700"
                          )}
                        >
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      ) : null}
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
