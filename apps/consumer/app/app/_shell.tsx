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
    <div className="relative flex min-h-screen bg-parchment">
      {/* Subtle travel-themed accent layer — soft dotted path arcing
          across the page, very low opacity so it never competes with
          content. Fixed, decorative, purely visual. */}
      <TravelAccentLayer />

      <aside className="relative z-10 sticky top-0 hidden h-screen w-[244px] shrink-0 border-r border-ink-200/50 bg-sand lg:block">
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

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>

      <Toaster
        position="top-right"
        offset={16}
        toastOptions={{
          className: "!rounded-xl !border-ink-200 !bg-white !text-ink-900 !font-sans !shadow-[0_12px_40px_-12px_rgba(40,25,12,0.25)]",
          style: { fontFamily: "var(--font-sans)" },
        }}
      />
    </div>
  );
}

/**
 * Decorative travel-themed accent — a faint dotted path arcing from
 * top-right toward bottom-left with three location pins along the way.
 * Pure inline SVG, fixed-positioned, low opacity. No interactivity.
 */
function TravelAccentLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ opacity: 0.07 }}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMaxYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        {/* Faint travel arc — dashed line, caramel tone */}
        <path
          d="M 1320 80 Q 1100 240 980 380 T 600 620 Q 380 720 120 820"
          fill="none"
          stroke="#7B4719"
          strokeWidth="1.5"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
        {/* Pin markers along the arc */}
        {[
          { cx: 1180, cy: 200 },
          { cx: 870, cy: 460 },
          { cx: 460, cy: 690 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="6" fill="#7B4719" />
            <circle cx={p.cx} cy={p.cy} r="14" fill="none" stroke="#7B4719" strokeWidth="1" opacity="0.5" />
          </g>
        ))}
        {/* A faint compass / globe ring on the bottom-right */}
        <g transform="translate(1280 760)" opacity="0.45">
          <circle r="60" fill="none" stroke="#7B4719" strokeWidth="1" />
          <circle r="40" fill="none" stroke="#7B4719" strokeWidth="0.8" strokeDasharray="3 5" />
          <line x1="-65" y1="0" x2="65" y2="0" stroke="#7B4719" strokeWidth="0.6" />
          <line x1="0" y1="-65" x2="0" y2="65" stroke="#7B4719" strokeWidth="0.6" />
        </g>
      </svg>
    </div>
  );
}
