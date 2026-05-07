"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { BackendProfile } from "@/lib/backend/types";
import { saveProfileAction } from "./actions";

export function ProfileReviewForm({ initial }: { initial: BackendProfile }) {
  const router = useRouter();
  const [state, setState] = React.useState({
    full_name: initial.full_name ?? "",
    current_role: initial.current_role ?? "",
    industry: initial.industry ?? "",
    // Backend enum is lowercase; coerce whatever the resume parser stored
    // so a "Junior" or "Senior" doesn't reach the PATCH unchanged.
    seniority: (initial.seniority ?? "").toLowerCase(),
    years_experience: initial.years_experience ?? "",
    current_country: initial.current_country ?? "",
    current_city: initial.current_city ?? "",
    target_country: initial.target_country ?? "",
    target_city: initial.target_city ?? "",
    nationality: initial.nationality ?? "",
    needs_visa_sponsorship: initial.needs_visa_sponsorship ?? false,
    move_urgency: (initial.move_urgency ?? "12m") as BackendProfile["move_urgency"],
    work_preference: (initial.work_preference ?? "hybrid") as BackendProfile["work_preference"],
    current_salary: initial.current_salary ?? "",
    expected_salary: initial.expected_salary ?? "",
    salary_currency: initial.salary_currency ?? "EUR",
  });
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function set<K extends keyof typeof state>(k: K, v: (typeof state)[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    // Identity-only patch. Destination, visa, family, budget all live in
    // their own onboarding steps now.
    const patch: Partial<BackendProfile> = {
      full_name: state.full_name || null,
      current_role: state.current_role || null,
      industry: state.industry || null,
      seniority: state.seniority || null,
      years_experience: state.years_experience === "" ? null : Number(state.years_experience),
      work_preference: state.work_preference,
    };
    start(async () => {
      const r = await saveProfileAction(patch);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      // After profile (identity) the user moves to the destination step.
      // The previous flow jumped straight into /app/country — that bypassed
      // the rest of the data-first intake.
      router.push("/app/onboarding/destination");
    });
  }

  const inferredKey = (k: string) =>
    initial.field_sources && initial.field_sources[k] === "resume"
      ? "(from resume)"
      : "";

  const inferredCount = Object.values(initial.field_sources ?? {}).filter(
    (s) => s === "resume",
  ).length;
  const completion = Math.max(0, Math.min(100, initial.completion_percentage ?? 0));

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-ink-200 bg-white p-6">
      <ProfileCompleteness completion={completion} inferredCount={inferredCount} />
      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <Section title="Identity">
        <Field label={`Full name ${inferredKey("full_name")}`}>
          <input
            value={state.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={`Nationality (ISO-2) ${inferredKey("nationality")}`}>
          <input
            value={state.nationality}
            onChange={(e) => set("nationality", e.target.value)}
            maxLength={2}
            className="input uppercase"
            placeholder="IN"
          />
        </Field>
      </Section>

      <Section title="Career">
        <Field label={`Current role ${inferredKey("current_role")}`}>
          <input
            value={state.current_role}
            onChange={(e) => set("current_role", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={`Industry ${inferredKey("industry")}`}>
          <input
            value={state.industry}
            onChange={(e) => set("industry", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={`Seniority ${inferredKey("seniority")}`}>
          <select
            value={state.seniority}
            onChange={(e) => set("seniority", e.target.value)}
            className="input"
          >
            <option value="">—</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="staff">Staff</option>
            <option value="principal">Principal</option>
          </select>
        </Field>
        <Field label={`Years of experience ${inferredKey("years_experience")}`}>
          <input
            type="number"
            min={0}
            max={70}
            value={state.years_experience}
            onChange={(e) => set("years_experience", e.target.value)}
            className="input"
          />
        </Field>
      </Section>

      {/*
        Origin and destination intentionally moved to the destination
        intake step (`/app/onboarding/destination`) — that step uses
        full country names instead of ISO-2 codes. We still capture the
        identity bits here to confirm what the resume gave us.
      */}

      <Section title="How you'd work">
        <Field label="Work preference">
          <select
            value={state.work_preference ?? "hybrid"}
            onChange={(e) => set("work_preference", e.target.value as BackendProfile["work_preference"])}
            className="input"
          >
            <option value="onsite">Onsite</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </Field>
      </Section>

      {/* Salary, urgency, sponsorship now live in dedicated intake steps. */}

      <div className="flex items-center justify-between border-t border-ink-200 pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[13px] text-ink-600 underline-offset-4 hover:underline"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-parchment hover:bg-ink-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save & start analysis →"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e6e6e6;
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 13.5px;
        }
        .input:focus { outline: 2px solid #1a1f2c; outline-offset: -2px; }
        .uppercase { text-transform: uppercase; }
      `}</style>
    </form>
  );
}

function ProfileCompleteness({
  completion,
  inferredCount,
}: {
  completion: number;
  inferredCount: number;
}) {
  const tone =
    completion >= 75 ? "bg-success-500" : completion >= 40 ? "bg-gilt-500" : "bg-danger-500";
  return (
    <div data-profile-completeness className="rounded-xl border border-ink-200 bg-parchment/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700">
          Profile completeness
        </p>
        <p className="font-mono text-[11px] text-ink-700">
          {completion}% · {inferredCount} field{inferredCount === 1 ? "" : "s"} from resume
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full ${tone}`} style={{ width: `${completion}%` }} />
      </div>
      <p className="mt-2 text-[11.5px] text-ink-500">
        Resume-inferred fields are tagged below. Fill the rest — the analysis
        won't run without target country.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">{title}</p>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-700">
        {label}{required ? <span className="text-danger-700"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
