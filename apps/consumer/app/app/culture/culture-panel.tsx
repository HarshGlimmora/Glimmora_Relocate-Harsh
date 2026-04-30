"use client";

import * as React from "react";
import { ModulePanel, PanelChips, PanelSelect } from "@/components/backend/module-panel";
import { applyCulturePreferencesAction } from "./actions";

type Priority = "career" | "family" | "cost" | "lifestyle" | "speed";
type LangConfidence = "none" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type Concern = "language" | "workplace" | "isolation" | "family_adapt" | "daily_life";

const CONCERN_OPTIONS: { id: Concern; label: string; hint: string }[] = [
  { id: "language", label: "Language barrier", hint: "Can I get by in English?" },
  { id: "workplace", label: "Workplace fit", hint: "Will I belong on the team?" },
  { id: "isolation", label: "Isolation", hint: "Building a social circle" },
  { id: "family_adapt", label: "Family adaptation", hint: "Spouse / kids settling in" },
  { id: "daily_life", label: "Daily life", hint: "Banking, healthcare, errands" },
];

const PROFICIENCY_OPTIONS: { id: LangConfidence; label: string }[] = [
  { id: "none", label: "None — English only" },
  { id: "A1", label: "A1 — basics" },
  { id: "A2", label: "A2 — survival" },
  { id: "B1", label: "B1 — conversational" },
  { id: "B2", label: "B2 — comfortable" },
  { id: "C1", label: "C1 — fluent" },
  { id: "C2", label: "C2 — native-like" },
];

export function CulturePreferencesPanel({
  initialConcern,
  initialLangConfidence,
}: {
  initialConcern: Concern;
  initialLangConfidence: LangConfidence;
}) {
  const [concern, setConcern] = React.useState<Concern>(initialConcern);
  const [lang, setLang] = React.useState<LangConfidence>(initialLangConfidence);

  return (
    <ModulePanel
      testid="culture"
      title="What worries you about settling in?"
      hint="We weight the cultural guidance to the thing you're nervous about — language, workplace fit, isolation, daily life, or the family side."
      onApply={async () => {
        const map: Record<Concern, Priority> = {
          language: "lifestyle",
          workplace: "career",
          isolation: "lifestyle",
          family_adapt: "family",
          daily_life: "lifestyle",
        };
        return applyCulturePreferencesAction({
          concern,
          language_confidence: lang,
          mapped_priority: map[concern],
        });
      }}
    >
      <PanelChips
        label="Top concern"
        options={CONCERN_OPTIONS}
        value={concern}
        onChange={(v) => setConcern((Array.isArray(v) ? v[0] : v) as Concern)}
      />
      <PanelSelect
        label="Local-language confidence"
        value={lang}
        onChange={setLang}
        options={PROFICIENCY_OPTIONS}
      />
    </ModulePanel>
  );
}
