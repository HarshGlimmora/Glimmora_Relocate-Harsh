"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserCheck, MessageSquare, HandCoins, Award, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { moveStage } from "../actions";

const flow = [
  { key: "SHORTLISTED", label: "Shortlist",         icon: UserCheck,     hint: "Move to shortlist",   tone: "lagoon"  as const },
  { key: "INTERVIEW",   label: "Schedule interview", icon: MessageSquare, hint: "Move to interviews",  tone: "gilt"    as const },
  { key: "OFFER",       label: "Make offer",         icon: HandCoins,     hint: "Move to offers",       tone: "success" as const },
  { key: "HIRED",       label: "Mark hired",         icon: Award,         hint: "Close as hired",        tone: "success" as const },
  { key: "REJECTED",    label: "Reject",             icon: XCircle,       hint: "Close as rejected",    tone: "danger"  as const },
];

export function StageActions({ applicationId, current }: { applicationId: string; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);

  function move(stage: string) {
    setMessage(null);
    setError(null);
    setPendingKey(stage);
    startTransition(async () => {
      const result = await moveStage(applicationId, stage);
      setPendingKey(null);
      if (result.ok) {
        setMessage(result.message ?? "Stage updated");
        router.refresh();
        setTimeout(() => setMessage(null), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {flow.map((f) => {
          const Icon = f.icon;
          const active = current === f.key;
          const disabled = active || pending;
          const tone =
            f.tone === "lagoon" ? "hover:border-lagoon-500 hover:bg-lagoon-50" :
            f.tone === "gilt"   ? "hover:border-gilt-500 hover:bg-gilt-50" :
            f.tone === "success"? "hover:border-success-500 hover:bg-success-50" :
                                  "hover:border-danger-400 hover:bg-danger-50";
          return (
            <button
              key={f.key}
              type="button"
              disabled={disabled}
              onClick={() => move(f.key)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                active ? "border-ink-900 bg-ink-50" : `border-ink-200 ${tone}`
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-parchment text-ink-700">
                {pendingKey === f.key ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <Check className="h-4 w-4 text-lagoon-600" strokeWidth={2.5} /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
              </span>
              <div className="min-w-0">
                <p className="font-sans text-[13.5px] font-semibold text-ink-900">{f.label}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">
                  {active ? "Current stage" : f.hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {message ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-lagoon-100 bg-lagoon-50 px-3 py-2 text-[12.5px] text-lagoon-800">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-[12.5px] text-danger-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
