import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-sm font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-ink-900 text-parchment shadow-elev-sm hover:bg-ink-800 active:bg-ink-900",
        secondary:
          "bg-white text-ink-900 shadow-elev-sm ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300 active:bg-ink-100",
        ghost: "text-ink-900 hover:bg-ink-100 active:bg-ink-100",
        outline:
          "border border-ink-300 bg-transparent text-ink-900 hover:bg-ink-100/60 active:bg-ink-100",
        destructive:
          "bg-danger-500 text-white shadow-elev-sm hover:bg-danger-600 active:bg-danger-700",
        link: "text-ink-900 underline-offset-4 hover:text-ink-700 hover:underline p-0 h-auto",
        subtle:
          "bg-ink-100 text-ink-900 hover:bg-ink-100 active:bg-ink-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
