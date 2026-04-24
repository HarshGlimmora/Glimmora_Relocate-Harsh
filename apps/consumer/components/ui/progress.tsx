import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0–100
  tone?: "cognac" | "moss" | "honey" | "wine";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, tone = "cognac", ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    const toneClass =
      tone === "cognac"
        ? "bg-midnight-500"
        : tone === "moss"
        ? "bg-success-500"
        : tone === "honey"
        ? "bg-warning-500"
        : "bg-danger-500";

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-1.5 w-full overflow-hidden rounded-full bg-ink-100",
          className,
        )}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all", toneClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
