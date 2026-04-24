import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Upload, ShieldCheck, Clock, AlertTriangle, Check, ArrowUpRight, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Documents" };

const checklist = [
  { t: "Valid passport (6+ months)",       status: "ok",        detail: "Expires Mar 2030",            cat: "Identity"   },
  { t: "University degree certificate",    status: "attention", detail: "Apostille translation pending", cat: "Education"  },
  { t: "Employment reference letters",     status: "ok",        detail: "3 of 3 uploaded",              cat: "Work"       },
  { t: "Bank statements (last 6 months)",  status: "pending",   detail: "Not uploaded yet",             cat: "Financial"  },
  { t: "Marriage certificate",             status: "pending",   detail: "Required for family visa",     cat: "Family"     },
  { t: "Police clearance (India)",         status: "pending",   detail: "Order 6 weeks ahead",          cat: "Compliance" },
];

export default function DocumentsPage() {
  const done = checklist.filter(c => c.status === "ok").length;
  const pct = Math.round((done / checklist.length) * 100);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Documents</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            One vault. Every document. <br className="hidden md:block" />
            Zero missed deadlines.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Checklist generated from your country and visa route. AI validates each upload. Auto form-fill into gov portals when available.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Document upload arrives with W3 (KMS-encrypted vault)."
          className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white pl-5 pr-4 text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
        >
          <Upload className="h-4 w-4" /> Upload document
          <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W3</span>
        </button>
      </header>

      {/* Hero summary */}
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-8 text-parchment md:p-10">
          <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gilt-500/20 blur-[80px]" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-300">
                  Germany · EU Blue Card · Family
                </span>
              </div>
              <p className="mt-5 font-sans text-[26px] font-semibold leading-[1.2] tracking-[-0.015em]">
                You're <span className="text-gilt-300">{pct}%</span> of the way through your document checklist.
              </p>
              <div className="mt-4 h-[3px] w-full max-w-md rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-gilt-400 to-gilt-300" style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-white/75">
                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lagoon-300" strokeWidth={2.5} /> {done} complete</span>
                <span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-gilt-300" strokeWidth={2} /> 1 needs attention</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-lagoon-300" strokeWidth={2} /> KMS-encrypted vault</span>
              </div>
            </div>
            {/* Progress ring */}
            <ProgressRing pct={pct} />
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="mb-10">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Dynamic checklist</span>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {checklist.map((c, i) => {
              const ok = c.status === "ok";
              const attn = c.status === "attention";
              return (
                <li key={i} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50/60 md:gap-6 md:px-6">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    ok ? "bg-lagoon-500 text-white" :
                    attn ? "bg-gilt-500 text-white" :
                    "border border-ink-200 bg-parchment text-ink-500"
                  }`}>
                    {ok ? <Check className="h-4 w-4" strokeWidth={3} /> :
                     attn ? <AlertTriangle className="h-4 w-4" strokeWidth={2.25} /> :
                     <FileText className="h-4 w-4" strokeWidth={1.75} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-[14.5px] font-semibold text-ink-900">{c.t}</p>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 font-medium">{c.cat}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-500">{c.detail}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] font-medium ${
                    ok ? "bg-lagoon-50 border border-lagoon-100 text-lagoon-800" :
                    attn ? "bg-gilt-50 border border-gilt-200 text-gilt-800" :
                    "bg-ink-50 border border-ink-200 text-ink-700"
                  }`}>
                    {ok ? "Complete" : attn ? "Attention" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Empty vault */}
      <section className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
          <Upload className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
        </div>
        <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">Your vault is empty.</h3>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
          Drag and drop or use Upload. Each document is encrypted, OCR'd, and validated before it lands.
        </p>
        <button
          type="button"
          disabled
          title="Document upload arrives with W3 (KMS-encrypted vault)."
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-ink-200 bg-white pl-5 pr-4 text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
        >
          <Upload className="h-4 w-4" /> Upload your first document
          <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W3</span>
        </button>
      </section>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const c = 2 * Math.PI * 52;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="url(#docRing)" strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
        <defs>
          <linearGradient id="docRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EFCD65" />
            <stop offset="100%" stopColor="#CF9B1E" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-sans text-[40px] font-semibold leading-none tracking-[-0.04em]">{pct}<span className="text-[16px] text-white/50">%</span></p>
      </div>
    </div>
  );
}
