import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-mono text-[10.5px] uppercase tracking-[0.12em] border",
  {
    variants: {
      variant: {
        default: "bg-ink-100 text-ink-600 border-ink-200",
        cognac: "bg-midnight-50 text-midnight-700 border-midnight-100",
        navy: "bg-midnight-50 text-midnight-600 border-midnight-100",
        aubergine: "bg-lagoon-50 text-lagoon-700 border-lagoon-100",
        moss: "bg-success-50 text-success-700 border-success-100",
        honey: "bg-warning-50 text-warning-700 border-warning-100",
        wine: "bg-danger-50 text-danger-700 border-danger-100",
        outline: "bg-transparent text-ink-600 border-ink-300",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-[1px] text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
