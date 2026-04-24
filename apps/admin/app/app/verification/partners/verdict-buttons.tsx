"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approvePartner, rejectPartner, markPartnerInReview } from "../../actions";

export function VerdictButtons({
  partnerId,
  currentStatus,
}: {
  partnerId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = React.useTransition();
  const [showReject, setShowReject] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const approve = () => {
    startTransition(async () => {
      try {
        await approvePartner(partnerId);
        toast.success("Partner approved — listings unlocked.");
      } catch {
        toast.error("Couldn't approve. Please retry.");
      }
    });
  };

  const submitReject = () => {
    if (!reason.trim()) {
      toast.error("Enter a rejection reason.");
      return;
    }
    startTransition(async () => {
      try {
        await rejectPartner(partnerId, reason.trim());
        toast.success("Partner rejected — submitter will be notified.");
        setShowReject(false);
        setReason("");
      } catch {
        toast.error("Couldn't reject. Please retry.");
      }
    });
  };

  const review = () => {
    startTransition(async () => {
      try {
        await markPartnerInReview(partnerId);
        toast.success("Marked as in review.");
      } catch {
        toast.error("Couldn't update. Please retry.");
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 md:w-[220px] md:shrink-0">
      <button
        type="button"
        onClick={approve}
        disabled={pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-lagoon-600 px-4 text-[13px] font-semibold text-white hover:bg-lagoon-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
        Approve
      </button>

      {currentStatus !== "IN_REVIEW" ? (
        <button
          type="button"
          onClick={review}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] font-medium text-ink-800 hover:border-ink-400 disabled:opacity-60"
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          Mark in review
        </button>
      ) : null}

      {!showReject ? (
        <button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-danger-200 bg-danger-50 px-4 text-[13px] font-medium text-danger-700 hover:border-danger-400 disabled:opacity-60"
        >
          <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
          Reject
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-danger-200 bg-danger-50/70 p-3">
          <label className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-danger-700 font-semibold">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. VAT certificate missing"
            rows={2}
            className="rounded-lg border border-danger-200 bg-white px-3 py-2 text-[12.5px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-danger-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitReject}
              disabled={pending}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-danger-600 px-3 text-[12.5px] font-semibold text-white hover:bg-danger-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Confirm reject
            </button>
            <button
              type="button"
              onClick={() => { setShowReject(false); setReason(""); }}
              disabled={pending}
              className="inline-flex h-9 items-center justify-center rounded-full border border-ink-200 bg-white px-3 text-[12.5px] font-medium text-ink-700 hover:border-ink-400 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
