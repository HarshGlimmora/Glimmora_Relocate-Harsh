import type { Metadata } from "next";
import {
  ShieldCheck, FileCheck, AlertCircle, CheckCircle2, Building2, FileText, User, Shield,
} from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { cn, relativeTime } from "@/lib/utils";
import { DocUploader, SubmitButton } from "./doc-uploader";

export const metadata: Metadata = { title: "Verification" };

const docs = [
  { kind: "CERT_OF_INCORPORATION", label: "Certificate of incorporation", hint: "Official company registry extract (HRB, KBIS, CoI, etc.)", Icon: Building2 },
  { kind: "VAT",                   label: "VAT / Tax registration",       hint: "VAT number or equivalent tax ID certificate",               Icon: FileText   },
  { kind: "PROOF_OF_ADDRESS",      label: "Proof of address",              hint: "Utility bill or office lease dated in last 3 months",        Icon: FileCheck  },
  { kind: "DIRECTOR_ID",           label: "Director ID",                   hint: "Government ID for the primary account owner",                Icon: User       },
  { kind: "INSURANCE",             label: "Liability insurance",           hint: "Professional indemnity — minimum €1M cover",                 Icon: Shield     },
] as const;

export default async function VerificationPage() {
  const { partner } = await requirePartnerSession();

  const uploaded = await prisma.kybDocument.findMany({
    where: { partnerId: partner.id },
    orderBy: { uploadedAt: "desc" },
  });
  const byKind = new Map(uploaded.map((d) => [d.kind, d]));
  const completed = docs.filter((d) => byKind.has(d.kind)).length;
  const pct = Math.round((completed / docs.length) * 100);

  const statusMap = {
    PENDING:   { cls: "bg-ink-50 border-ink-200 text-ink-700",                  label: "Not started", Icon: AlertCircle },
    IN_REVIEW: { cls: "bg-gilt-50 border-gilt-200 text-gilt-800",               label: "In review",   Icon: AlertCircle },
    APPROVED:  { cls: "bg-success-50 border-success-200 text-success-700",      label: "Approved",    Icon: CheckCircle2 },
    REJECTED:  { cls: "bg-danger-50 border-danger-200 text-danger-700",         label: "Rejected",    Icon: AlertCircle },
  } as const;
  const state = statusMap[partner.verificationStatus as keyof typeof statusMap] ?? statusMap.PENDING;
  const SIcon = state.Icon;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Verification · KYB</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Prove you are who you say you are.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Every partner on Glimmora is KYB-verified. Customers see a badge, trust increases, conversion follows.
        </p>
      </header>

      {/* Status hero */}
      <section className="mb-8 relative overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-plum-500/25 blur-[70px]" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-plum-300">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/60">{partner.name}</p>
                <h2 className="mt-1 font-sans text-[24px] font-semibold tracking-tight">
                  {partner.verificationStatus === "APPROVED" ? "Verified · live across the platform."
                   : partner.verificationStatus === "IN_REVIEW" ? "Under review. We'll get back to you soon."
                   : partner.verificationStatus === "REJECTED" ? "Additional info required."
                   : "Complete the checklist to go live."}
                </h2>
              </div>
            </div>
            {partner.verificationStatus !== "APPROVED" ? (
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-[40px] font-semibold leading-none tracking-[-0.025em]">{completed}</span>
                  <span className="text-[14px] text-white/60">/ {docs.length} documents</span>
                </div>
                <div className="mt-3 h-[4px] w-full max-w-md rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-plum-400 to-plum-300"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-5 text-[13.5px] text-white/70 max-w-md">
                Approved {partner.kybApprovedAt ? relativeTime(partner.kybApprovedAt) : ""}. Re-submission only needed if your legal details change.
              </p>
            )}
          </div>

          <div>
            <p className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold", state.cls)}>
              <SIcon className="h-3 w-3" /> {state.label}
            </p>
          </div>
        </div>
      </section>

      {/* Document checklist */}
      <section className="mb-8 rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-100 text-plum-700">
            <FileCheck className="h-[16px] w-[16px]" strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Checklist</p>
            <h2 className="mt-0.5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Required documents</h2>
          </div>
        </div>

        <div className="space-y-2.5">
          {docs.map((d) => (
            <DocUploader
              key={d.kind}
              kind={d.kind}
              label={d.label}
              hint={d.hint}
              uploaded={byKind.has(d.kind)}
            />
          ))}
        </div>

        {partner.verificationStatus === "PENDING" || partner.verificationStatus === "REJECTED" ? (
          <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-5">
            <p className="text-[12.5px] text-ink-600">
              Need at least 3 documents uploaded to submit for review.
            </p>
            <SubmitButton disabled={completed < 3} partnerName={partner.name} />
          </div>
        ) : null}
      </section>

      {/* Submission history */}
      {uploaded.length > 0 ? (
        <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Submission history</p>
          <ul className="mt-4 divide-y divide-ink-100">
            {uploaded.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <p className="truncate font-sans font-semibold text-ink-900">{d.kind.replace(/_/g, " ").toLowerCase()}</p>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-ink-500">{d.fileName}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium",
                    d.status === "APPROVED" ? "bg-success-50 border-success-200 text-success-700" :
                    d.status === "REJECTED" ? "bg-danger-50 border-danger-200 text-danger-700" :
                    "bg-ink-50 border-ink-200 text-ink-600",
                  )}>
                    {d.status}
                  </span>
                  <span className="font-mono text-[10px] text-ink-500">{relativeTime(d.uploadedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
