"use client";

import * as React from "react";
import { ModulePanel, PanelChips, PanelSelect } from "@/components/backend/module-panel";
import { applyTimelinePreferencesAction } from "./actions";

type Urgency = "asap" | "6m" | "12m" | "exploring";
type Style = "fast" | "safe" | "with_family";

const STYLE_OPTIONS: { id: Style; label: string; hint: string }[] = [
  { id: "fast", label: "Move fast", hint: "Compress wherever possible" },
  { id: "safe", label: "Move safely", hint: "Minimise risk on each step" },
  { id: "with_family", label: "Move with family", hint: "Pace to keep household stable" },
];

export function TimelinePreferencesPanel({
  initialUrgency,
  initialStyle,
}: {
  initialUrgency: Urgency;
  initialStyle: Style;
}) {
  const [urgency, setUrgency] = React.useState<Urgency>(initialUrgency);
  const [style, setStyle] = React.useState<Style>(initialStyle);

  return (
    <ModulePanel
      testid="timeline"
      title="Pace this move"
      hint="Adjust urgency and the style of move. We replan the milestones and the realistic start date."
      onApply={async () => {
        return applyTimelinePreferencesAction({ urgency, style });
      }}
    >
      <PanelSelect
        label="Move urgency"
        value={urgency}
        onChange={setUrgency}
        options={[
          { id: "asap", label: "ASAP" },
          { id: "6m", label: "Within 6 months" },
          { id: "12m", label: "Within 12 months" },
          { id: "exploring", label: "Exploring" },
        ]}
      />
      <PanelChips
        label="Move style"
        options={STYLE_OPTIONS}
        value={style}
        onChange={(v) => setStyle((Array.isArray(v) ? v[0] : v) as Style)}
      />
    </ModulePanel>
  );
}
