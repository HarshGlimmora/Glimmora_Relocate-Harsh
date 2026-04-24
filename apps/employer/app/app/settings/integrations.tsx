"use client";

import * as React from "react";
import { Check, Loader2, Plug } from "lucide-react";

const integrations = [
  { key: "greenhouse", name: "Greenhouse",    desc: "ATS · sync jobs both ways" },
  { key: "lever",      name: "Lever",         desc: "ATS · candidate import"    },
  { key: "workday",    name: "Workday",       desc: "HRIS · hire handoff"       },
  { key: "gcal",       name: "Google Calendar", desc: "Interview scheduling"    },
  { key: "slack",      name: "Slack",         desc: "Pipeline alerts"           },
  { key: "zoom",       name: "Zoom",          desc: "Interview links"           },
];

export function IntegrationGrid() {
  const [connecting, setConnecting] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<Record<string, boolean>>({});

  function handleConnect(key: string) {
    if (connected[key]) {
      setConnected((c) => ({ ...c, [key]: false }));
      return;
    }
    setConnecting(key);
    setTimeout(() => {
      setConnected((c) => ({ ...c, [key]: true }));
      setConnecting(null);
    }, 900);
  }

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {integrations.map((i) => {
        const isConnected = connected[i.key];
        const isConnecting = connecting === i.key;
        return (
          <div key={i.key} className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-parchment px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${isConnected ? "border-lagoon-200 bg-lagoon-50 text-lagoon-700" : "border-ink-200 bg-white text-ink-600"}`}>
                <Plug className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-[14px] font-semibold text-ink-900 truncate">{i.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-500 truncate">{i.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleConnect(i.key)}
              disabled={isConnecting}
              className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[11.5px] font-medium transition-colors ${
                isConnected
                  ? "bg-lagoon-500 text-white hover:bg-lagoon-600"
                  : "border border-ink-200 bg-white text-ink-800 hover:border-ink-900"
              } disabled:opacity-60 disabled:cursor-wait`}
            >
              {isConnecting ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Connecting…</>
              ) : isConnected ? (
                <><Check className="h-3 w-3" strokeWidth={2.5} /> Connected</>
              ) : (
                "Connect"
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
