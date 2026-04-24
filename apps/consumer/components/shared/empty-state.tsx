import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-white/50 px-8 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-midnight-50 text-midnight-600">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-xl font-medium text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
