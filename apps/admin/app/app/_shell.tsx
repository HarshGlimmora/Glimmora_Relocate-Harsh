"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Briefcase, Plane, LogOut, Shield,
  ShieldCheck, BadgeCheck, AlertTriangle, Scale,
  Globe2, Sparkles, Headphones, BookUser,
  Wallet, Banknote, SlidersHorizontal, LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOutAction } from "../(public)/actions";

type NavItem = { href: string; label: string; Icon: LucideIcon };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/app",              label: "Dashboard",   Icon: LayoutDashboard },
      { href: "/app/hires",        label: "Hires",       Icon: Briefcase       },
      { href: "/app/companies",    label: "Companies",   Icon: Building2       },
      { href: "/app/relocations",  label: "Relocations", Icon: Plane           },
    ],
  },
  {
    title: "Verification & Trust",
    items: [
      { href: "/app/verification/partners",  label: "Partner KYB",       Icon: ShieldCheck   },
      { href: "/app/verification/employers", label: "Employer verify",   Icon: BadgeCheck    },
      { href: "/app/trust",                  label: "Trust & fraud",     Icon: AlertTriangle },
      { href: "/app/disputes",               label: "Disputes",          Icon: Scale         },
    ],
  },
  {
    title: "Knowledge & Support",
    items: [
      { href: "/app/kg",         label: "Country KG",     Icon: Globe2     },
      { href: "/app/ai-updates", label: "AI updates",     Icon: Sparkles   },
      { href: "/app/support",    label: "Users & support",Icon: Headphones },
      { href: "/app/corporate",  label: "Corporate",      Icon: BookUser   },
    ],
  },
  {
    title: "Finance & Config",
    items: [
      { href: "/app/escrow",   label: "Escrow & refunds", Icon: Wallet              },
      { href: "/app/payouts",  label: "Partner payouts",  Icon: Banknote            },
      { href: "/app/flags",    label: "Feature flags",    Icon: SlidersHorizontal   },
      { href: "/app/audit",    label: "Analytics & audit",Icon: LineChart           },
    ],
  },
];

function initials(s?: string | null) {
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || first.toUpperCase();
}

export function OpsShell({
  user, children,
}: {
  user: { name: string | null; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-parchment">
      <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 border-r border-ink-200/60 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-ink-200/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-parchment font-semibold text-[12px]">G</div>
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink-900 leading-none">Glimmora</p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500">Ops console</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-5">
              {navGroups.map((group) => (
                <li key={group.title}>
                  <p className="px-3 mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-400 font-semibold">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map(({ href, label, Icon }) => {
                      const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-[7px] text-[13px] transition-colors ${
                              active
                                ? "bg-ink-900 text-parchment"
                                : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900"
                            }`}
                          >
                            <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-ink-200/60 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
                {initials(user.name ?? user.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-900">{user.name ?? "Staff"}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                  <Shield className="h-2.5 w-2.5" /> {user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOutAction()}
                aria-label="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-900/5 hover:text-ink-900 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200/60 bg-parchment/85 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success-500" />
            Live platform view
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-600">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gilt-500" />
              Staging
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
