"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send, X, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { updateOfferStatus } from "./actions";

export function SendOfferButton({ offerId, candidateName }: { offerId: string; candidateName: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  function run() {
    startTransition(async () => {
      const res = await updateOfferStatus(offerId, "SENT");
      if (res.ok) {
        router.refresh();
        toast.success(`Offer sent to ${candidateName}`, {
          description: "They'll get an email with the signed letter.",
        });
      } else {
        toast.error("Could not send", { description: res.error });
      }
    });
  }
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-medium text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {pending ? "Sending…" : "Send offer"}
    </button>
  );
}

export function RespondButtons({ offerId, candidateName }: { offerId: string; candidateName: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [which, setWhich] = React.useState<string | null>(null);

  function run(next: "ACCEPTED" | "DECLINED" | "WITHDRAWN") {
    setWhich(next);
    startTransition(async () => {
      const res = await updateOfferStatus(offerId, next);
      if (res.ok) {
        router.refresh();
        if (next === "ACCEPTED") {
          toast.success(`${candidateName} accepted`, {
            description: "Candidate moved to Hired. Glimmora relocation plan kicked off.",
          });
        } else if (next === "DECLINED") {
          toast.success("Marked as declined", {
            description: `${candidateName}'s offer is closed.`,
          });
        } else {
          toast.success("Offer withdrawn", {
            description: `${candidateName} was notified.`,
          });
        }
      } else {
        toast.error("Could not update", { description: res.error });
      }
      setWhich(null);
    });
  }

  return (
    <div className="relative z-10 flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => run("ACCEPTED")}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lagoon-500 px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-lagoon-600 disabled:opacity-60"
      >
        {pending && which === "ACCEPTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
        Accepted
      </button>
      <button
        type="button"
        onClick={() => run("DECLINED")}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 text-[12.5px] font-medium text-ink-800 transition-colors hover:border-danger-300 hover:text-danger-700 disabled:opacity-60"
      >
        {pending && which === "DECLINED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Declined
      </button>
      <button
        type="button"
        onClick={() => run("WITHDRAWN")}
        disabled={pending}
        aria-label="Withdraw offer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-900 hover:text-ink-900 disabled:opacity-60"
      >
        {pending && which === "WITHDRAWN" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
