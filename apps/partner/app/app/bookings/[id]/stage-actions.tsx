"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight, Loader2, CheckCircle2, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { setBookingStatus } from "../actions";

type Which = "CONFIRMED" | "DECLINED" | "IN_PROGRESS" | "FULFILLED" | "CANCELLED";

export function StageActions({
  bookingId,
  status,
  customerName,
}: {
  bookingId: string;
  status: string;
  customerName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [which, setWhich] = React.useState<Which | null>(null);

  function run(next: Which) {
    setWhich(next);
    startTransition(async () => {
      const res = await setBookingStatus(bookingId, next);
      if (res.ok) {
        const msg: Record<Which, { title: string; desc: string }> = {
          CONFIRMED:   { title: `Confirmed with ${customerName}`, desc: "Escrow stays held until fulfilment." },
          DECLINED:    { title: "Booking declined",              desc: "The customer gets an automatic refund." },
          IN_PROGRESS: { title: "Marked in progress",            desc: "Customer sees the update in their plan." },
          FULFILLED:   { title: "Marked fulfilled",              desc: "Escrow released to your payout queue." },
          CANCELLED:   { title: "Booking cancelled",             desc: "Funds return to the customer." },
        };
        toast.success(msg[next].title, { description: msg[next].desc });
        router.refresh();
      } else {
        toast.error("Could not update", { description: res.error });
      }
      setWhich(null);
    });
  }

  const show = (s: Which) => which === s && pending;

  if (status === "REQUESTED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={() => run("CONFIRMED")} disabled={pending} tone="primary">
          {show("CONFIRMED") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />} Confirm
        </Btn>
        <Btn onClick={() => run("DECLINED")} disabled={pending} tone="danger">
          {show("DECLINED") ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Decline
        </Btn>
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={() => run("IN_PROGRESS")} disabled={pending} tone="primary">
          {show("IN_PROGRESS") ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Mark in progress
        </Btn>
        <Btn onClick={() => run("FULFILLED")} disabled={pending} tone="lagoon">
          {show("FULFILLED") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark fulfilled
        </Btn>
        <Btn onClick={() => run("CANCELLED")} disabled={pending} tone="ghost">
          {show("CANCELLED") ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />} Cancel
        </Btn>
      </div>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={() => run("FULFILLED")} disabled={pending} tone="lagoon">
          {show("FULFILLED") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark fulfilled
        </Btn>
        <Btn onClick={() => run("CANCELLED")} disabled={pending} tone="ghost">
          {show("CANCELLED") ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />} Cancel
        </Btn>
      </div>
    );
  }

  return null;
}

function Btn({
  children, onClick, disabled, tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone: "primary" | "lagoon" | "danger" | "ghost";
}) {
  const cls =
    tone === "primary" ? "bg-plum-600 text-white hover:bg-plum-700" :
    tone === "lagoon"  ? "bg-lagoon-500 text-white hover:bg-lagoon-600" :
    tone === "danger"  ? "border border-ink-200 bg-white text-ink-800 hover:border-danger-300 hover:text-danger-700" :
    "border border-ink-200 bg-white text-ink-700 hover:border-ink-900";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-medium transition-colors disabled:opacity-60 disabled:cursor-wait ${cls}`}
    >
      {children}
    </button>
  );
}
