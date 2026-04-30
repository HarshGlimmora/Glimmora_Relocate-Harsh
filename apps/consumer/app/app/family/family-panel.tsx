"use client";

import * as React from "react";
import {
  ModulePanel,
  PanelInput,
  PanelSelect,
  PanelToggle,
} from "@/components/backend/module-panel";
import { applyFamilyShapeAction } from "./actions";

type Mode = "solo" | "with_family";
type SchoolingNeed =
  | "none"
  | "preschool"
  | "primary"
  | "secondary"
  | "high"
  | "tertiary"
  | "special_needs";
type Dependency = "none" | "low" | "medium" | "high" | "full_dependency";
type Sensitivity = "low" | "medium" | "high";
type BudgetImpact = "low" | "medium" | "high";
type FamilyPriority =
  | "schooling"
  | "spouse_career"
  | "healthcare"
  | "housing"
  | "speed";

interface ChildState {
  age: string;
  schooling_need: SchoolingNeed;
}

const SCHOOLING_OPTIONS: { id: SchoolingNeed; label: string }[] = [
  { id: "none", label: "None" },
  { id: "preschool", label: "Preschool" },
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "high", label: "High school" },
  { id: "tertiary", label: "University" },
  { id: "special_needs", label: "Special needs" },
];

const PRIORITY_OPTIONS: { id: FamilyPriority; label: string }[] = [
  { id: "schooling", label: "Schooling" },
  { id: "spouse_career", label: "Spouse career" },
  { id: "healthcare", label: "Healthcare" },
  { id: "housing", label: "Housing" },
  { id: "speed", label: "Speed" },
];

