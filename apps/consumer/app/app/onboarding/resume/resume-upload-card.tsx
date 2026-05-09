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
  const skills = profile.skills?.map((s) => s.name) ?? [];
  const certifications = profile.certifications ?? [];
  const languages = profile.languages_known ?? [];
  const companies = profile.companies ?? [];
  const education = (profile.education as Array<{ school?: string; degree?: string; field?: string }> | undefined) ?? [];

  // Track which top-level fields are missing → drives "We'll still ask"
  const missing: string[] = [];
  if (!profile.full_name) missing.push("Name");
  if (!profile.phone) missing.push("Phone");
  if (!profile.current_role) missing.push("Current role");
  if (!profile.current_employer) missing.push("Current employer");
  if (!profile.target_role) missing.push("Target role");
  if (!profile.industry) missing.push("Industry");
  if (!profile.seniority) missing.push("Seniority");
  if (profile.years_experience == null) missing.push("Years of experience");
  if (skills.length === 0) missing.push("Skills");
  if (certifications.length === 0) missing.push("Certifications");
  if (languages.length === 0) missing.push("Languages");
  if (education.length === 0) missing.push("Education");
  if (companies.length === 0) missing.push("Companies");

  // Strength signals — one card each, lit up when the data supports it
  const strengths: { label: string; lit: boolean; hint: string; icon: string }[] = [
    {
      label: "Technical depth",
      lit: skills.length >= 8,
      hint: skills.length >= 8 ? `${skills.length} skills detected` : "Few technical signals yet",
      icon: "🛠",
    },
    {
      label: "Domain experience",
      lit: !!profile.industry || (profile.years_experience ?? 0) >= 3,
      hint: profile.industry ? profile.industry : (profile.years_experience ?? 0) >= 3 ? "Solid years in role" : "Industry context light",
      icon: "🏛",
    },
    {
      label: "Credentials",
      lit: certifications.length > 0 || education.length > 0,
      hint: certifications.length > 0
        ? `${certifications.length} certification${certifications.length > 1 ? "s" : ""}`
        : education.length > 0
        ? `${education.length} education record${education.length > 1 ? "s" : ""}`
        : "No formal credentials parsed",
      icon: "🎓",
    },
    {
      label: "Multilingual",
      lit: languages.length >= 2,
      hint: languages.length >= 2 ? `${languages.length} languages` : languages.length === 1 ? "One language" : "No languages parsed",
      icon: "🗣",
    },
  ];

  const seniorityLabel =
    profile.seniority ??
    (profile.years_experience != null
      ? `${profile.years_experience} yr${profile.years_experience === 1 ? "" : "s"}`
      : "—");

  return (
    <div className="mt-2 space-y-4" data-resume-extracted>
      {/* ============ Resume summary card ============ */}
      <div
        data-resume-summary
        className="relative overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-parchment to-white p-5"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Resume summary · what we read off your CV
        </p>
        <p className="mt-2 font-sans text-[20px] font-semibold tracking-[-0.01em] text-ink-900">
          {profile.full_name ?? "Name not parsed"}
        </p>
        <p className="mt-1 text-[13px] text-ink-700">
          {profile.current_role ?? "Role not parsed"}
          {profile.current_employer ? <> · <span className="text-ink-600">{profile.current_employer}</span></> : null}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.target_role ? (
            <span className="rounded-full border border-lagoon-200 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-800">
              → {profile.target_role}
            </span>
          ) : null}
          {profile.industry ? (
            <span className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
              {profile.industry}
            </span>
          ) : null}
          <span className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
            {seniorityLabel}
          </span>
          {profile.phone ? (
            <span className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
              📞 {profile.phone}
            </span>
          ) : null}
        </div>
      </div>

      {/* ============ Strength indicators ============ */}
      <div data-resume-strengths>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Strength signals
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {strengths.map((s) => (
            <div
              key={s.label}
              data-strength={s.label}
              data-strength-lit={s.lit ? "true" : "false"}
              className={
                "rounded-2xl border p-3 transition-all " +
                (s.lit
                  ? "border-success-200 bg-success-50/50 hover:shadow-sm"
                  : "border-ink-200 bg-white opacity-70")
              }
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] " +
                    (s.lit ? "bg-success-100 text-success-700" : "bg-ink-50 text-ink-400")
                  }
                >
                  {s.icon}
                </span>
                <p className={"text-[12px] font-semibold " + (s.lit ? "text-ink-900" : "text-ink-500")}>
                  {s.label}
                </p>
              </div>
              <p className="mt-1.5 text-[10.5px] leading-[1.4] text-ink-600">{s.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ Skills grid ============ */}
      {skills.length > 0 ? (
        <div data-resume-skills className="rounded-2xl border border-ink-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Skills detected
            </p>
            <span className="font-mono text-[10.5px] tabular-nums text-ink-700">
              {skills.length} total
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {skills.slice(0, 24).map((s) => (
              <span
                key={s}
                data-skill={s}
                className="rounded-full border border-success-200 bg-success-50 px-2.5 py-0.5 font-mono text-[11px] text-success-800"
              >
                {s}
              </span>
            ))}
            {skills.length > 24 ? (
              <span className="rounded-full bg-ink-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                +{skills.length - 24} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ============ Companies + Education + Certifications + Languages ============ */}
      <div className="grid gap-3 md:grid-cols-2">
        {companies.length > 0 ? (
          <div data-resume-companies className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Experience · companies
            </p>
            <ul className="mt-2 space-y-1">
              {companies.slice(0, 6).map((c, i) => (
                <li key={c} className="flex items-center gap-2 text-[12.5px]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lagoon-100 font-mono text-[10px] font-semibold text-lagoon-800">
                    {i + 1}
                  </span>
                  <span className="text-ink-800">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {education.length > 0 ? (
          <div data-resume-education className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Education
            </p>
            <ul className="mt-2 space-y-1.5">
              {education.slice(0, 3).map((e, i) => (
                <li key={i} className="text-[12.5px]">
                  <p className="font-medium text-ink-900">{e.school ?? "—"}</p>
                  {e.degree || e.field ? (
                    <p className="text-[11.5px] text-ink-600">
                      {[e.degree, e.field].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {certifications.length > 0 ? (
          <div data-resume-certifications className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Certifications
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {certifications.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-gilt-200 bg-gilt-50 px-2.5 py-0.5 font-mono text-[11px] text-gilt-800"
                >
                  ✦ {c}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {languages.length > 0 ? (
          <div data-resume-languages className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
              Languages
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {languages.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-lagoon-200 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[11px] text-lagoon-800"
                >
                  🗣 {l}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ============ AI insights — what's still missing ============ */}
      <div
        data-resume-insights
        className="rounded-2xl border border-gilt-200 bg-gilt-50/60 p-4"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gilt-100 text-[14px] text-gilt-800"
          >
            ✦
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">
            AI insight · we&apos;ll still ask about
          </p>
        </div>
        {missing.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-ink-700">
            Your CV covered everything we expected. The next step asks only about the move itself.
          </p>
        ) : (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <span
                key={m}
                className="rounded-full border border-gilt-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-800"
              >
                {m}
              </span>
            ))}
            <span className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
              Destination country
            </span>
            <span className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700">
              Family + visa + budget
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
