"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, X, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "./actions";

export function FeedbackForm({
  interviewId,
  candidateName,
  kindLabel,
  interviewer,
}: {
  interviewId: string;
  candidateName: string;
  kindLabel: string;
  interviewer: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [feedback, setFeedback] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setRating(0);
    setHover(0);
    setFeedback("");
    setOpen(false);
  }

  function save() {
    if (!rating || !feedback.trim()) {
      toast.error("Add both a rating and a comment", {
        description: "Your teammates rely on what you write here.",
      });
      return;
    }
    startTransition(async () => {
      const res = await submitFeedback({
        interviewId,
        rating,
        feedback: feedback.trim(),
      });
      if (res.ok) {
        toast.success(`Feedback saved for ${candidateName}`, {
          description: `${kindLabel} · ${rating}/5`,
        });
        reset();
        router.refresh();
      } else {
        toast.error("Could not save", { description: res.error });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-medium text-parchment hover:bg-ink-800 transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Submit feedback
      </button>
    );
  }

  const label = hover || rating
    ? ["", "Not a fit", "Weak", "Mixed", "Good", "Strong hire"][hover || rating]
    : "Pick a rating";

  return (
    <div className="relative z-10 mt-4 rounded-xl border border-gilt-300 bg-white p-4 md:p-5 w-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Scorecard</p>
          <p className="mt-0.5 font-sans text-[14.5px] font-semibold text-ink-900">
            {candidateName} · {kindLabel}
          </p>
          {interviewer ? (
            <p className="text-[11.5px] text-ink-500">From {interviewer}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 hover:bg-ink-900/5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= (hover || rating);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                disabled={pending}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 ${active ? "fill-gilt-500 text-gilt-500" : "text-ink-300"}`}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
          <span className="ml-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">
            {label}
          </span>
        </div>
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="What stood out? Strengths, gaps, risks, and your recommendation."
        rows={4}
        disabled={pending}
        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[13.5px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-lagoon-600 focus:ring-lagoon-600/15 resize-y"
      />

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11.5px] text-ink-500">
          Visible to your hiring team. The candidate never sees this.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="inline-flex h-9 items-center rounded-full px-4 text-[12.5px] font-medium text-ink-600 hover:bg-ink-900/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !rating || !feedback.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[12.5px] font-medium text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
            ) : (
              <><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Save scorecard</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
