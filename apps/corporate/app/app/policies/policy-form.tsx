"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPolicy, updatePolicy } from "./actions";

type Mode = "create" | "edit";
type Initial = {
  id?: string;
  name: string;
  tier: string;
  relocationCap: string;
  housingCap: string;
  lumpSum: string;
  currency: string;
  shippingIncluded: boolean;
  active: boolean;
  description: string;
};

const empty: Initial = {
  name: "",
  tier: "STANDARD",
  relocationCap: "",
  housingCap: "",
  lumpSum: "",
  currency: "EUR",
  shippingIncluded: true,
  active: true,
  description: "",
};

export function PolicyForm({ mode, initial }: { mode: Mode; initial?: Initial }) {
  const router = useRouter();
  const [v, setV] = React.useState<Initial>(initial ?? empty);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Booleans handling
    fd.set("shippingIncluded", v.shippingIncluded ? "true" : "false");
    fd.set("active", v.active ? "true" : "false");

    startTransition(async () => {
      const res = mode === "create"
        ? await createPolicy(fd)
        : await updatePolicy(v.id!, fd);
      if (res.ok) {
        toast.success(mode === "create" ? `"${v.name}" created` : `"${v.name}" updated`, {
          description: v.active ? "Employees can be assigned this policy now." : "Saved as inactive.",
        });
        router.push("/app/policies");
        router.refresh();
      } else {
        toast.error("Could not save", { description: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section label="Identity">
        <Field label="Name *">
          <Input name="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required minLength={2} />
        </Field>
        <Field label="Tier">
          <Select name="tier" value={v.tier} onChange={(e) => setV({ ...v, tier: e.target.value })} options={[
            { v: "STANDARD", l: "Standard" },
            { v: "EXEC", l: "Executive" },
            { v: "EARLY_CAREER", l: "Early career" },
            { v: "INTERN", l: "Intern / temporary" },
          ]} />
        </Field>
        <Field label="Description">
          <Textarea name="description" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} rows={2} placeholder="One-line summary employees and managers will see." />
        </Field>
      </Section>

      <Section label="Budget">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Relocation cap *">
            <Input name="relocationCap" type="number" min={0} value={v.relocationCap} onChange={(e) => setV({ ...v, relocationCap: e.target.value })} required placeholder="8000" />
          </Field>
          <Field label="Housing cap">
            <Input name="housingCap" type="number" min={0} value={v.housingCap} onChange={(e) => setV({ ...v, housingCap: e.target.value })} placeholder="3000" />
          </Field>
          <Field label="Lump sum">
            <Input name="lumpSum" type="number" min={0} value={v.lumpSum} onChange={(e) => setV({ ...v, lumpSum: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Currency">
            <Select name="currency" value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })} options={[
              { v: "EUR", l: "EUR" }, { v: "USD", l: "USD" }, { v: "GBP", l: "GBP" },
            ]} />
          </Field>
          <div className="flex items-center md:col-span-2">
            <Toggle label="Shipping included" checked={v.shippingIncluded} onChange={(b) => setV({ ...v, shippingIncluded: b })} />
          </div>
        </div>
      </Section>

      <Section label="Visibility">
        <Toggle label="Policy is active" desc="Only active policies can be assigned to employees." checked={v.active} onChange={(b) => setV({ ...v, active: b })} />
      </Section>

      <div className="flex items-center justify-between border-t border-ink-200 pt-6">
        <Link href="/app/policies" className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">Cancel</Link>
        <button
          type="submit"
          disabled={pending || !v.name.trim() || !v.relocationCap}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-moss-600 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-moss-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" strokeWidth={2.5} /> {mode === "create" ? "Create policy" : "Save changes"}</>}
        </button>
      </div>
    </form>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</div>
      <div className="space-y-4 rounded-2xl border border-ink-200 bg-white p-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-moss-600 focus:ring-moss-600/15" />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-moss-600 focus:ring-moss-600/15 resize-y" />;
}

function Select({ options, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] }) {
  return (
    <select {...rest} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-moss-600 focus:ring-moss-600/15">
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex w-full items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="font-sans text-[13.5px] font-semibold text-ink-900">{label}</p>
        {desc ? <p className="mt-0.5 text-[12px] text-ink-500">{desc}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${checked ? "bg-moss-600" : "bg-ink-200"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </label>
  );
}
