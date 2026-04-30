"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { BackendProfile } from "@/lib/backend/types";
import { applyResumeAction, uploadResumeAction } from "./actions";

type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "uploaded"; parseId: string; status: string; extracted: BackendProfile | null }
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
    setState({
      kind: "uploaded",
      parseId: r.parseId,
      status: r.status,
      extracted: r.extracted,
    });
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
        <div className="mt-5 rounded-xl border border-ink-200 bg-parchment/40 p-4" data-resume-preview>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Parsed — does this look right?
          </p>
          {state.extracted ? (
            <ExtractedPreview profile={state.extracted} />
          ) : (
            <p className="mt-2 text-[13.5px] text-ink-800">
              Resume extracted. Apply it to your profile to pre-fill the next step.
            </p>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => onApply(state.parseId)}
              className="rounded-full bg-ink-900 px-4 py-2 text-[13px] font-medium text-parchment hover:bg-ink-800"
            >
              Looks right · Apply to my profile →
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
            >
              Try another file
            </button>
          </div>
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

function ExtractedPreview({ profile }: { profile: BackendProfile }) {
  const items: { k: string; v: string | null }[] = [
    { k: "Name", v: profile.full_name ?? null },
    { k: "Current role", v: profile.current_role ?? null },
    { k: "Industry", v: profile.industry ?? null },
    { k: "Seniority", v: profile.seniority ?? null },
    {
      k: "Years experience",
      v: profile.years_experience != null ? String(profile.years_experience) : null,
    },
    {
      k: "Skills",
      v: profile.skills?.length
        ? profile.skills
            .slice(0, 8)
            .map((s) => s.name)
            .join(", ") + (profile.skills.length > 8 ? "…" : "")
        : null,
    },
    {
      k: "Companies",
      v: profile.companies?.length ? profile.companies.slice(0, 4).join(", ") : null,
    },
  ];
  const filled = items.filter((it) => it.v && it.v.trim().length > 0);
  const missing = items.filter((it) => !it.v || it.v.trim().length === 0);
  return (
    <div className="mt-2 grid gap-3 md:grid-cols-2" data-resume-extracted>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-success-700">
          We pulled
        </p>
        <ul className="mt-1.5 space-y-1 text-[12.5px]">
          {filled.length === 0 ? (
            <li className="text-ink-500">Nothing structured. You'll fill the next step manually.</li>
          ) : (
            filled.map((it) => (
              <li key={it.k}>
                <span className="text-ink-500">{it.k}:</span>{" "}
                <span className="font-medium text-ink-900">{it.v}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-700">
          Still need from you
        </p>
        <ul className="mt-1.5 space-y-1 text-[12.5px]">
          {missing.length === 0 ? (
            <li className="text-ink-500">Nothing — you can keep going.</li>
          ) : (
            missing.map((it) => (
              <li key={it.k} className="text-ink-700">
                · {it.k}
              </li>
            ))
          )}
          <li className="text-ink-700">· Target country (always required)</li>
        </ul>
      </div>
    </div>
  );
}
