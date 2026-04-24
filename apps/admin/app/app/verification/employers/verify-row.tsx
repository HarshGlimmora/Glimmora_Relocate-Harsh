"use client";

import * as React from "react";
import { BadgeCheck, ShieldX, Building2, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveEmployer, unverifyEmployer } from "../../actions";

export function EmployerVerifyRow({
  companyId,
  name,
  meta,
  hiresCount,
  createdLabel,
  verified,
  divider,
}: {
  companyId: string;
  name: string;
  meta: string;
  hiresCount: number;
  createdLabel: string;
  verified: boolean;
  divider: boolean;
}) {
  const [pending, startTransition] = React.useTransition();

  const toggle = () => {
    startTransition(async () => {
      try {
        if (verified) {
          await unverifyEmployer(companyId);
          toast.success(`${name} unverified.`);
        } else {
          await approveEmployer(companyId);
          toast.success(`${name} verified — can post visa-gated roles.`);
        }
      } catch {
        toast.error("Couldn't update. Please retry.");
      }
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 px-5 py-4 md:px-6 md:py-5 ${divider ? "border-b border-ink-100" : ""}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-parchment text-ink-700">
        <Building2 className="h-[16px] w-[16px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans text-[14.5px] font-semibold text-ink-900">{name}</p>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-lagoon-200 bg-lagoon-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-800 font-medium">
              <BadgeCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-gilt-200 bg-gilt-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800 font-medium">
              Pending
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{meta}</p>
      </div>

      <div className="hidden md:flex items-center gap-5 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Briefcase className="h-3 w-3" /> {hiresCount} {hiresCount === 1 ? "hire" : "hires"}
        </span>
        <span>Joined {createdLabel}</span>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold transition-colors disabled:opacity-60 ${
          verified
            ? "border border-ink-200 bg-white text-ink-700 hover:border-ink-400"
            : "bg-lagoon-600 text-white hover:bg-lagoon-700"
        }`}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : verified ? (
          <ShieldX className="h-3 w-3" strokeWidth={2.25} />
        ) : (
          <BadgeCheck className="h-3 w-3" strokeWidth={2.25} />
        )}
        {verified ? "Unverify" : "Verify"}
      </button>
    </div>
  );
}
