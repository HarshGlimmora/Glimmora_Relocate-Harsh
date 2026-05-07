"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AppSidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { WorkflowCompletion } from "@/lib/workflow";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completion?: WorkflowCompletion;
}

export function MobileSidebar({ open, onOpenChange, completion }: MobileSidebarProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-parchment shadow-elev-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-3 top-3 rounded-md p-1.5 text-ink-500 hover:bg-ink-100"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
          <AppSidebar onNavigate={() => onOpenChange(false)} completion={completion} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
