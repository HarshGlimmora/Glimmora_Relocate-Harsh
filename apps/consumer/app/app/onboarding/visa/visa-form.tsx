"use client";

import * as React from "react";
import { saveStepAndContinue } from "../_actions";
import { StepNav } from "../_step-nav";
import { COUNTRIES, countryName } from "@/lib/countries";

export function VisaIntakeForm({
  initialNationality,
  initialCurrentCountry,
  initialCurrentCity,
  initialCurrentVisaStatus,
}: {
  initialNationality: string | null;
  initialCurrentCountry: string | null;
  initialCurrentCity: string;
  initialCurrentVisaStatus: string;
}) {
  const [nationality, setNationality] = React.useState(initialNationality ?? "");
  const [currentCountry, setCurrentCountry] = React.useState(initialCurrentCountry ?? "");
  const [currentCity, setCurrentCity] = React.useState(initialCurrentCity);
  const [visaStatus, setVisaStatus] = React.useState(initialCurrentVisaStatus);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nationality) {
      setError("Pick the country whose passport you hold.");
      return;
    }
    if (!currentCountry) {
      setError("Pick the country you're currently living in.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await saveStepAndContinue(
          {
            nationality,
            current_country: currentCountry,
            current_city: currentCity.trim() || null,
            current_visa_status: visaStatus.trim() || null,
          },
          "/app/onboarding/budget",
        );
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-ink-200 bg-white p-5">
      <Field label="Nationality (passport country)">
        <CountrySelect value={nationality} onChange={setNationality} testid="nationality" />
        {nationality ? (
          <p className="mt-1 text-[12px] text-ink-500" data-nationality-name>
            {countryName(nationality)} passport
          </p>
        ) : null}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Current country (where you live now)">
          <CountrySelect value={currentCountry} onChange={setCurrentCountry} testid="current_country" />
          {currentCountry ? (
            <p className="mt-1 text-[12px] text-ink-500" data-current-country-name>
              Living in {countryName(currentCountry)}
            </p>
          ) : null}
        </Field>
        <Field label="Current city (optional)">
          <input
            value={currentCity}
            onChange={(e) => setCurrentCity(e.target.value)}
            maxLength={80}
            className="input"
          />
        </Field>
      </div>

      <Field label="Current visa / residence status (optional)">
        <input
          value={visaStatus}
          onChange={(e) => setVisaStatus(e.target.value)}
          placeholder="e.g. H-1B in US, citizen of IN"
          maxLength={80}
          className="input"
        />
      </Field>

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <StepNav prevHref="/app/onboarding/family" pending={pending} />

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

function CountrySelect({
  value,
  onChange,
  testid,
}: {
  value: string;
  onChange: (code: string) => void;
  testid: string;
}) {
  const options = React.useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-country-select={testid}
      className="input"
      style={{
        width: "100%",
        marginTop: "0.25rem",
        borderRadius: "0.5rem",
        border: "1px solid #e6e6e6",
        background: "white",
        padding: "0.5rem 0.75rem",
        fontSize: "13.5px",
      }}
    >
      <option value="">— Select a country —</option>
      {options.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
