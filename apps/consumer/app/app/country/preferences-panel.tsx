"use client";

import * as React from "react";
import { ModulePanel, PanelChips, PanelInput } from "@/components/backend/module-panel";
import { applyCountryPreferencesAction } from "./actions";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";

const PRIORITY_OPTIONS: { id: Priority; label: string; hint: string }[] = [
  { id: "career", label: "Career", hint: "Job market and growth" },
  { id: "cost", label: "Cost", hint: "Affordability and savings" },
  { id: "family", label: "Family", hint: "Schooling, healthcare, household" },
  { id: "lifestyle", label: "Lifestyle", hint: "Culture, language, daily life" },
  { id: "speed", label: "Speed", hint: "Fastest path to land" },
];

export function CountryPreferencesPanel({
  initialPriorities,
  initialReason,
  initialAlternatives,
}: {
  initialPriorities: Priority[];
  initialReason: string | null;
  initialAlternatives: string[];
}) {
  const [priorities, setPriorities] = React.useState<Priority[]>(initialPriorities);
  const [reason, setReason] = React.useState<string>(initialReason ?? "");
  const [alts, setAlts] = React.useState<string>(initialAlternatives.join(","));

  return (
    <ModulePanel
      testid="country"
      title="What matters most for this comparison?"
      hint="Pick the dimensions that should weigh hardest. Tell us why this country — and add up to 3 alternates to consider."
      onApply={async () => {
        const altList = alts
          .split(/[,\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter((s) => /^[A-Z]{2}$/.test(s))
          .slice(0, 3);
        return applyCountryPreferencesAction({
          priorities,
          reason: reason.trim() || null,
          alternatives: altList,
        });
      }}
    >
      <PanelChips
        label="Priorities (pick up to 3)"
        options={PRIORITY_OPTIONS}
        value={priorities}
        multi
        onChange={(v) => setPriorities((Array.isArray(v) ? v : [v]).slice(0, 3))}
      />
      <PanelInput
        label="Why this country? (one line)"
        value={reason}
        onChange={setReason}
        placeholder="e.g. partner has family in Berlin"
      />
      <PanelInput
        label="Alternates to compare (ISO-2, comma separated)"
        value={alts}
        onChange={setAlts}
        placeholder="NL, IE"
      />
    </ModulePanel>
  );
}
