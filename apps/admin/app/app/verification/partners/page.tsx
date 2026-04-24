import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldX, Clock, FileText, CheckCircle2, XCircle, AlertTriangle, Building2 } from "lucide-react";
import { listPartners, listPartnerKybDocs } from "@/lib/xdb";
import { VerdictButtons } from "./verdict-buttons";

export const metadata: Metadata = { title: "Partner verification" };

const KIND_LABEL: Record<string, string> = {
  CERT_OF_INCORPORATION: "Certificate of incorporation",
  VAT: "VAT / tax registration",
  PROOF_OF_ADDRESS: "Proof of address",
  DIRECTOR_ID: "Director ID",
  INSURANCE: "Liability insurance",
};

function ago(ms: number | null | undefined) {
  if (!ms) return "—";
  const d = Math.round((Date.now() - ms) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} months ago`;
}

export default function PartnerVerificationPage() {
  const partners = listPartners();

  const pending = partners.filter((p) => p.verificationStatus === "PENDING" || p.verificationStatus === "IN_REVIEW");
  const approved = partners.filter((p) => p.verificationStatus === "APPROVED");
  const rejected = partners.filter((p) => p.verificationStatus === "REJECTED");

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Verification & Trust</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Partner KYB queue.
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
          Every KYB submission from the Partner portal lands here. Approve unlocks listings; reject closes the application with a documented reason.
        </p>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={pending.length}  l="Awaiting review" sub="PENDING or IN_REVIEW" tone="gilt" />
        <Kpi n={approved.length} l="Approved"        sub="live in Marketplace" tone="lagoon" />
        <Kpi n={rejected.length} l="Rejected"        sub="with reason" />
        <Kpi n={partners.length} l="All partners"    sub="platform lifetime" />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Queue" />
        {pending.length === 0 ? (
          <EmptyState title="Nothing pending." body="All partners reviewed — check back when new KYB submissions arrive." />
        ) : (
          <ul className="space-y-4">
            {pending.map((p) => {
              const docs = listPartnerKybDocs(p.id);
              return (
                <li key={p.id} className="rounded-2xl border border-ink-200 bg-white p-6 md:p-7">
                  <div className="flex flex-wrap items-start gap-6">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-sans text-[18px] font-semibold tracking-tight text-ink-900">{p.name}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${statusCls(p.verificationStatus)}`}>
                          <StatusIcon status={p.verificationStatus} /> {p.verificationStatus}
                        </span>
                        <span className="rounded-full bg-ink-50 border border-ink-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-700">
                          {p.category}
                        </span>
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-ink-500 font-mono uppercase tracking-[0.18em]">
                        <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{p.hqCity ? `${p.hqCity}, ${p.hqCountry}` : p.hqCountry ?? "—"}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Submitted {ago(p.kybSubmittedAt)}</span>
                      </p>

                      <div className="mt-5">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Documents on file</p>
                        {docs.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-ink-200 bg-parchment/40 px-4 py-3 text-[12.5px] text-ink-500">
                            No KYB documents submitted.
                          </p>
                        ) : (
                          <ul className="grid gap-2 md:grid-cols-2">
                            {docs.map((d) => (
                              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-parchment/40 px-3 py-2.5">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${docCls(d.status)}`}>
                                  <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-sans text-[13px] font-semibold text-ink-900">{KIND_LABEL[d.kind] ?? d.kind}</p>
                                  <p className="truncate text-[11.5px] text-ink-500">{d.fileName}</p>
                                </div>
                                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">{d.status}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <VerdictButtons partnerId={p.id} currentStatus={p.verificationStatus} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SubList
          title="Recently approved"
          icon={<CheckCircle2 className="h-4 w-4 text-lagoon-700" />}
          rows={approved.slice(0, 6).map((p) => ({
            id: p.id,
            title: p.name,
            sub: `${p.category} · ${p.hqCity ?? "—"}, ${p.hqCountry ?? "—"}`,
            meta: p.kybApprovedAt ? ago(p.kybApprovedAt) : "—",
          }))}
        />
        <SubList
          title="Rejected submissions"
          icon={<XCircle className="h-4 w-4 text-danger-500" />}
          rows={rejected.slice(0, 6).map((p) => ({
            id: p.id,
            title: p.name,
            sub: p.kybRejectedReason ?? "No reason on file",
            meta: "",
          }))}
        />
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function Kpi({ n, l, sub, tone }: { n: number; l: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[36px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
        <ShieldCheck className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-sans text-[19px] font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-500">{body}</p>
    </div>
  );
}

function SubList({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: { id: string; title: string; sub: string; meta: string }[] }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="flex items-center gap-2.5">
        {icon}
        <h3 className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-ink-200 bg-parchment/40 p-4 text-[13px] text-ink-500">None on file.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 border-b border-ink-100 pb-2.5 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate font-sans text-[13.5px] font-semibold text-ink-900">{r.title}</p>
                <p className="truncate text-[12px] text-ink-500">{r.sub}</p>
              </div>
              {r.meta ? <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">{r.meta}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusCls(s: string): string {
  switch (s) {
    case "APPROVED": return "border-lagoon-200 bg-lagoon-50 text-lagoon-800";
    case "REJECTED": return "border-danger-200 bg-danger-50 text-danger-700";
    case "IN_REVIEW": return "border-gilt-200 bg-gilt-50 text-gilt-800";
    default: return "border-ink-200 bg-ink-50 text-ink-700";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "APPROVED") return <ShieldCheck className="h-3 w-3" strokeWidth={2.25} />;
  if (status === "REJECTED") return <ShieldX className="h-3 w-3" strokeWidth={2.25} />;
  if (status === "IN_REVIEW") return <Clock className="h-3 w-3" strokeWidth={2.25} />;
  return <AlertTriangle className="h-3 w-3" strokeWidth={2.25} />;
}

function docCls(status: string): string {
  switch (status) {
    case "APPROVED": return "bg-lagoon-500 text-white";
    case "REJECTED": return "bg-danger-500 text-white";
    default: return "border border-ink-200 bg-parchment text-ink-500";
  }
}
