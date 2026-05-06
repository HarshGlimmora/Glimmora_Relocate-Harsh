"use client";

import * as React from "react";
import { saveStepAndContinue } from "../_actions";
import { StepNav } from "../_step-nav";
import type {
  FamilyStatus,
  FamilyBudgetImpact,
  SchoolRequirement,
} from "@/lib/backend/types";

export function FamilyIntakeForm({
  initialFamilyStatus,
  initialMovingWithFamily,
  initialChildrenCount,
  initialParentsMoving,
  initialSchoolRequirement,
  initialHousingRequirement,
  initialFamilyBudgetImpact,
}: {
  initialFamilyStatus: FamilyStatus;
  initialMovingWithFamily: boolean;
  initialChildrenCount: number;
  initialParentsMoving: boolean;
  initialSchoolRequirement: SchoolRequirement;
  initialHousingRequirement: string;
  initialFamilyBudgetImpact: FamilyBudgetImpact;
}) {
  const [status, setStatus] = React.useState<FamilyStatus>(initialFamilyStatus);
  const [withFamily, setWithFamily] = React.useState(initialMovingWithFamily);
  const [kids, setKids] = React.useState<string>(initialChildrenCount.toString());
  const [parents, setParents] = React.useState(initialParentsMoving);
  const [school, setSchool] = React.useState<SchoolRequirement>(initialSchoolRequirement);
  const [housing, setHousing] = React.useState(initialHousingRequirement);
  const [budgetImpact, setBudgetImpact] = React.useState<FamilyBudgetImpact>(initialFamilyBudgetImpact);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await saveStepAndContinue(
          {
            family_status: status,
            moving_with_family: withFamily,
            children_count: kids ? Number(kids) : 0,
            parents_moving: parents,
            school_requirement: school,
            housing_requirement: housing.trim() || null,
            family_budget_impact: budgetImpact,
          },
          "/app/onboarding/visa",
        );
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5">
      <Field label="Family status">
        <select value={status} onChange={(e) => setStatus(e.target.value as FamilyStatus)} className="input">
          <option value="single">Single</option>
          <option value="partnered">Partnered</option>
          <option value="married">Married</option>
          <option value="separated">Separated</option>
          <option value="widowed">Widowed</option>
        </select>
      </Field>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={withFamily}
          onChange={(e) => setWithFamily(e.target.checked)}
          data-with-family
          className="mt-1"
        />
        <span>
          <span className="block text-[13px] font-medium text-ink-800">Family is moving with me</span>
          <span className="block text-[12px] text-ink-500">Household budget + dependent visas + schooling.</span>
        </span>
      </label>

      {withFamily ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Children moving">
              <input
                type="number"
                min={0}
                max={12}
                value={kids}
                onChange={(e) => setKids(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Schooling need">
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value as SchoolRequirement)}
                className="input"
              >
                <option value="none">None</option>
                <option value="preschool">Preschool</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="high">High school</option>
                <option value="tertiary">University</option>
                <option value="special_needs">Special needs</option>
              </select>
            </Field>
          </div>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={parents}
              onChange={(e) => setParents(e.target.checked)}
              className="mt-1"
            />
            <span className="block text-[13px] font-medium text-ink-800">
              Parents are moving with me
            </span>
          </label>

          <Field label="Housing requirement (optional)">
            <input
              value={housing}
              onChange={(e) => setHousing(e.target.value)}
              placeholder="3-bed near international school"
              maxLength={200}
              className="input"
            />
          </Field>

          <Field label="Family budget pressure">
            <select
              value={budgetImpact}
              onChange={(e) => setBudgetImpact(e.target.value as FamilyBudgetImpact)}
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <StepNav prevHref="/app/onboarding/jobs" pending={pending} />

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
