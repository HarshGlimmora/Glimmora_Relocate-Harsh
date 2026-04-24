"use client";

import * as React from "react";

const rows = [
  { key: "newApps",     t: "New applications",  d: "Instant email when a new candidate applies.",  def: true  },
  { key: "stageMoves",  t: "Stage changes",     d: "When a teammate moves a candidate forward.",   def: true  },
  { key: "feedback",    t: "Interview feedback",d: "When interviewers submit scorecards.",         def: true  },
  { key: "digest",      t: "Weekly digest",     d: "Every Monday — pipeline health summary.",      def: false },
];

export function NotificationsForm() {
  const [state, setState] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((r) => [r.key, r.def]))
  );

  function toggle(k: string) {
    setState((s) => ({ ...s, [k]: !s[k] }));
  }

  return (
    <div className="mt-6 divide-y divide-ink-100">
      {rows.map((r) => {
        const on = state[r.key];
        return (
          <div key={r.key} className="flex items-start justify-between gap-6 py-4">
            <div>
              <p className="font-sans text-[14px] font-semibold text-ink-900">{r.t}</p>
              <p className="mt-1 text-[13px] text-ink-500">{r.d}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${on ? "Disable" : "Enable"} ${r.t}`}
              onClick={() => toggle(r.key)}
              className={`relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-lagoon-500" : "bg-ink-200"}`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          </div>
        );
      })}
      <p className="pt-4 text-[11.5px] text-ink-500">
        Changes save to your session. Server-side sync wires with the Notifications API.
      </p>
    </div>
  );
}