export function FamilyShapePanel({
  initialMode,
  initialSpouseMoving,
  initialSpouseHasCareer,
  initialSpouseProfession,
  initialSpouseVisaRequired,
  initialChildren,
  initialParentsMoving,
  initialParentsDependency,
  initialParentsSensitivity,
  initialHousing,
  initialBudgetImpact,
  initialPriority,
}: {
  initialMode: Mode;
  initialSpouseMoving: boolean;
  initialSpouseHasCareer: boolean;
  initialSpouseProfession: string;
  initialSpouseVisaRequired: boolean;
  initialChildren: ChildState[];
  initialParentsMoving: boolean;
  initialParentsDependency: Dependency;
  initialParentsSensitivity: Sensitivity;
  initialHousing: string;
  initialBudgetImpact: BudgetImpact;
  initialPriority: FamilyPriority;
}) {
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [spouseMoving, setSpouseMoving] = React.useState(initialSpouseMoving);
  const [spouseHasCareer, setSpouseHasCareer] = React.useState(initialSpouseHasCareer);
  const [spouseProfession, setSpouseProfession] = React.useState(initialSpouseProfession);
  const [spouseVisaRequired, setSpouseVisaRequired] = React.useState(initialSpouseVisaRequired);
  const [children, setChildren] = React.useState<ChildState[]>(initialChildren);
  const [parentsMoving, setParentsMoving] = React.useState(initialParentsMoving);
  const [parentsDependency, setParentsDependency] = React.useState<Dependency>(initialParentsDependency);
  const [parentsSensitivity, setParentsSensitivity] = React.useState<Sensitivity>(initialParentsSensitivity);
  const [housing, setHousing] = React.useState(initialHousing);
  const [budgetImpact, setBudgetImpact] = React.useState<BudgetImpact>(initialBudgetImpact);
  const [priority, setPriority] = React.useState<FamilyPriority>(initialPriority);

  function addChild() {
    setChildren((cs) => [...cs, { age: "", schooling_need: "primary" }]);
  }
  function removeChild(i: number) {
    setChildren((cs) => cs.filter((_, idx) => idx !== i));
  }
  function setChild<K extends keyof ChildState>(i: number, key: K, value: ChildState[K]) {
    setChildren((cs) => cs.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  }

  return (
    <ModulePanel
      testid="family"
      title="Set up your household"
      hint="Solo or family changes the budget, the visa route, and the timeline. Tell us who's coming and what matters most."
      onApply={async () => {
        const cleanChildren = children
          .map((c) => ({ age: Number(c.age), schooling_need: c.schooling_need }))
          .filter((c) => Number.isFinite(c.age) && c.age >= 0 && c.age <= 25);
        return applyFamilyShapeAction({
          mode,
          spouse:
            mode === "with_family" && spouseMoving
              ? {
                  moving: true,
                  has_career: spouseHasCareer,
                  profession: spouseProfession.trim() || null,
                  work_visa_required: spouseVisaRequired,
                }
              : null,
          children: mode === "with_family" ? cleanChildren : [],
          parents:
            mode === "with_family" && parentsMoving
              ? {
                  moving: true,
                  dependency_level: parentsDependency,
                  healthcare_sensitivity: parentsSensitivity,
                }
              : null,
          housing_requirement: housing.trim() || null,
          family_budget_impact: budgetImpact,
          family_priority: priority,
        });
      }}
    >
      <PanelSelect
        label="Move shape"
        value={mode}
        onChange={setMode}
        options={[
          { id: "solo", label: "Solo move" },
          { id: "with_family", label: "Moving with family" },
        ]}
      />

      {mode === "with_family" ? (
        <>
          <div className="rounded-lg border border-ink-100 bg-parchment/40 p-3 space-y-2">
            <p className="text-[11.5px] font-medium text-ink-700">Spouse / partner</p>
            <PanelToggle
              label="Spouse is moving"
              value={spouseMoving}
              onChange={setSpouseMoving}
            />
            {spouseMoving ? (
              <>
                <PanelToggle
                  label="Spouse has a career to continue"
                  value={spouseHasCareer}
                  onChange={setSpouseHasCareer}
                />
                <PanelInput
                  label="Spouse profession"
                  value={spouseProfession}
                  onChange={setSpouseProfession}
                  placeholder="nurse, designer…"
                />
                <PanelToggle
                  label="Spouse needs work-visa sponsorship"
                  value={spouseVisaRequired}
                  onChange={setSpouseVisaRequired}
                />
              </>
            ) : null}
          </div>

          <div className="rounded-lg border border-ink-100 bg-parchment/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-medium text-ink-700">Children</p>
              <button
                type="button"
                onClick={addChild}
                className="rounded-full border border-ink-300 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-500"
              >
                + add
              </button>
            </div>
            {children.length === 0 ? (
              <p className="text-[11.5px] text-ink-500">No children added.</p>
            ) : (
              children.map((c, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="w-20">
                    <PanelInput
                      label="Age"
                      value={c.age}
                      onChange={(v) => setChild(i, "age", v)}
                      type="number"
                      min={0}
                      max={25}
                    />
                  </div>
                  <div className="flex-1">
                    <PanelSelect
                      label="Schooling"
                      value={c.schooling_need}
                      onChange={(v) => setChild(i, "schooling_need", v)}
                      options={SCHOOLING_OPTIONS}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="mb-1 rounded-full border border-ink-200 px-2 py-1 text-[11px] text-ink-500 hover:border-danger-300 hover:text-danger-700"
                  >
                    remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-ink-100 bg-parchment/40 p-3 space-y-2">
            <p className="text-[11.5px] font-medium text-ink-700">Parents</p>
            <PanelToggle
              label="Parents are moving with us"
              value={parentsMoving}
              onChange={setParentsMoving}
            />
            {parentsMoving ? (
              <>
                <PanelSelect
                  label="Dependency level"
                  value={parentsDependency}
                  onChange={setParentsDependency}
                  options={[
                    { id: "none", label: "None" },
                    { id: "low", label: "Low" },
                    { id: "medium", label: "Medium" },
                    { id: "high", label: "High" },
                    { id: "full_dependency", label: "Full dependency" },
                  ]}
                />
                <PanelSelect
                  label="Healthcare sensitivity"
                  value={parentsSensitivity}
                  onChange={setParentsSensitivity}
                  options={[
                    { id: "low", label: "Low" },
                    { id: "medium", label: "Medium" },
                    { id: "high", label: "High" },
                  ]}
                />
              </>
            ) : null}
          </div>
        </>
      ) : null}

      <PanelInput
        label="Housing requirement"
        value={housing}
        onChange={setHousing}
        placeholder="3-bed near international school"
      />
      <PanelSelect
        label="Family budget pressure"
        value={budgetImpact}
        onChange={setBudgetImpact}
        options={[
          { id: "low", label: "Low" },
          { id: "medium", label: "Medium" },
          { id: "high", label: "High" },
        ]}
      />
      <PanelSelect
        label="What matters most for the family?"
        value={priority}
        onChange={setPriority}
        options={PRIORITY_OPTIONS}
      />
    </ModulePanel>
  );
}
