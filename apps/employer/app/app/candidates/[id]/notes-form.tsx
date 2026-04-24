"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { saveNote } from "../actions";

export function NotesForm({ applicationId, initialValue }: { applicationId: string; initialValue: string }) {
  const [value, setValue] = React.useState(initialValue);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dirty = value !== initialValue;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveNote(applicationId, value);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add notes visible to your hiring team — interview takeaways, references checked, follow-up reminders."
        rows={5}
        disabled={pending}
        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-lagoon-600 focus:ring-lagoon-600/15 resize-y"
      />

      <div className="flex items-center justify-between">
        <div className="text-[12px] text-ink-500">
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-lagoon-700">
              <Check className="h-3 w-3" strokeWidth={2.5} /> Saved
            </span>
          ) : error ? (
            <span className="text-danger-700">{error}</span>
          ) : dirty ? (
            <span>Unsaved changes</span>
          ) : (
            <span>Visible to your team only</span>
          )}
        </div>
        <button
          type="submit"
          disabled={pending || !dirty}
          className="btn-primary inline-flex h-10 items-center gap-2 rounded-full px-5 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save note"}
        </button>
      </div>
    </form>
  );
}
