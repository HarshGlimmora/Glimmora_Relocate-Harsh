"use client";

import * as React from "react";
import { saveStepAndContinue } from "../_actions";
import { StepNav } from "../_step-nav";
import type { CostSensitivity } from "@/lib/backend/types";

type Urgency = "asap" | "6m" | "12m" | "exploring";

export function BudgetIntakeForm({
  initialCurrentSalary,
  initialExpectedSalary,
  initialSavings,
  initialMonthlyBudget,
  initialCurrency,
  initialCostSensitivity,
  initialMoveUrgency,
}: {
  initialCurrentSalary: string;
  initialExpectedSalary: string;
  initialSavings: string;
  initialMonthlyBudget: string;
  initialCurrency: string;
  initialCostSensitivity: CostSensitivity;
  initialMoveUrgency: Urgency;
}) {
  const [current, setCurrent] = React.useState(initialCurrentSalary);
  const [expected, setExpected] = React.useState(initialExpectedSalary);
  const [savings, setSavings] = React.useState(initialSavings);
  const [monthly, setMonthly] = React.useState(initialMonthlyBudget);
  const [currency, setCurrency] = React.useState(initialCurrency);
  const [sens, setSens] = React.useState<CostSensitivity>(initialCostSensitivity);
  const [urgency, setUrgency] = React.useState<Urgency>(initialMoveUrgency);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currency || currency.length !== 3) {
      setError("Currency must be a 3-letter ISO code (e.g. EUR).");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await saveStepAndContinue(
          {
            current_salary: current ? Number(current) : null,
            expected_salary: expected ? Number(expected) : null,
            savings: savings ? Number(savings) : null,
            monthly_budget: monthly ? Number(monthly) : null,
            salary_currency: currency.toUpperCase(),
            cost_sensitivity: sens,
            move_urgency: urgency,
          },
          // After budget, the user lands on the dashboard.
          "/app/country",
        );
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Current salary (${currency || "EUR"})`}>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            min={0}
            placeholder="1500000"
            className="input"
          />
        </Field>
        <Field label={`Expected salary (${currency || "EUR"})`}>
          <input
            type="number"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            min={0}
            placeholder="85000"
            className="input"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Savings / runway">
          <input
            type="number"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            min={0}
            placeholder="20000"
            className="input"
          />
        </Field>
        <Field label="Monthly budget (post-move)">
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            min={0}
            placeholder="3000"
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
            maxLength={3}
            className="input uppercase"
          />
        </Field>
        <Field label="Cost sensitivity">
          <select
            value={sens}
            onChange={(e) => setSens(e.target.value as CostSensitivity)}
            className="input"
          >
            <option value="low">Low — ok with thin margins</option>
            <option value="medium">Medium — comfortable surplus</option>
            <option value="high">High — needs strong cushion</option>
          </select>
        </Field>
      </div>

      <Field label="When do you want to land?">
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as Urgency)}
          className="input"
        >
          <option value="asap">ASAP</option>
          <option value="6m">Within 6 months</option>
          <option value="12m">Within 12 months</option>
          <option value="exploring">Exploring</option>
        </select>
      </Field>

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <StepNav prevHref="/app/onboarding/visa" nextLabel="Start analysis" pending={pending} />

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
