"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, Check, Send, X, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { bookListingAction } from "./actions";

interface BookButtonProps {
  listingId: string;
  amount: number;
  currency: string;
  title: string;
  partnerName: string;
  alreadyBooked: boolean;
}

function formatAmount(amount: number, currency: string) {
  if (!amount) return null;
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${amount.toLocaleString("en-GB")}`;
}

export function BookButton({
  listingId,
  amount,
  currency,
  title,
  partnerName,
  alreadyBooked,
}: BookButtonProps) {
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

  const priceLabel = formatAmount(amount, currency);
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="relative z-10 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-medium text-parchment transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-900/15"
        >
          Request booking
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-ink-900/70 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 px-4",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <div className="overflow-hidden rounded-[24px] border border-ink-200 bg-white shadow-[0_24px_60px_-20px_rgba(14,18,28,0.35)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-7 pb-5 pt-7">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                  Booking request
                </p>
                <DialogPrimitive.Title className="mt-2 font-sans text-[18px] font-semibold leading-[1.25] tracking-tight text-ink-900">
                  {title}
                </DialogPrimitive.Title>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  with {partnerName}
                  {priceLabel ? <> · <span className="font-medium text-ink-700">{priceLabel}</span></> : null}
                </p>
              </div>
              <DialogPrimitive.Close
                className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </DialogPrimitive.Close>
            </div>

            {/* Body */}
            <div className="space-y-5 px-7 py-6">
              <div className="space-y-1.5">
                <label htmlFor="bk-date" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                  Preferred start date
                </label>
                <input
                  id="bk-date"
                  type="date"
                  value={startDate}
                  min={todayIso}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={pending}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[14px] text-ink-900 shadow-sm focus:border-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-900/10"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="bk-note" className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                  Message to {partnerName} (optional)
                </label>
                <textarea
                  id="bk-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Arrival window, household size, any special requirements…"
                  rows={4}
                  disabled={pending}
                  className="w-full resize-y rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm focus:border-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-900/10"
                />
              </div>

              {/* Escrow disclosure */}
              <div className="rounded-xl border border-lagoon-100 bg-lagoon-50/60 px-4 py-3">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">
                  <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
                  Escrow protected
                </p>
                <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-700">
                  Funds are held by Glimmora until {partnerName} fulfils the booking. If anything goes wrong, the deposit is refunded.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-parchment/40 px-7 py-4">
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                <Lock className="h-3 w-3" strokeWidth={2.25} />
                No charge yet
              </p>
              <div className="ml-auto flex items-center gap-2">
                <DialogPrimitive.Close
                  className="inline-flex h-10 items-center whitespace-nowrap rounded-full border border-ink-200 bg-white px-4 text-[13px] font-medium text-ink-700 transition-colors hover:border-ink-400"
                  disabled={pending}
                >
                  Cancel
                </DialogPrimitive.Close>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-900 px-5 text-[13px] font-medium text-parchment transition-colors hover:bg-ink-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
