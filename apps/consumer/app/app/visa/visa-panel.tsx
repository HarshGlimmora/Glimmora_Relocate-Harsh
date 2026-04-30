"use client";

import * as React from "react";
import {
  ModulePanel,
  PanelInput,
  PanelSelect,
  PanelToggle,
} from "@/components/backend/module-panel";
import { applyVisaPreferencesAction } from "./actions";

type Employment =
  | "employed"
  | "with_offer"
  | "self_employed"
  | "studying"
  | "unemployed";

const EMPLOYMENT_OPTIONS: { id: Employment; label: string }[] = [
  { id: "employed", label: "Employed (no offer abroad yet)" },
  { id: "with_offer", label: "I have an offer abroad" },
  { id: "self_employed", label: "Self-employed / freelance" },
  { id: "studying", label: "Studying" },
  { id: "unemployed", label: "Between jobs" },
];

export function VisaPreferencesPanel({
  initialNationality,
  initialCurrentVisaStatus,
  initialSponsorRequired,
  initialFamilyRelocation,
  initialEmployment,
}: {
  initialNationality: string;
  initialCurrentVisaStatus: string;
  initialSponsorRequired: boolean;
  initialFamilyRelocation: boolean;
  initialEmployment: Employment;
}) {
  const [nationality, setNationality] = React.useState(initialNationality);
  const [status, setStatus] = React.useState(initialCurrentVisaStatus);
  const [sponsorRequired, setSponsorRequired] = React.useState(initialSponsorRequired);
  const [familyRelocation, setFamilyRelocation] = React.useState(initialFamilyRelocation);
  const [employment, setEmployment] = React.useState<Employment>(initialEmployment);

  return (
    <ModulePanel
      testid="visa"
      title="Confirm what you have on paper"
      hint="The route changes a lot based on passport, employment, and whether family is coming. Adjust and we'll re-run the visa direction."
      onApply={async () => {
        const upper = nationality.toUpperCase().slice(0, 2);
        if (!/^[A-Z]{2}$/.test(upper)) {
          return { ok: false, error: "Nationality must be a 2-letter ISO code (e.g. IN)." };
        }
        return applyVisaPreferencesAction({
          nationality: upper,
          current_visa_status: status.trim() || null,
          sponsor_required: sponsorRequired,
          family_relocation: familyRelocation,
          employment_status: employment,
        });
      }}
    >
      <PanelInput
        label="Nationality (ISO-2)"
        value={nationality}
        onChange={setNationality}
        placeholder="IN"
      />
      <PanelInput
        label="Current visa / residence status"
        value={status}
        onChange={setStatus}
        placeholder="e.g. resident IN, no visa elsewhere"
      />
      <PanelSelect
        label="Employment status"
        value={employment}
        onChange={setEmployment}
        options={EMPLOYMENT_OPTIONS}
      />
      <PanelToggle
        label="I'll need an employer sponsor"
        hint="Filters routes that require sponsor letters."
        value={sponsorRequired}
        onChange={setSponsorRequired}
      />
      <PanelToggle
        label="Family is moving with me"
        hint="Adds dependent-route requirements + family-tier docs."
        value={familyRelocation}
        onChange={setFamilyRelocation}
      />
    </ModulePanel>
  );
}
