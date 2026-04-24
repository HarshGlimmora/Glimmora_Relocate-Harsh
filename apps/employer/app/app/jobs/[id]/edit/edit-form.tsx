"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { updateJob } from "../../actions";

type Job = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  remote: string | null;
  seniority: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  description: string | null;
  requirements: string | null;
  visaSponsorship: boolean;
  visaTier: string | null;
  eligiblePassports: string[];
};

const passportOptions = [
  { code: "IN", name: "India" }, { code: "BR", name: "Brazil" }, { code: "TR", name: "Türkiye" },
  { code: "UA", name: "Ukraine" }, { code: "NG", name: "Nigeria" }, { code: "EG", name: "Egypt" },
  { code: "PH", name: "Philippines" }, { code: "ID", name: "Indonesia" }, { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" }, { code: "KE", name: "Kenya" }, { code: "VN", name: "Vietnam" },
];

const tierOptions = [
  "EU Blue Card", "HSM", "Tech Visa", "Critical Skills", "ICT", "Sponsor Licence",
];

export function EditJobForm({ job }: { job: Job }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState(job.title);
  const [department, setDepartment] = React.useState(job.department ?? "");
  const [location, setLocation] = React.useState(job.location ?? "");
  const [remote, setRemote] = React.useState(job.remote ?? "");
  const [seniority, setSeniority] = React.useState(job.seniority ?? "");
  const [employmentType, setEmploymentType] = React.useState(job.employmentType ?? "");
  const [salaryMin, setSalaryMin] = React.useState(job.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = React.useState(job.salaryMax?.toString() ?? "");
  const [currency, setCurrency] = React.useState(job.currency);
  const [description, setDescription] = React.useState(job.description ?? "");
  const [requirements, setRequirements] = React.useState(job.requirements ?? "");
  const [visaSponsorship, setVisaSponsorship] = React.useState(job.visaSponsorship);
  const [visaTier, setVisaTier] = React.useState(job.visaTier ?? "");
  const [passports, setPassports] = React.useState<string[]>(job.eligiblePassports);

  function togglePassport(code: string) {
    setPassports((p) => (p.includes(code) ? p.filter((x) => x !== code) : [...p, code]));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateJob({
        jobId: job.id,
        title: title.trim(),
        department: department.trim() || null,
        location: location.trim() || null,
        remote: remote || null,
        seniority: seniority || null,
        employmentType: employmentType || null,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
        salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
        currency,
        description: description.trim() || null,
        requirements: requirements.trim() || null,
        visaSponsorship,
        visaTier: visaTier || null,
        eligiblePassports: passports,
      });
      if (res.ok) {
        toast.success("Role updated", { description: `Changes to "${title}" are live.` });
        router.push(`/app/jobs/${job.id}`);
        router.refresh();
      } else {
        toast.error("Could not save", { description: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section num="01" label="Role basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *"><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
          <Field label="Department"><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Platform" /></Field>
          <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Berlin, DE" /></Field>
          <Field label="Work mode">
            <Select value={remote} onChange={(e) => setRemote(e.target.value)} options={[{v:"on-site",l:"On-site"},{v:"hybrid",l:"Hybrid"},{v:"remote",l:"Remote"}]} />
          </Field>
          <Field label="Seniority">
            <Select value={seniority} onChange={(e) => setSeniority(e.target.value)} options={[{v:"junior",l:"Junior"},{v:"mid",l:"Mid"},{v:"senior",l:"Senior"},{v:"staff",l:"Staff"},{v:"principal",l:"Principal"}]} />
          </Field>
          <Field label="Employment">
            <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} options={[{v:"full_time",l:"Full-time"},{v:"part_time",l:"Part-time"},{v:"contract",l:"Contract"}]} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Salary min"><Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="85000" /></Field>
          <Field label="Salary max"><Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="110000" /></Field>
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{v:"EUR",l:"EUR"},{v:"USD",l:"USD"},{v:"GBP",l:"GBP"}]} />
          </Field>
        </div>
      </Section>

      <Section num="02" label="Visa policy" tone="lagoon">
        <div className="rounded-xl border border-lagoon-100 bg-lagoon-50/60 px-4 py-3 flex items-start gap-3 text-[13px] text-lagoon-900">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Visa-aware matching</strong> — candidates only see this role if their passport is on the eligible list. The Copilot factors this into rankings.
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3">
          <div>
            <p className="font-sans text-[13.5px] font-semibold text-ink-900">Sponsor visas for this role</p>
            <p className="mt-0.5 text-[12px] text-ink-500">If off, only candidates with local work rights will see this role.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visaSponsorship}
            onClick={() => setVisaSponsorship(!visaSponsorship)}
            className={`relative h-6 w-11 rounded-full transition-colors ${visaSponsorship ? "bg-lagoon-500" : "bg-ink-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${visaSponsorship ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className={visaSponsorship ? "space-y-4" : "space-y-4 opacity-50 pointer-events-none"}>
          <Field label="Visa tier">
            <div className="flex flex-wrap gap-1.5">
              {tierOptions.map((t) => {
                const on = visaTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVisaTier(on ? "" : t)}
                    className={`rounded-full border px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      on ? "border-ink-900 bg-ink-900 text-parchment" : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>

          <div>
            <p className="mono-label mb-2">Eligible passports</p>
            <div className="flex flex-wrap gap-1.5">
              {passportOptions.map((p) => {
                const on = passports.includes(p.code);
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => togglePassport(p.code)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
                      on
                        ? "border-lagoon-500 bg-lagoon-50 text-lagoon-900"
                        : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                    }`}
                  >
                    <span className="font-mono text-[10px] font-semibold">{p.code}</span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section num="03" label="Description">
        <Field label="About the role">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        </Field>
        <Field label="Requirements">
          <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={5} />
        </Field>
      </Section>

      <div className="flex items-center justify-between border-t border-ink-200 pt-6">
        <Link href={`/app/jobs/${job.id}`} className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">Cancel</Link>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="btn-accent inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-5 text-[13.5px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" strokeWidth={2.5} /> Save changes</>}
        </button>
      </div>
    </form>
  );
}

function Section({ num, label, tone, children }: { num: string; label: string; tone?: "lagoon"; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className={`font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium ${tone === "lagoon" ? "text-lagoon-700" : "text-ink-700"}`}>{label}</span>
      </div>
      <div className="space-y-4 rounded-2xl border border-ink-200 bg-white p-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono-label mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-lagoon-600 focus:ring-lagoon-600/15" />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-lagoon-600 focus:ring-lagoon-600/15 resize-y" />;
}

function Select({ options, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] }) {
  return (
    <select {...rest} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-lagoon-600 focus:ring-lagoon-600/15">
      <option value="">—</option>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
