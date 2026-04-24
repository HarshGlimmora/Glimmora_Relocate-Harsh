import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Post a role" };

const passportOptions = [
  { code: "IN", name: "India" }, { code: "BR", name: "Brazil" }, { code: "TR", name: "Türkiye" },
  { code: "UA", name: "Ukraine" }, { code: "NG", name: "Nigeria" }, { code: "EG", name: "Egypt" },
  { code: "PH", name: "Philippines" }, { code: "ID", name: "Indonesia" }, { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" }, { code: "KE", name: "Kenya" }, { code: "VN", name: "Vietnam" },
];

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 md:px-10 md:py-14">
      <Link href="/app/jobs" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
      </Link>
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">New role</p>
        <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
          Post a visa-aware role.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-[1.6] text-ink-600">
          Define the role and your sponsorship reality. We'll match candidates whose passports actually clear your policy — no ghosting on sponsorship.
        </p>
      </header>

      <form className="space-y-8">
        {/* Basics */}
        <Section num="01" label="Role basics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title *" id="title"><Input id="title" name="title" placeholder="Senior Backend Engineer" /></Field>
            <Field label="Department" id="dept"><Input id="dept" name="department" placeholder="Platform" /></Field>
            <Field label="Location" id="loc"><Input id="loc" name="location" placeholder="Berlin, DE" /></Field>
            <Field label="Work mode" id="remote">
              <Select id="remote" name="remote" options={[{v:"on-site",l:"On-site"},{v:"hybrid",l:"Hybrid"},{v:"remote",l:"Remote"}]} />
            </Field>
            <Field label="Seniority" id="sen">
              <Select id="sen" name="seniority" options={[{v:"junior",l:"Junior"},{v:"mid",l:"Mid"},{v:"senior",l:"Senior"},{v:"staff",l:"Staff"},{v:"principal",l:"Principal"}]} />
            </Field>
            <Field label="Employment" id="emp">
              <Select id="emp" name="employmentType" options={[{v:"full_time",l:"Full-time"},{v:"part_time",l:"Part-time"},{v:"contract",l:"Contract"}]} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Salary min" id="smin"><Input id="smin" name="salaryMin" type="number" placeholder="85000" /></Field>
            <Field label="Salary max" id="smax"><Input id="smax" name="salaryMax" type="number" placeholder="110000" /></Field>
            <Field label="Currency" id="cur">
              <Select id="cur" name="currency" defaultValue="EUR" options={[{v:"EUR",l:"EUR"},{v:"USD",l:"USD"},{v:"GBP",l:"GBP"}]} />
            </Field>
          </div>
        </Section>

        {/* Visa */}
        <Section num="02" label="Visa policy" tone="lagoon">
          <div className="rounded-xl border border-lagoon-100 bg-lagoon-50/60 px-4 py-3 flex items-start gap-3 text-[13px] text-lagoon-900">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Visa-aware matching</strong> — candidates only see this role if their passport is on the eligible list.
              The Copilot factors this into rankings.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Visa tier" id="tier">
              <Select id="tier" name="visaTier" options={[
                {v:"EU Blue Card", l:"EU Blue Card"},
                {v:"HSM", l:"Highly Skilled Migrant (NL)"},
                {v:"Tech Visa", l:"Tech Visa (PT)"},
                {v:"Critical Skills", l:"Critical Skills (IE)"},
                {v:"ICT", l:"Intra-Company Transfer"},
              ]} />
            </Field>
            <Field label="Relocation benefit" id="reloc">
              <Input id="reloc" name="relocation" placeholder="up to €8,000" />
            </Field>
          </div>

          <div>
            <p className="mono-label mb-2">Eligible passports</p>
            <div className="flex flex-wrap gap-2">
              {passportOptions.map((p) => (
                <label key={p.code} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12.5px] transition-colors hover:border-ink-400 peer-checked:border-lagoon-500 peer-checked:bg-lagoon-50">
                  <input type="checkbox" name="eligiblePassports" value={p.code} className="peer sr-only" />
                  <span className="font-mono text-[10px] font-semibold text-ink-500">{p.code}</span>
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Description */}
        <Section num="03" label="Description">
          <Field label="About the role" id="desc">
            <Textarea id="desc" name="description" rows={5} placeholder="What the role does, who they'll work with, what they'll build." />
          </Field>
          <Field label="Requirements" id="req">
            <Textarea id="req" name="requirements" rows={5} placeholder="Years of experience, technical stack, must-haves vs nice-to-haves." />
          </Field>
        </Section>

        <div className="flex items-center justify-between border-t border-ink-200 pt-6">
          <Link href="/app/jobs" className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">Cancel</Link>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13.5px] font-medium">
              Save as draft
            </button>
            <button type="submit" className="btn-accent inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[13.5px] font-medium">
              <Plus className="h-4 w-4" /> Publish role
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 font-medium">
          Saves to DB · publishing API wires in next iteration
        </p>
      </form>
    </div>
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

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mono-label mb-1.5 block">{label}</label>
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
