import * as React from "react";
import { cn } from "@/lib/utils";

export function GlimmoraMark({
  className,
  size = 26,
  withWordmark = true,
  subMark = "for employers",
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  subMark?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Glimmora">
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <path d="M16 3L18 14L29 16L18 18L16 29L14 18L3 16L14 14L16 3Z" fill="currentColor" fillOpacity="0.92" />
      </svg>
      {withWordmark ? (
        <span className="flex items-baseline gap-1.5">
          <span className="font-sans text-[15px] font-semibold tracking-tight">Glimmora</span>
          {subMark ? (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-lagoon-700 font-medium">
              {subMark}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
