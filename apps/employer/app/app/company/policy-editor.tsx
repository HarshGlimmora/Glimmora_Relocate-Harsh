"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { updateSponsorship } from "./actions";

const allCountries = [
  "DE", "NL", "IE", "PT", "FR", "ES", "IT", "GB", "SE", "DK", "PL", "CZ", "AT", "BE", "FI", "NO",
];
const allTiers = [
  "EU Blue Card", "HSM", "Tech Visa", "Critical Skills", "ICT", "Sponsor Licence",
];

type Initial = {
  sponsorsCountries: string[];
  visaTiers: string[];
  relocationBenefit: string | null;
  remoteFriendly: boolean;
};

export function PolicyEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [countries, setCountries] = React.useState<string[]>(initial.sponsorsCountries);
  const [tiers, setTiers] = React.useState<string[]>(initial.visaTiers);
  const [benefit, setBenefit] = React.useState<string>(initial.relocationBenefit ?? "");
  const [remote, setRemote] = React.useState<boolean>(initial.remoteFriendly);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  function toggleIn(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function reset() {
    setCountries(initial.sponsorsCountries);
    setTiers(initial.visaTiers);
    setBenefit(initial.relocationBenefit ?? "");
    setRemote(initial.remoteFriendly);
    setError(null);
    setEditing(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSponsorship({
        sponsorsCountries: countries,
        visaTiers: tiers,
        relocationBenefit: benefit.trim() ? benefit.trim() : null,
        remoteFriendly: remote,
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  if (!editing) {
    return (
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 text-[13px] font-medium text-ink-800 transition-colors hover:border-ink-900"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit policy
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-lagoon-700">
            <Check className="h-3 w-3" strokeWidth={2.5} /> Saved
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5 rounded-xl border border-ink-200 bg-parchment/40 p-5">
      <div>
        <p className="mono-label mb-2">Countries you sponsor</p>
        <div className="flex flex-wrap gap-1.5">
          {allCountries.map((c) => {
            const on = countries.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleIn(countries, setCountries, c)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold transition-colors ${
                  on
                    ? "border-lagoon-500 bg-lagoon-500 text-white"
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-400"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mono-label mb-2">Visa tiers supported</p>
        <div className="flex flex-wrap gap-1.5">
          {allTiers.map((t) => {
            const on = tiers.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleIn(tiers, setTiers, t)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  on
                    ? "border-ink-900 bg-ink-900 text-parchment"
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-400"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="benefit" className="mono-label mb-1.5 block">Relocation benefit</label>
          <input
            id="benefit"
            type="text"
            value={benefit}
            onChange={(e) => setBenefit(e.target.value)}
            placeholder="up to €8,000"
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[13.5px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-lagoon-600 focus:ring-lagoon-600/15"
          />
        </div>
        <div>
          <p className="mono-label mb-1.5">Remote-friendly</p>
          <button
            type="button"
            onClick={() => setRemote(!remote)}
            role="switch"
            aria-checked={remote}
            className={`relative flex h-[42px] w-full items-center justify-between rounded-xl border px-4 text-[13px] font-medium transition-colors ${
              remote ? "border-lagoon-500 bg-lagoon-50 text-lagoon-900" : "border-ink-200 bg-white text-ink-700"
            }`}
          >
            {remote ? "Yes — remote welcome" : "No — on-site only"}
            <span className={`relative h-5 w-9 rounded-full transition-colors ${remote ? "bg-lagoon-500" : "bg-ink-300"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${remote ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
        </div>
      </div>

      {error ? <p className="text-[12px] text-danger-700">{error}</p> : null}

      <div className="flex items-center justify-end gap-2 border-t border-ink-200 pt-4">
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-ink-600 hover:bg-ink-900/5"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-900 px-5 text-[13px] font-medium text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
        >
          {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Save policy</>}
        </button>
      </div>
    </div>
  );
}
