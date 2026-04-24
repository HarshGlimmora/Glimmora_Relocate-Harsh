import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[92px] w-full rounded-md border border-ink-200 bg-white px-3.5 py-2.5 font-sans text-[15px] text-ink-900 shadow-elev-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:border-midnight-500 focus-visible:ring-2 focus-visible:ring-midnight-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
