"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Send, X } from "lucide-react";
import { toast } from "sonner";
import { bookListingAction } from "./actions";

export function BookButton({
  listingId,
  amount,
  currency,
  title,
  partnerName,
  alreadyBooked,
}: {
  listingId: string;
  amount: number;
  currency: string;
  title: string;
  partnerName: string;
  alreadyBooked: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (alreadyBooked) {
    return (
      <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-lagoon-50 border border-lagoon-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800 font-semibold">
        <Check className="h-3 w-3" strokeWidth={2.5} /> Requested
      </span>
    );
  }

  function submit() {
    startTransition(async () => {
      const res = await bookListingAction({
        listingId,
        amount,
        currency,
        note: note.trim() || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
      });
      if (res.ok) {
        toast.success(`Requested "${title}"`, {
          description: `${partnerName} will confirm within 24 hours. Funds sit in escrow until fulfilment.`,
        });
        setOpen(false);
        setNote("");
        setStartDate("");
        router.refresh();
      } else {
        toast.error("Could not book", { description: res.error });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-medium text-parchment transition-colors hover:bg-ink-800"
      >
        Request booking
      </button>
    );
  }

  return (
    <div className="relative z-10 mt-3 w-full rounded-2xl border border-ink-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Booking request</p>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-900" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Preferred start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={pending}
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 shadow-sm focus:outline-none focus:ring-4 focus:border-ink-900 focus:ring-ink-900/15"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Message to {partnerName}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Arrival date, household size, special requirements…"
            rows={3}
            disabled={pending}
            className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 shadow-sm focus:outline-none focus:ring-4 focus:border-ink-900 focus:ring-ink-900/15 resize-y"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
        <p className="text-[11.5px] text-ink-500">Funds held in escrow until fulfilment.</p>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-medium text-parchment hover:bg-ink-800 disabled:opacity-60 disabled:cursor-wait"
        >
          {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send request</>}
        </button>
      </div>
    </div>
  );
}
