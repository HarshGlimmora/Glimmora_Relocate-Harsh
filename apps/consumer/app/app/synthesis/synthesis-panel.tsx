"use client";

import * as React from "react";
import { ModulePanel, PanelChips } from "@/components/backend/module-panel";
import { applySynthesisFocusAction } from "./actions";

type Outcome = "career" | "family" | "cost" | "lifestyle" | "speed";
type Concern =
  | "wrong_country"
  | "wrong_role"
  | "money_tight"
  | "visa_blocks"
  | "family_disruption"
  | "timeline_slips";

const OUTCOME_OPTIONS: { id: Outcome; label: string; hint: string }[] = [
  { id: "career", label: "A bigger career", hint: "Better role, sponsor, growth" },
  { id: "cost", label: "Comfortable life", hint: "Surplus and savings" },
  { id: "lifestyle", label: "A different lifestyle", hint: "Pace, culture, place" },
  { id: "family", label: "Stable household", hint: "Schools, healthcare, partner" },
  { id: "speed", label: "Just to land", hint: "On the ground fast" },
];

const CONCERN_OPTIONS: { id: Concern; label: string }[] = [
  { id: "wrong_country", label: "Wrong country" },
  { id: "wrong_role", label: "Wrong role / under-employed" },
  { id: "money_tight", label: "Money too tight" },
  { id: "visa_blocks", label: "Visa won't clear" },
  { id: "family_disruption", label: "Family disruption" },
  { id: "timeline_slips", label: "Timeline slips" },
];

export function SynthesisFocusPanel({
  initialOutcome,
  initialConcern,
}: {
  initialOutcome: Outcome;
  initialConcern: Concern;
}) {
  const [outcome, setOutcome] = React.useState<Outcome>(initialOutcome);
  const [concern, setConcern] = React.useState<Concern>(initialConcern);

  return (
    <ModulePanel
      testid="synthesis"
      title="Confirm what matters most"
      hint="The verdict only makes sense in your context. Tell us the outcome you'd celebrate and the failure mode you're most worried about."
      onApply={async () => {
        return applySynthesisFocusAction({ outcome, concern });
      }}
      applyLabel="Re-score the verdict"
    >
      <PanelChips
        label="Outcome you most want"
        options={OUTCOME_OPTIONS}
        value={outcome}
        onChange={(v) => setOutcome((Array.isArray(v) ? v[0] : v) as Outcome)}
      />
      <PanelChips
        label="Top concern"
        options={CONCERN_OPTIONS}
        value={concern}
        onChange={(v) => setConcern((Array.isArray(v) ? v[0] : v) as Concern)}
      />
    </ModulePanel>
  );
}
