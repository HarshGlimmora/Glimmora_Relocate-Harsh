"use client";

import * as React from "react";
import { ModulePanel, PanelChips } from "@/components/backend/module-panel";
import { applyWorkflowPriorityAction } from "./actions";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";
type StepFocus = "visa" | "documents" | "jobs" | "family" | "finance" | "logistics";

const PRIORITY_OPTIONS: { id: Priority; label: string; hint: string }[] = [
  { id: "speed", label: "Speed", hint: "Move on the shortest realistic path" },
  { id: "career", label: "Career", hint: "Don't compromise on the role" },
  { id: "family", label: "Family", hint: "Don't disrupt schooling/healthcare" },
  { id: "cost", label: "Cost", hint: "Avoid expensive shortcuts" },
  { id: "lifestyle", label: "Lifestyle", hint: "Pace it sustainably" },
];

const STEP_FOCUS_OPTIONS: { id: StepFocus; label: string }[] = [
  { id: "visa", label: "Visa" },
  { id: "documents", label: "Documents" },
  { id: "jobs", label: "Job search" },
  { id: "family", label: "Family setup" },
  { id: "finance", label: "Finances" },
  { id: "logistics", label: "Logistics" },
];

export function WorkflowPriorityPanel({
  initialPriorities,
  initialFirst,
}: {
  initialPriorities: Priority[];
  initialFirst: StepFocus | null;
}) {
  const [priorities, setPriorities] = React.useState<Priority[]>(initialPriorities);
  const [first, setFirst] = React.useState<StepFocus | null>(initialFirst);

  return (
    <ModulePanel
      testid="workflow"
      title="Reorder how you'd actually do it"
      hint="Tell us what to prioritise and what to start first. The plan re-ranks the dependency path."
      onApply={async () => {
        return applyWorkflowPriorityAction({
          priorities,
          first_focus: first ?? null,
        });
      }}
    >
      <PanelChips
        label="Optimise for (top 2)"
        options={PRIORITY_OPTIONS}
        value={priorities}
        multi
        onChange={(v) => setPriorities((Array.isArray(v) ? v : [v]).slice(0, 2))}
      />
      <PanelChips
        label="Start with"
        options={STEP_FOCUS_OPTIONS}
        value={first}
        onChange={(v) => setFirst((Array.isArray(v) ? v[0] : v) as StepFocus)}
      />
    </ModulePanel>
  );
}
