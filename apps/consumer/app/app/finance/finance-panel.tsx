"use client";

import * as React from "react";
import {
  ModulePanel,
  PanelInput,
  PanelSelect,
} from "@/components/backend/module-panel";
import { applyFinanceSensitivityAction } from "./actions";

type Sensitivity = "low" | "medium" | "high";

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
      title="Stress-test the numbers"
      hint="Tell us your runway, what rent you'd actually pay, and how tight your budget needs to be. We'll re-score affordability."
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
      <div className="grid grid-cols-2 gap-2">
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
      <div className="grid grid-cols-2 gap-2">
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
      <PanelSelect
        label="Cost sensitivity"
        value={sensitivity}
        onChange={setSensitivity}
        options={[
          { id: "low", label: "Low — ok with tighter margins" },
          { id: "medium", label: "Medium — comfortable surplus" },
          { id: "high", label: "High — needs strong cushion" },
        ]}
      />
    </ModulePanel>
  );
}
