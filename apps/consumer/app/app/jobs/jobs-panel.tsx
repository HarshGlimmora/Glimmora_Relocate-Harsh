"use client";

import * as React from "react";
import {
  ModulePanel,
  PanelChips,
  PanelInput,
  PanelSelect,
  PanelToggle,
} from "@/components/backend/module-panel";
import { applyJobsPreferencesAction } from "./actions";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";
type WorkMode = "onsite" | "hybrid" | "remote";

const FOCUS_OPTIONS: { id: Priority; label: string; hint: string }[] = [
  { id: "career", label: "Role fit", hint: "Match my skills + seniority" },
  { id: "cost", label: "Salary", hint: "Maximize compensation" },
  { id: "speed", label: "Speed to offer", hint: "Fastest hire" },
  { id: "family", label: "Visa friendly", hint: "Sponsoring employers" },
  { id: "lifestyle", label: "Lifestyle", hint: "Sustainable workload" },
];

export function JobsPreferencesPanel({
  initialTargetRole,
  initialIndustry,
  initialWorkMode,
  initialNeedsSponsorship,
  initialOpenToChange,
  initialFocus,
  initialSalaryMin,
  initialSalaryMax,
  initialCurrency,
}: {
  initialTargetRole: string;
  initialIndustry: string;
  initialWorkMode: WorkMode;
  initialNeedsSponsorship: boolean;
  initialOpenToChange: boolean;
  initialFocus: Priority[];
  initialSalaryMin: string;
  initialSalaryMax: string;
  initialCurrency: string;
}) {
  const [targetRole, setTargetRole] = React.useState(initialTargetRole);
  const [industry, setIndustry] = React.useState(initialIndustry);
  const [workMode, setWorkMode] = React.useState<WorkMode>(initialWorkMode);
  const [needsSponsorship, setNeedsSponsorship] = React.useState(initialNeedsSponsorship);
  const [openToChange, setOpenToChange] = React.useState(initialOpenToChange);
  const [focus, setFocus] = React.useState<Priority[]>(initialFocus);
  const [salaryMin, setSalaryMin] = React.useState(initialSalaryMin);
  const [salaryMax, setSalaryMax] = React.useState(initialSalaryMax);
  const [currency, setCurrency] = React.useState(initialCurrency || "EUR");

  return (
    <ModulePanel
      testid="jobs"
      title="Sharpen your career angle"
      hint="Tell us the role you're really targeting and what matters more — speed, salary, or visa friendliness. We re-run job-fit against your answer."
      onApply={async () => {
        return applyJobsPreferencesAction({
          target_role: targetRole.trim() || null,
          preferred_industry: industry.trim() || null,
          work_mode: workMode,
          needs_visa_sponsorship: needsSponsorship,
          open_to_role_change: openToChange,
          focus,
          salary_min: salaryMin ? Number(salaryMin) : null,
          salary_max: salaryMax ? Number(salaryMax) : null,
          salary_currency: currency.toUpperCase().slice(0, 3) || null,
        });
      }}
    >
      <PanelInput
        label="Target role"
        value={targetRole}
        onChange={setTargetRole}
        placeholder="Senior backend engineer"
      />
      <PanelInput
        label="Preferred industry"
        value={industry}
        onChange={setIndustry}
        placeholder="fintech, healthtech…"
      />
      <PanelChips
        label="What matters most?"
        options={FOCUS_OPTIONS}
        value={focus}
        multi
        onChange={(v) => setFocus((Array.isArray(v) ? v : [v]).slice(0, 2))}
      />
      <div className="grid grid-cols-2 gap-2">
        <PanelInput
          label={`Salary min (${currency})`}
          value={salaryMin}
          onChange={setSalaryMin}
          placeholder="70000"
          type="number"
        />
        <PanelInput
          label={`Salary max (${currency})`}
          value={salaryMax}
          onChange={setSalaryMax}
          placeholder="100000"
          type="number"
        />
      </div>
      <PanelSelect
        label="Work mode"
        value={workMode}
        onChange={setWorkMode}
        options={[
          { id: "onsite", label: "Onsite" },
          { id: "hybrid", label: "Hybrid" },
          { id: "remote", label: "Remote" },
        ]}
      />
      <PanelToggle
        label="Open to adjacent roles"
        hint="Widen the search to nearby titles."
        value={openToChange}
        onChange={setOpenToChange}
      />
      <PanelToggle
        label="I need visa sponsorship"
        hint="Filter to sponsor-friendly employers."
        value={needsSponsorship}
        onChange={setNeedsSponsorship}
      />
    </ModulePanel>
  );
}
