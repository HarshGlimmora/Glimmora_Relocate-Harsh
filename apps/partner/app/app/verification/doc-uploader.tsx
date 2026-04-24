"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { uploadKybDoc, submitForReview } from "./actions";

export function DocUploader({
  kind,
  label,
  hint,
  uploaded,
}: {
  kind: string;
  label: string;
  hint: string;
  uploaded: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function mockUpload() {
    // In production the file goes to object storage and returns a URL.
    // For the demo we simulate an upload with a deterministic filename.
    const mockFileName = `${kind.toLowerCase().replace(/_/g, "-")}-${Date.now()}.pdf`;
    startTransition(async () => {
      const res = await uploadKybDoc({ kind, fileName: mockFileName });
      if (res.ok) {
        toast.success(`${label} submitted`, { description: "Added to the review queue." });
        router.refresh();
      } else toast.error("Upload failed", { description: res.error });
    });
  }

  if (uploaded) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
        <div>
          <p className="font-sans text-[13px] font-semibold text-success-800">{label}</p>
          <p className="mt-0.5 text-[11.5px] text-success-700">{hint}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-success-700 font-semibold">
          <Check className="h-3 w-3" strokeWidth={2.5} /> Uploaded
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3">
      <div>
        <p className="font-sans text-[13px] font-semibold text-ink-900">{label}</p>
        <p className="mt-0.5 text-[11.5px] text-ink-500">{hint}</p>
      </div>
      <button
        type="button"
        onClick={mockUpload}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-plum-300 bg-plum-50 px-3 text-[12px] font-medium text-plum-800 transition-colors hover:bg-plum-100 disabled:opacity-60"
      >
        {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</> : <><UploadCloud className="h-3.5 w-3.5" /> Upload</>}
      </button>
    </div>
  );
}

export function SubmitButton({ disabled, partnerName }: { disabled: boolean; partnerName: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function submit() {
    startTransition(async () => {
      const res = await submitForReview();
      if (res.ok) {
        toast.success(`${partnerName} is now under review`, {
          description: "Typical turnaround: 2–3 business days.",
        });
        router.refresh();
      } else toast.error("Not quite ready", { description: res.error });
    });
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={disabled || pending}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 text-[13.5px] font-semibold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> Submit for review</>}
    </button>
  );
}
