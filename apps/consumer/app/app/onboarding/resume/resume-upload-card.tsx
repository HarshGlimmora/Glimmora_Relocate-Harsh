"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { applyResumeAction, uploadResumeAction } from "./actions";

type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "uploaded"; parseId: string; status: string }
  | { kind: "applying" }
  | { kind: "applied"; appliedKeys: string[]; profileCompletion: number }
  | { kind: "error"; message: string };

export function ResumeUploadCard() {
  const router = useRouter();
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileRef.current?.files?.[0]) {
      setState({ kind: "error", message: "Pick a file first." });
      return;
    }
    setState({ kind: "uploading" });
    const fd = new FormData();
    fd.set("file", fileRef.current.files[0]);
    const r = await uploadResumeAction(fd);
    if (!r.ok) return setState({ kind: "error", message: r.error });
    setState({ kind: "uploaded", parseId: r.parseId, status: r.status });
  }

  async function onApply(parseId: string) {
    setState({ kind: "applying" });
    const r = await applyResumeAction(parseId);
    if (!r.ok) return setState({ kind: "error", message: r.error });
    setState({
      kind: "applied",
      appliedKeys: r.appliedKeys,
      profileCompletion: r.profileCompletion,
    });
    setTimeout(() => router.push("/app/onboarding/profile"), 600);
  }

  function onSkip() {
    router.push("/app/onboarding/profile");
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <form onSubmit={onUpload} className="space-y-4">
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="block w-full text-[13.5px] file:mr-4 file:rounded-full file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-parchment hover:file:bg-ink-800"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={state.kind === "uploading"}
            className="rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-parchment hover:bg-ink-800 disabled:opacity-50"
          >
            {state.kind === "uploading" ? "Uploading…" : "Upload + parse"}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
          >
            Skip — fill manually
          </button>
        </div>
      </form>

      {state.kind === "error" ? (
        <div className="mt-4 rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">
          {state.message}
        </div>
      ) : null}

      {state.kind === "uploaded" && state.status === "ready" ? (
        <div className="mt-5 rounded-xl border border-ink-200 bg-parchment/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Parsed
          </p>
          <p className="mt-2 text-[13.5px] text-ink-800">
            Resume extracted. Apply it to your profile to pre-fill the next step.
          </p>
          <button
            onClick={() => onApply(state.parseId)}
            className="mt-3 rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-parchment hover:bg-ink-800"
          >
            Apply to my profile →
          </button>
        </div>
      ) : null}

      {state.kind === "uploaded" && state.status !== "ready" ? (
        <div className="mt-5 rounded-xl border border-danger-200 bg-danger-50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger-700">
            Couldn’t parse this file
          </p>
          <p className="mt-2 text-[13.5px] text-danger-800">
            The extractor couldn’t pull structured data from this resume. Try a different
            file (clean PDF or DOCX), or skip and fill the next step manually.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-parchment hover:bg-ink-800"
            >
              Try another file
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
            >
              Skip — fill manually
            </button>
          </div>
        </div>
      ) : null}

      {state.kind === "applying" ? (
        <p className="mt-4 text-[13px] text-ink-600">Applying…</p>
      ) : null}

      {state.kind === "applied" ? (
        <p className="mt-4 text-[13px] text-success-700">
          Profile is {state.profileCompletion}% complete. Redirecting…
        </p>
      ) : null}
    </div>
  );
}
