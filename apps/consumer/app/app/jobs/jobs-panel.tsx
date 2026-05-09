"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
  ModulePanel,
  PanelChips,
  PanelInput,
  PanelSelect,
  PanelToggle,
} from "@/components/backend/module-panel";
import type { CareerAngleRecommendation } from "@/lib/backend/types";
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

const IMPACT_TONE: Record<
  CareerAngleRecommendation["impact"],
  { chip: string; iconWrap: string; iconColor: string; border: string; bg: string }
> = {
  high: {
    chip: "bg-success-100 text-success-800",
    iconWrap: "bg-success-100",
    iconColor: "text-success-700",
    border: "border-success-200",
    bg: "bg-success-50/40",
  },
  medium: {
    chip: "bg-gilt-100 text-gilt-800",
    iconWrap: "bg-gilt-100",
    iconColor: "text-gilt-700",
    border: "border-gilt-200",
    bg: "bg-gilt-50/40",
  },
  low: {
    chip: "bg-ink-100 text-ink-700",
    iconWrap: "bg-ink-100",
    iconColor: "text-ink-500",
    border: "border-ink-200",
    bg: "bg-white",
  },
};

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
  recommendations,
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
  /** AI-generated strategic positioning advice — rendered above the
   *  form as the first thing the user sees on expand. Backend supplies
   *  these via JobFitDetail.career_angle_recommendations. */
  recommendations?: CareerAngleRecommendation[];
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

  const recCount = recommendations?.length ?? 0;

  return (
    <ModulePanel
      testid="jobs"
      title={
        recCount > 0
          ? `Sharpen your career angle · ${recCount} AI tip${recCount === 1 ? "" : "s"}`
          : "Sharpen your career angle"
      }
      hint="Tap to expand. Review the AI-generated angle for this market, then fine-tune the inputs and re-run."
      collapsible
      defaultOpen={false}
      topSlot={
        recCount > 0 ? (
          <CareerAngleBlock recommendations={recommendations!} />
        ) : null
      }
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
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
        Fine-tune the inputs
      </p>
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

// ---- AI career-angle recommendation block (top of the panel) -------

function CareerAngleBlock({
  recommendations,
}: {
  recommendations: CareerAngleRecommendation[];
}) {
  return (
    <div data-career-angle-block>
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-800">
          AI career angle · how to position for this market
        </p>
      </div>

      <ul className="grid gap-2 md:grid-cols-2">
        {recommendations.map((r, i) => {
          const tone = IMPACT_TONE[r.impact] ?? IMPACT_TONE.low;
          return (
            <li
              key={i}
              data-career-angle={i}
              data-impact={r.impact}
              data-category={r.category}
              className={`flex items-start gap-2.5 rounded-2xl border ${tone.border} ${tone.bg} p-3 transition-shadow hover:shadow-sm`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold tabular-nums ${tone.iconWrap} ${tone.iconColor}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <p className="text-[12.5px] font-semibold tracking-[-0.005em] text-ink-900">
                    {r.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${tone.chip}`}
                  >
                    {r.impact} impact
                  </span>
                  <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700">
                    {r.category}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-700">
                  {r.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
