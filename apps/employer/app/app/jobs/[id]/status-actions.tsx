"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setJobStatus } from "../actions";

export function StatusActions({ jobId, status, title }: { jobId: string; status: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run(next: "ACTIVE" | "CLOSED") {
    startTransition(async () => {
      const res = await setJobStatus(jobId, next);
      if (res.ok) {
        router.refresh();
        toast.success(
          next === "CLOSED" ? `"${title}" closed` : `"${title}" reopened`,
          {
            description: next === "CLOSED"
              ? "New applications are paused. You can reopen anytime."
              : "Candidates can apply again from today.",
            duration: 4500,
          }
        );
      } else {
        toast.error("Something went wrong", { description: res.error });
      }
    });
  }

  const isClosed = status === "CLOSED";

  if (isClosed) {
    return (
      <button
        type="button"
        onClick={() => run("ACTIVE")}
        disabled={pending}
        className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink-900 px-4 text-[13px] font-medium text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
        {pending ? "Reopening…" : "Reopen role"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => run("CLOSED")}
      disabled={pending}
      className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] font-medium text-ink-800 transition-colors hover:border-danger-300 hover:text-danger-700 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
      {pending ? "Closing…" : "Close role"}
    </button>
  );
}
