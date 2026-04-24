"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Archive, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveListingAction, restoreListingAction } from "./actions";

export function ListingRowActions({ id, status, title }: { id: string; status: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function archive() {
    startTransition(async () => {
      const res = await archiveListingAction(id);
      if (res.ok) {
        toast.success(`"${title}" archived`, { description: "No longer visible in the customer marketplace." });
        router.refresh();
      } else toast.error("Could not archive", { description: res.error });
    });
  }

  function restore() {
    startTransition(async () => {
      const res = await restoreListingAction(id);
      if (res.ok) {
        toast.success(`"${title}" restored to draft`);
        router.refresh();
      } else toast.error("Could not restore", { description: res.error });
    });
  }

  const archived = status === "ARCHIVED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Listing options"
          disabled={pending}
          className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/app/listings/${id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        {archived ? (
          <DropdownMenuItem onSelect={restore}>
            <RefreshCcw className="h-4 w-4" /> Restore to draft
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem destructive onSelect={archive}>
            <Archive className="h-4 w-4" /> Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
