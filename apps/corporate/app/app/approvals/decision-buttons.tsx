"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { decideApproval } from "./actions";

export function DecisionButtons({ approvalId, employeeName }: { approvalId: string; employeeName: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [which, setWhich] = React.useState<"APPROVED" | "DECLINED" | null>(null);

  function run(decision: "APPROVED" | "DECLINED") {
    setWhich(decision);
    startTransition(async () => {
      const res = await decideApproval({ approvalId, decision });
      if (res.ok) {
        toast.success(decision === "APPROVED" ? `Override approved for ${employeeName}` : `Request declined`, {
          description: decision === "APPROVED"
            ? "Budget cap updated on the active case. Employee will see the new envelope."
            : "Manager will be notified.",
        });
        router.refresh();
      } else {
        toast.error("Could not record decision", { description: res.error });
      }
      setWhich(null);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => run("APPROVED")}
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-moss-600 px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-moss-700 disabled:opacity-60 disabled:cursor-wait"
      >
        {pending && which === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
        Approve
      </button>
      <button
        type="button"
        onClick={() => run("DECLINED")}
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-800 transition-colors hover:border-danger-300 hover:text-danger-700 disabled:opacity-60"
      >
        {pending && which === "DECLINED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Decline
      </button>
    </div>
  );
}
