"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, User as UserIcon, Settings, CreditCard, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { signOutAction } from "@/app/(public)/actions";
import { flattenNav } from "@/lib/nav";

interface TopbarProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  onMenuClick?: () => void;
}

export function AppTopbar({ user, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const nav = flattenNav();
  const current = nav.find((n) =>
    n.href === "/app" ? pathname === "/app" : pathname === n.href || pathname.startsWith(n.href + "/"),
  );

  const [signingOut, startSignOut] = React.useTransition();
  function handleSignOut() {
    startSignOut(async () => {
      await signOutAction();
    });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-ink-200/60 bg-[#F6F1E4]/85 px-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] backdrop-blur-md md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-900/5 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="hidden items-center gap-2.5 md:flex">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">
          {current?.label ?? "Dashboard"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/app/messages"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-900/5"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gilt-500" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-full border border-ink-200 bg-white pl-1 pr-3 transition-colors hover:border-ink-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
                {initials(user.name ?? user.email)}
              </span>
              <span className="hidden text-[13px] font-medium text-ink-800 md:block">
                {user.name ? user.name.split(" ")[0] : user.email.split("@")[0]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-[14px] font-semibold text-parchment">
                {initials(user.name ?? user.email)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink-900">
                  {user.name ?? "Member"}
                </p>
                <p className="truncate text-[11px] text-ink-500">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/app/profile">
                <UserIcon className="h-4 w-4" />
                Profile &amp; Twin
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/billing">
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/messages">
                <Sparkles className="h-4 w-4" />
                Ask the Copilot
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={handleSignOut} disabled={signingOut}>
              <LogOut className="h-4 w-4" />
              {signingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
