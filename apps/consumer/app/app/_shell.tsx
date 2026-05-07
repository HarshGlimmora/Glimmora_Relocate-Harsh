"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app/sidebar";
import { AppTopbar } from "@/components/app/topbar";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import type { WorkflowCompletion } from "@/lib/workflow";

export function AppShell({
  user,
  children,
  intentEmphasis,
  intentLabel,
  completion,
}: {
  user: { name: string | null; email: string; image: string | null };
  children: React.ReactNode;
  intentEmphasis?: readonly string[] | null;
  intentLabel?: string | null;
  completion?: WorkflowCompletion;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-parchment">
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 border-r border-ink-200/60 lg:block">
        <AppSidebar
          intentEmphasis={intentEmphasis}
          intentLabel={intentLabel}
          completion={completion}
        />
      </aside>

      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        completion={completion}
      />

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
