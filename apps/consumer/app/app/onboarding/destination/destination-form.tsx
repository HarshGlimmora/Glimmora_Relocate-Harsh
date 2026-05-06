"use client";

import * as React from "react";
import { saveStepAndContinue } from "../_actions";
import { StepNav } from "../_step-nav";
import { COUNTRIES, countryName } from "@/lib/countries";

export function DestinationForm({
  initialTargetCountry,
  initialTargetCity,
  initialAlternatives,
  initialOpenToAlternatives,
}: {
  initialTargetCountry: string | null;
  initialTargetCity: string;
  initialAlternatives: string[];
  initialOpenToAlternatives: boolean | null;
}) {
  const [target, setTarget] = React.useState<string>(initialTargetCountry ?? "");
  const [city, setCity] = React.useState<string>(initialTargetCity);
  const [alternates, setAlternates] = React.useState<string[]>(initialAlternatives);
  const [openToAlts, setOpenToAlts] = React.useState<boolean>(
    initialOpenToAlternatives ?? alternates.length > 0,
  );
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function toggleAlt(code: string) {
    setAlternates((cs) => {
      if (cs.includes(code)) return cs.filter((c) => c !== code);
      if (cs.length >= 3) return cs;
      return [...cs, code];
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) {
      setError("Pick the country you want to land in.");
      return;
    }
    setError(null);
    const filteredAlts = alternates.filter((a) => a !== target);
    start(async () => {
      try {
        await saveStepAndContinue(
          {
            target_country: target,
            target_city: city.trim() || null,
            open_to_alternatives: openToAlts,
            alternatives: filteredAlts,
          },
          "/app/onboarding/jobs",
        );
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-ink-200 bg-white p-5">
      <Field label="Target country">
        <CountryPicker value={target} onChange={setTarget} />
        {target ? (
          <p className="mt-1 text-[12px] text-ink-500" data-target-country-name>
            Selected: {countryName(target)}
          </p>
        ) : null}
      </Field>

      <Field label="Target city (optional)">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Berlin"
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13.5px] focus:outline focus:outline-2 focus:outline-ink-900"
        />
      </Field>

      <div>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={openToAlts}
            onChange={(e) => setOpenToAlts(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-[13px] font-medium text-ink-800">
              I'm open to alternates
            </span>
            <span className="block text-[12px] text-ink-500">
              Pick up to 3 — country comparison will weigh them.
            </span>
          </span>
        </label>
        {openToAlts ? (
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {COUNTRIES.filter((c) => c.code !== target)
              .slice(0, 16)
              .map((c) => {
                const active = alternates.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    data-alt={c.code}
                    data-alt-active={active ? "true" : "false"}
                    onClick={() => toggleAlt(c.code)}
                    className={
                      "rounded-full border px-2.5 py-1 text-[11.5px] " +
                      (active
                        ? "border-ink-900 bg-ink-900 text-parchment"
                        : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl bg-danger-50 p-3 text-[13px] text-danger-800">{error}</div>
      ) : null}

      <StepNav prevHref="/app/onboarding/profile" pending={pending} />
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

function CountryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const options = React.useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-country-select
      className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13.5px] focus:outline focus:outline-2 focus:outline-ink-900"
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
