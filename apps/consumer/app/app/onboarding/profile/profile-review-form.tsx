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
    seniority: initial.seniority ?? "",
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
    const patch: Partial<BackendProfile> = {
      full_name: state.full_name || null,
      current_role: state.current_role || null,
      industry: state.industry || null,
      seniority: state.seniority || null,
      years_experience: state.years_experience === "" ? null : Number(state.years_experience),
      current_country: state.current_country?.toUpperCase() || null,
      current_city: state.current_city || null,
      target_country: state.target_country?.toUpperCase() || null,
      target_city: state.target_city || null,
      nationality: state.nationality?.toUpperCase() || null,
      needs_visa_sponsorship: state.needs_visa_sponsorship,
      move_urgency: state.move_urgency,
      work_preference: state.work_preference,
      current_salary: state.current_salary === "" ? null : Number(state.current_salary),
      expected_salary: state.expected_salary === "" ? null : Number(state.expected_salary),
      salary_currency: state.salary_currency || null,
    };
    start(async () => {
      const r = await saveProfileAction(patch);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push("/app/country");
    });
  }

  const inferredKey = (k: string) =>
    initial.field_sources && initial.field_sources[k] === "resume"
      ? "(from resume)"
      : "";

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-ink-200 bg-white p-6">
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
          <input
            value={state.seniority}
            onChange={(e) => set("seniority", e.target.value)}
            className="input"
            placeholder="mid / senior / staff / principal"
          />
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

      <Section title="Origin & destination *required* ">
        <Field label="Current country (ISO-2)">
          <input
            value={state.current_country}
            onChange={(e) => set("current_country", e.target.value)}
            maxLength={2}
            className="input uppercase"
          />
        </Field>
        <Field label="Current city">
          <input
            value={state.current_city}
            onChange={(e) => set("current_city", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Target country (ISO-2)" required>
          <input
            value={state.target_country}
            onChange={(e) => set("target_country", e.target.value)}
            maxLength={2}
            required
            className="input uppercase"
          />
        </Field>
        <Field label="Target city">
          <input
            value={state.target_city}
            onChange={(e) => set("target_city", e.target.value)}
            className="input"
          />
        </Field>
      </Section>

      <Section title="Visa & timing">
        <Field label="Needs visa sponsorship?">
          <select
            value={state.needs_visa_sponsorship ? "yes" : "no"}
            onChange={(e) => set("needs_visa_sponsorship", e.target.value === "yes")}
            className="input"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Move urgency">
          <select
            value={state.move_urgency ?? "12m"}
            onChange={(e) => set("move_urgency", e.target.value as BackendProfile["move_urgency"])}
            className="input"
          >
            <option value="asap">ASAP</option>
            <option value="6m">Within 6 months</option>
            <option value="12m">Within 12 months</option>
            <option value="exploring">Exploring</option>
          </select>
        </Field>
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

      <Section title="Salary">
        <Field label="Current salary (annual)">
          <input
            type="number"
            min={0}
            value={state.current_salary}
            onChange={(e) => set("current_salary", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Expected salary (annual, target market)">
          <input
            type="number"
            min={0}
            value={state.expected_salary}
            onChange={(e) => set("expected_salary", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Currency (ISO 4217)">
          <input
            value={state.salary_currency}
            onChange={(e) => set("salary_currency", e.target.value)}
            maxLength={3}
            className="input uppercase"
          />
        </Field>
      </Section>

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
