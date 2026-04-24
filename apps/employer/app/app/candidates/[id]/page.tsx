import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Check,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { relativeTime, initials } from "@/lib/utils";
import { StageActions } from "./stage-actions";
import { NotesForm } from "./notes-form";

export const metadata: Metadata = { title: "Candidate" };

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const m = await prisma.membership.findFirst({ where: { userId: session.user.id } });
  if (!m) return null;

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { id: true, title: true, companyId: true, location: true, visaTier: true, salaryMin: true, salaryMax: true, currency: true } },
      interviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!app || app.job.companyId !== m.companyId) notFound();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      {/* Back */}
      <Link href="/app/candidates" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to pipeline
      </Link>

      {/* ============================================================ */}
      {/* HERO — dark card with name + score + current stage             */}
      {/* ============================================================ */}
      <section className="relative mb-8 overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10">
        <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lagoon-500/25 blur-[80px]" />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <StageBadge stage={app.stage} />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/50 font-medium">
                {app.job.title}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-lagoon-300 to-lagoon-600 text-[22px] font-semibold text-ink-900">
                {initials(app.candidateName)}
              </span>
              <div>
                <h1 className="font-sans text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] text-parchment">
                  {app.candidateName}
                </h1>
                <p className="mt-1 flex items-center gap-3 text-[13.5px] text-white/60">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> {app.candidateEmail}</span>
                  <span className="text-white/20">·</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {app.currentCountry ?? "—"} {app.passport ? `(${app.passport} passport)` : ""}</span>
                </p>
              </div>
            </div>
          </div>
          {/* Match score ring */}
          <ScoreRing score={app.matchScore} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* STAGE ACTIONS — move buttons                                  */}
      {/* ============================================================ */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
          <span className="h-px flex-1 bg-ink-200" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Stage actions</span>
        </div>
        <StageActions applicationId={app.id} current={app.stage} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT column — profile & visa */}
        <div className="space-y-6">
          {/* Profile details */}
          <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Digital Twin</p>
            <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Profile</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Detail icon={Briefcase} label="Profession" value={app.profession ?? "—"} />
              <Detail icon={Calendar} label="Experience"  value={app.yearsExp ? `${app.yearsExp} years` : "—"} />
              <Detail icon={MapPin}   label="Based in"    value={app.currentCountry ?? "—"} />
              <Detail icon={ShieldCheck} label="Passport" value={app.passport ?? "—"} />
            </div>
          </section>

          {/* Visa fit analysis */}
          <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Visa compliance</p>
            <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Eligibility analysis</h2>

            <VisaFit fit={app.visaFit} visaTier={app.job.visaTier} passport={app.passport} />

            <div className="hairline my-6" />

            <p className="mono-label mb-3">Role context</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-200 bg-parchment p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Role</p>
                <p className="mt-1 font-sans text-[14px] font-semibold text-ink-900">{app.job.title}</p>
              </div>
              <div className="rounded-xl border border-ink-200 bg-parchment p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Location</p>
                <p className="mt-1 font-sans text-[14px] font-semibold text-ink-900">{app.job.location ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-ink-200 bg-parchment p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Visa route</p>
                <p className="mt-1 font-sans text-[14px] font-semibold text-ink-900">{app.job.visaTier ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-ink-200 bg-parchment p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Salary band</p>
                <p className="mt-1 font-sans text-[14px] font-semibold text-ink-900">
                  {app.job.salaryMin ? `${app.job.currency} ${app.job.salaryMin / 1000}k` : "—"}
                  {app.job.salaryMax ? `–${app.job.salaryMax / 1000}k` : ""}
                </p>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Recruiter notes</p>
            <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Internal notes</h2>
            <p className="mt-2 text-[13px] text-ink-500">Only visible to your team. Not shared with the candidate.</p>
            <div className="mt-5">
              <NotesForm applicationId={app.id} initialValue={app.notes ?? ""} />
            </div>
          </section>
        </div>

        {/* RIGHT column — score breakdown + timeline */}
        <aside className="space-y-6">
          {/* Score breakdown */}
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Match breakdown</p>
            <h3 className="mt-2 font-sans text-[17px] font-semibold tracking-tight text-ink-900">Why {app.matchScore}</h3>
            <div className="mt-5 space-y-4">
              <Bar label="Role fit"          value={Math.min(100, app.matchScore + 3)} tone="lagoon" />
              <Bar label="Visa fit"           value={app.visaFit === "yes" ? 100 : app.visaFit === "maybe" ? 55 : 10} tone={app.visaFit === "yes" ? "lagoon" : app.visaFit === "maybe" ? "gilt" : "danger"} />
              <Bar label="Experience band"    value={Math.min(100, (app.yearsExp ?? 0) * 12 + 20)} tone="ink" />
              <Bar label="Relocation readiness" value={72} tone="ink" />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Timeline</p>
            <h3 className="mt-2 font-sans text-[17px] font-semibold tracking-tight text-ink-900">Activity</h3>
            <ol className="mt-5 space-y-4">
              <TimelineItem
                title={`Stage · ${app.stage.toLowerCase()}`}
                meta={relativeTime(app.updatedAt)}
                icon={Clock}
                tone="gilt"
              />
              {app.interviews.map((iv) => (
                <TimelineItem
                  key={iv.id}
                  title={`${iv.kind.toLowerCase()} interview`}
                  meta={iv.scheduledAt ? relativeTime(iv.scheduledAt) : "Not yet scheduled"}
                  icon={Calendar}
                  tone="ink"
                />
              ))}
              <TimelineItem
                title="Application received"
                meta={relativeTime(app.createdAt)}
                icon={Check}
                tone="lagoon"
              />
            </ol>
          </div>

          {/* Copilot hint */}
          <div className="rounded-2xl border border-lagoon-100 bg-lagoon-50 p-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lagoon-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <p className="mt-4 font-sans text-[14px] font-semibold text-ink-900">
              Copilot summary
            </p>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-700">
              Strong fit for the role · passport clears your policy · ready to schedule a first-round interview. Prep sheet auto-generated from the Twin.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --------------------------------------------------- */
/* Sub-components                                      */
/* --------------------------------------------------- */

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    NEW:         { label: "New",          cls: "bg-white/10 text-white/80" },
    SHORTLISTED: { label: "Shortlisted",  cls: "bg-lagoon-500/25 text-lagoon-300" },
    INTERVIEW:   { label: "Interview",    cls: "bg-gilt-500/25 text-gilt-300" },
    OFFER:       { label: "Offer",        cls: "bg-success-500/25 text-success-300" },
    HIRED:       { label: "Hired",        cls: "bg-success-500/35 text-success-300" },
    REJECTED:    { label: "Rejected",     cls: "bg-danger-500/25 text-danger-300" },
  };
  const v = map[stage] ?? map.NEW;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] font-medium ${v.cls}`}>
      {v.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const c = 2 * Math.PI * 48;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="relative mx-auto h-[140px] w-[140px] md:h-[160px] md:w-[160px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="url(#cScore)" strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
        <defs>
          <linearGradient id="cScore" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#68C2B4" />
            <stop offset="100%" stopColor="#248C7C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-sans text-[48px] font-semibold leading-none tracking-[-0.03em] text-parchment">
          {score}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">
          match / 100
        </p>
      </div>
    </div>
  );
}

function VisaFit({ fit, visaTier, passport }: { fit: string; visaTier: string | null; passport: string | null }) {
  if (fit === "yes") {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-lagoon-100 bg-lagoon-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lagoon-700" strokeWidth={2} />
        <div>
          <p className="font-sans text-[14.5px] font-semibold text-lagoon-900">Visa-ready</p>
          <p className="mt-1 text-[13px] leading-[1.55] text-ink-700">
            {passport ? `${passport} passport` : "This candidate"} clears the {visaTier ?? "sponsorship"} bar for this role. No blocker.
          </p>
        </div>
      </div>
    );
  }
  if (fit === "maybe") {
    return (
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-gilt-200 bg-gilt-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gilt-700" strokeWidth={2} />
        <div>
          <p className="font-sans text-[14.5px] font-semibold text-gilt-900">Check needed</p>
          <p className="mt-1 text-[13px] leading-[1.55] text-ink-700">
            Edge case — possibly eligible depending on current consular processing and recent salary thresholds. Flag for legal review.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-danger-100 bg-danger-50 p-4">
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-700" strokeWidth={2} />
      <div>
        <p className="font-sans text-[14.5px] font-semibold text-danger-800">Visa blocked</p>
        <p className="mt-1 text-[13px] leading-[1.55] text-ink-700">
          {passport ? `${passport} passport` : "Candidate"} doesn't clear your current sponsorship policy for this route. Recommend closing as "Rejected · visa".
        </p>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="mono-label mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3" strokeWidth={2} />
        {label}
      </p>
      <p className="font-sans text-[15px] font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "lagoon" | "gilt" | "ink" | "danger" }) {
  const fill = tone === "lagoon" ? "bg-lagoon-500" : tone === "gilt" ? "bg-gilt-500" : tone === "danger" ? "bg-danger-500" : "bg-ink-700";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500 font-medium">{label}</span>
        <span className="font-sans text-[13px] font-semibold text-ink-900">{Math.round(value)}</span>
      </div>
      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full ${fill} transition-all`} style={{ width: `${Math.max(3, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function TimelineItem({ title, meta, icon: Icon, tone }: { title: string; meta: string; icon: any; tone: "lagoon" | "gilt" | "ink" }) {
  const bg =
    tone === "lagoon" ? "bg-lagoon-100 text-lagoon-700" :
    tone === "gilt" ? "bg-gilt-100 text-gilt-700" :
    "bg-ink-100 text-ink-700";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-[13.5px] font-medium text-ink-900 capitalize">{title}</p>
        <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
          {meta}
        </p>
      </div>
    </li>
  );
}
