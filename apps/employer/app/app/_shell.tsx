"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app/sidebar";
import { AppTopbar } from "@/components/app/topbar";
import { MobileSidebar } from "@/components/app/mobile-sidebar";

export function AppShell({
  user, companyName, children,
}: {
  user: { name: string | null; email: string; title: string | null };
  companyName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-parchment">
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 border-r border-ink-200/60 lg:block">
        <AppSidebar companyName={companyName} />
      </aside>

      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} companyName={companyName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} onMenuClick={() => setMobileOpen(true)} />
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
