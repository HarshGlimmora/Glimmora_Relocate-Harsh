"use client";

import * as React from "react";
import {
  ModulePanel,
  PanelInput,
} from "@/components/backend/module-panel";
import { applyFinanceSensitivityAction } from "./actions";

type Sensitivity = "low" | "medium" | "high";

const SCENARIOS: {
  id: Sensitivity;
  title: string;
  short: string;
  description: string;
  icon: string;
  tone: {
    card: string;
    cardActive: string;
    chip: string;
    badge: string;
    indicator: string;
    iconBg: string;
    iconColor: string;
  };
}[] = [
  {
    id: "low",
    title: "Best case",
    short: "Higher salary, stable costs",
    description: "Comfortable with tighter margins — smaller surplus is fine if take-home holds up.",
    icon: "📈",
    tone: {
      card: "border-success-200 bg-success-50/40 hover:border-success-400",
      cardActive: "border-success-500 bg-success-50 ring-2 ring-success-200",
      chip: "bg-success-100 text-success-800",
      badge: "Best case",
      indicator: "bg-success-500",
      iconBg: "bg-success-100",
      iconColor: "text-success-700",
    },
  },
  {
    id: "medium",
    title: "Expected case",
    short: "Current estimated conditions",
    description: "Standard buffer — wants a comfortable monthly surplus on top of costs.",
    icon: "⚖",
    tone: {
      card: "border-ink-200 bg-white hover:border-ink-400",
      cardActive: "border-ink-900 bg-parchment/40 ring-2 ring-ink-200",
      chip: "bg-ink-100 text-ink-700",
      badge: "Expected case",
      indicator: "bg-ink-500",
      iconBg: "bg-ink-100",
      iconColor: "text-ink-700",
    },
  },
  {
    id: "high",
    title: "Risk case",
    short: "Lower salary or higher costs",
    description: "Stress-tested — needs a strong cushion in case salary slips or costs run hot.",
    icon: "⚠",
    tone: {
      card: "border-danger-200 bg-danger-50/40 hover:border-danger-400",
      cardActive: "border-danger-500 bg-danger-50 ring-2 ring-danger-200",
      chip: "bg-danger-100 text-danger-800",
      badge: "Risk case",
      indicator: "bg-danger-500",
      iconBg: "bg-danger-100",
      iconColor: "text-danger-700",
    },
  },
];

export function FinanceSensitivityPanel({
  initialMonthlyBudget,
  initialSavings,
  initialRent,
  initialFamilySize,
  initialSensitivity,
  initialCurrency,
}: {
  initialMonthlyBudget: string;
  initialSavings: string;
  initialRent: string;
  initialFamilySize: string;
  initialSensitivity: Sensitivity;
  initialCurrency: string;
}) {
  const [monthly, setMonthly] = React.useState(initialMonthlyBudget);
  const [savings, setSavings] = React.useState(initialSavings);
  const [rent, setRent] = React.useState(initialRent);
  const [size, setSize] = React.useState(initialFamilySize);
  const [sensitivity, setSensitivity] = React.useState<Sensitivity>(initialSensitivity);

  return (
    <ModulePanel
      testid="finance"
      title="Stress-test the numbers · scenario simulator"
      hint="Pick a scenario, fine-tune the inputs, and we'll re-score affordability against it."
      onApply={async () => {
        return applyFinanceSensitivityAction({
          monthly_budget: monthly ? Number(monthly) : null,
          savings: savings ? Number(savings) : null,
          rent_expectation: rent ? Number(rent) : null,
          family_size: size ? Number(size) : null,
          cost_sensitivity: sensitivity,
          salary_currency: initialCurrency,
        });
      }}
    >
      {/* ============ Scenario simulation cards ============ */}
      <div data-scenario-cards>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Pick a scenario
        </p>
        <div
          role="radiogroup"
          aria-label="Scenario"
          className="mt-2 grid gap-2 sm:grid-cols-3"
        >
          {SCENARIOS.map((s) => {
            const active = sensitivity === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-scenario={s.id}
                data-scenario-active={active ? "true" : "false"}
                onClick={() => setSensitivity(s.id)}
                className={
                  "group rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm " +
                  (active ? s.tone.cardActive : s.tone.card)
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.tone.iconBg} text-[14px] ${s.tone.iconColor}`}
                  >
                    {s.icon}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${s.tone.indicator}`} aria-hidden="true" />
                  <span className="text-[12.5px] font-semibold text-ink-900">
                    {s.title}
                  </span>
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-parchment"
                    >
                      <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
                        <path
                          d="M3.5 8.5l3 3 6-6.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 rounded-full px-2 py-0.5 inline-block font-mono text-[10px] uppercase tracking-[0.18em] ${s.tone.chip}`}>
                  {s.short}
                </p>
                <p className="mt-2 text-[11.5px] leading-[1.45] text-ink-600">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Fine-tune inputs ============ */}
      <div className="border-t border-ink-100 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Fine-tune the inputs
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <PanelInput
            label={`Monthly budget (${initialCurrency})`}
            value={monthly}
            onChange={setMonthly}
            type="number"
            placeholder="3000"
          />
          <PanelInput
            label={`Rent willing to pay (${initialCurrency})`}
            value={rent}
            onChange={setRent}
            type="number"
            placeholder="1400"
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <PanelInput
            label={`Savings (${initialCurrency})`}
            value={savings}
            onChange={setSavings}
            type="number"
            placeholder="20000"
          />
          <PanelInput
            label="Household size"
            value={size}
            onChange={setSize}
            type="number"
            min={1}
            max={12}
            placeholder="2"
          />
        </div>
      </div>
    </ModulePanel>
  );
}
