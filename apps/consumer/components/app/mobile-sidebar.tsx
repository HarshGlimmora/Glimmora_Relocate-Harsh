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
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[linear-gradient(180deg,#F6F1E4_0%,#EEE6D2_100%)] shadow-[0_24px_48px_-12px_rgba(40,25,12,0.18),0_8px_16px_-6px_rgba(40,25,12,0.08),inset_0_1px_0_0_rgba(255,255,255,0.7),inset_-24px_0_48px_-24px_rgba(123,71,25,0.04)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-3 top-3 rounded-md p-1.5 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
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
