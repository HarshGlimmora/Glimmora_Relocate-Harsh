"use client";

import * as React from "react";
import { saveStepAndContinue } from "../_actions";
import { StepNav } from "../_step-nav";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";
type WorkPreference = "onsite" | "hybrid" | "remote";

const FOCUS_OPTIONS: { id: Priority; label: string }[] = [
  { id: "career", label: "Role fit" },
  { id: "cost", label: "Salary" },
  { id: "speed", label: "Speed to offer" },
  { id: "family", label: "Visa friendly" },
  { id: "lifestyle", label: "Lifestyle" },
];

export function JobsIntakeForm({
  initialTargetRole,
  initialIndustry,
  initialWorkPreference,
  initialNeedsSponsorship,
  initialPriorities,
  initialExpectedSalary,
  initialCurrency,
}: {
  initialTargetRole: string;
  initialIndustry: string;
  initialWorkPreference: WorkPreference;
  initialNeedsSponsorship: boolean;
  initialPriorities: Priority[];
  initialExpectedSalary: string;
  initialCurrency: string;
}) {
  const [targetRole, setTargetRole] = React.useState(initialTargetRole);
  const [industry, setIndustry] = React.useState(initialIndustry);
  const [workPref, setWorkPref] = React.useState<WorkPreference>(initialWorkPreference);
  const [sponsorship, setSponsorship] = React.useState(initialNeedsSponsorship);
  const [focus, setFocus] = React.useState<Priority[]>(initialPriorities);
  const [expectedSalary, setExpectedSalary] = React.useState(initialExpectedSalary);
  const [currency, setCurrency] = React.useState(initialCurrency || "EUR");
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function toggleFocus(id: Priority) {
    setFocus((cs) => {
      if (cs.includes(id)) return cs.filter((c) => c !== id);
      if (cs.length >= 2) return cs;
      return [...cs, id];
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await saveStepAndContinue(
          {
            target_role: targetRole.trim() || null,
            industry: industry.trim() || null,
            work_preference: workPref,
            needs_visa_sponsorship: sponsorship,
            priority_ranking: focus,
            expected_salary: expectedSalary ? Number(expectedSalary) : null,
            salary_currency: currency.toUpperCase().slice(0, 3),
          },
          "/app/onboarding/family",
        );
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5">
      <Field label="Target role">
        <input
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Senior backend engineer"
          maxLength={160}
          className="input"
        />
      </Field>
      <Field label="Industry">
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="fintech, healthtech…"
          maxLength={80}
          className="input"
        />
      </Field>
      <Field label="What matters most? (pick up to 2)">
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FOCUS_OPTIONS.map((o) => {
            const active = focus.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                data-focus={o.id}
                data-focus-active={active ? "true" : "false"}
                onClick={() => toggleFocus(o.id)}
                className={
                  "rounded-full border px-3 py-1 text-[12px] " +
                  (active
                    ? "border-ink-900 bg-ink-900 text-parchment"
                    : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Expected annual salary (${currency})`}>
          <input
            type="number"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(e.target.value)}
            min={0}
            placeholder="85000"
            className="input"
          />
        </Field>
        <Field label="Currency (ISO)">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="input uppercase"
          />
        </Field>
      </div>

      <Field label="Work preference">
        <select
          value={workPref}
          onChange={(e) => setWorkPref(e.target.value as WorkPreference)}
          className="input"
        >
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
          <option value="remote">Remote</option>
        </select>
      </Field>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={sponsorship}
          onChange={(e) => setSponsorship(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-[13px] font-medium text-ink-800">
            I'll need visa sponsorship from an employer
          </span>
          <span className="block text-[12px] text-ink-500">
            We'll filter to sponsor-friendly employers and routes.
          </span>
        </span>
      </label>

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <StepNav prevHref="/app/onboarding/destination" pending={pending} />

      <style jsx>{`
        .input {
          width: 100%;
          margin-top: 0.25rem;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}
