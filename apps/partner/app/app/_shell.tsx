"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import {
  LayoutDashboard, ShieldCheck, PackageSearch, MessageSquare, CalendarClock,
  Star, Wallet, Users, Settings, LogOut, CheckCircle2, AlertCircle,
} from "lucide-react";
import { signOutAction } from "../(public)/actions";
import { initials, cn } from "@/lib/utils";

const nav = [
  { group: "Operations", items: [
    { href: "/app",                 label: "Dashboard",    Icon: LayoutDashboard },
    { href: "/app/verification",    label: "Verification", Icon: ShieldCheck     },
    { href: "/app/listings",        label: "Listings",     Icon: PackageSearch   },
    { href: "/app/bookings",        label: "Bookings",     Icon: CalendarClock   },
    { href: "/app/messages",        label: "Messages",     Icon: MessageSquare   },
  ]},
  { group: "Growth", items: [
    { href: "/app/reviews",         label: "SLAs · Reviews", Icon: Star          },
    { href: "/app/payouts",         label: "Payouts",        Icon: Wallet        },
  ]},
  { group: "Company", items: [
    { href: "/app/team",            label: "Team",           Icon: Users         },
    { href: "/app/settings",        label: "Settings",       Icon: Settings      },
  ]},
];

export function AppShell({
  user, partner, children,
}: {
  user: { name: string | null; email: string; title: string | null };
  partner: { id: string; name: string; slug: string; category: string; verificationStatus: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [signingOut, startSignOut] = React.useTransition();

  const verified = partner.verificationStatus === "APPROVED";
  const verifyState = {
    APPROVED:  { Icon: CheckCircle2, label: "Verified",   cls: "text-success-700 bg-success-50 border-success-200" },
    IN_REVIEW: { Icon: AlertCircle,  label: "In review",  cls: "text-gilt-800 bg-gilt-50 border-gilt-200"           },
    PENDING:   { Icon: AlertCircle,  label: "Not started",cls: "text-ink-600 bg-ink-50 border-ink-200"              },
    REJECTED:  { Icon: AlertCircle,  label: "Rejected",   cls: "text-danger-700 bg-danger-50 border-danger-200"     },
  }[partner.verificationStatus] ?? { Icon: AlertCircle, label: partner.verificationStatus, cls: "text-ink-600 bg-ink-50 border-ink-200" };
  const VIcon = verifyState.Icon;

  return (
    <div className="flex min-h-screen bg-parchment">
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 border-r border-ink-200/60 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-ink-200/60">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-plum-600 text-white font-semibold text-[12px]">G</div>
            <div className="min-w-0">
              <p className="font-sans text-[13.5px] font-semibold text-ink-900 leading-none">Glimmora</p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-plum-700">for partners</p>
            </div>
          </div>

          <div className="border-b border-ink-200/60 px-4 py-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Workspace</p>
            <p className="mt-1 truncate font-sans text-[13.5px] font-semibold text-ink-900">{partner.name}</p>
            <p className={cn("mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium", verifyState.cls)}>
              <VIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
              {verifyState.label}
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-5">
            {nav.map((group) => (
              <div key={group.group}>
                <p className="mb-1.5 px-3 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{group.group}</p>
                <ul className="space-y-0.5">
                  {group.items.map(({ href, label, Icon }) => {
                    const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                            active
                              ? "bg-ink-900 text-parchment"
                              : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900"
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-ink-200/60 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-plum-600 text-white text-[12px] font-semibold">
                {initials(user.name ?? user.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-900">{user.name ?? "Team"}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{user.title ?? user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => startSignOut(async () => { await signOutAction(); })}
                disabled={signingOut}
                aria-label="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-900/5 hover:text-ink-900 transition-colors disabled:opacity-60"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200/60 bg-parchment/85 px-6 backdrop-blur-md">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">{partner.category.toLowerCase()} · {partner.slug}.glimmora.partners</p>
          <div className="flex items-center gap-3">
            {!verified ? (
              <Link
                href="/app/verification"
                className="inline-flex items-center gap-1.5 rounded-full bg-gilt-500 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-900 font-semibold hover:bg-gilt-400"
              >
                Complete verification →
              </Link>
            ) : null}
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>

      <Toaster
        position="top-right"
        offset={16}
        toastOptions={{
          className: "!rounded-xl !border-ink-200 !bg-white !text-ink-900 !font-sans !shadow-[0_12px_40px_-12px_rgba(14,18,28,0.25)]",
          style: { fontFamily: "var(--font-sans)" },
        }}
      />
    </div>
  );
}
