import * as React from "react";
import { cn } from "@/lib/utils";

interface GlimmoraMarkProps {
  className?: string;
  size?: number;
  withWordmark?: boolean;
}

export function GlimmoraMark({
  className,
  size = 28,
  withWordmark = true,
}: GlimmoraMarkProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Glimmora"
      >
        <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <path
          d="M16 3L18 14L29 16L18 18L16 29L14 18L3 16L14 14L16 3Z"
          fill="currentColor"
          fillOpacity="0.92"
        />
        <circle cx="16" cy="16" r="2.2" fill="currentColor" fillOpacity="1" style={{ filter: "invert(1)" }} />
      </svg>
      {withWordmark ? (
        <span className="font-display text-[19px] font-medium leading-none tracking-tight">
          Glimmora<span className="text-gilt-500">.</span>
        </span>
      ) : null}
    </div>
  );
}
