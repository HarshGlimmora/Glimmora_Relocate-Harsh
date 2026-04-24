import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b border-ink-200 pb-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mono-label mb-2.5 text-midnight-600">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-[40px] font-medium leading-[1.05] tracking-tight text-ink-900 text-balance md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-ink-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
