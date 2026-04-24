"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { createListingAction, updateListingAction } from "./actions";

type Mode = "create" | "edit";

type ListingInit = {
  id?: string;
  kind: string;
  title: string;
  summary: string;
  city: string;
  country: string;
  address: string;
  priceMin: string;
  priceMax: string;
  currency: string;
  billingCycle: string;
  capacity: string;
  status: string;
};

const emptyInit: ListingInit = {
  kind: "APARTMENT",
  title: "",
  summary: "",
  city: "",
  country: "DE",
  address: "",
  priceMin: "",
  priceMax: "",
  currency: "EUR",
  billingCycle: "monthly",
  capacity: "1",
  status: "DRAFT",
};

export function ListingForm({ mode, initial }: { mode: Mode; initial?: ListingInit }) {
  const router = useRouter();
  const [values, setValues] = React.useState<ListingInit>(initial ?? emptyInit);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof ListingInit>(k: K, v: ListingInit[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (mode === "edit" && values.id) fd.set("id", values.id);

    startTransition(async () => {
      if (mode === "create") {
        const res = await createListingAction(fd);
        if (res.ok) {
          toast.success(`"${values.title}" ${values.status === "ACTIVE" ? "published" : "saved as draft"}`, {
            description: values.status === "ACTIVE" ? "Now visible in the customer marketplace." : "You can publish it anytime.",
          });
          router.push("/app/listings");
          router.refresh();
        } else {
          toast.error("Could not save", { description: res.error });
        }
      } else {
        const res = await updateListingAction(fd);
        if (res.ok) {
          toast.success(`"${values.title}" updated`);
          router.push("/app/listings");
          router.refresh();
        } else {
          toast.error("Could not save", { description: res.error });
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {mode === "edit" && values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Section num="01" label="Listing basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kind *">
            <Select name="kind" value={values.kind} onChange={(e) => set("kind", e.target.value)} options={[
              { v: "APARTMENT", l: "Apartment" },
              { v: "SCHOOL_SEAT", l: "School seat" },
              { v: "BANK_APPOINTMENT", l: "Bank appointment" },
              { v: "LEGAL_PACKAGE", l: "Legal package" },
              { v: "COWORKING", l: "Coworking" },
              { v: "LANGUAGE_COURSE", l: "Language course" },
            ]} />
          </Field>
          <Field label="Status">
            <Select name="status" value={values.status} onChange={(e) => set("status", e.target.value)} options={[
              { v: "DRAFT", l: "Draft (hidden)" },
              { v: "ACTIVE", l: "Active (public)" },
            ]} />
          </Field>
          <Field label="Title *" className="md:col-span-2">
            <Input name="title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Mitte 2BR — sunlit, fully furnished" required minLength={3} maxLength={160} />
          </Field>
          <Field label="Summary" className="md:col-span-2">
            <Textarea name="summary" value={values.summary} onChange={(e) => set("summary", e.target.value)} rows={3} placeholder="What makes this listing relocation-ready." />
          </Field>
        </div>
      </Section>

      <Section num="02" label="Location">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="City *">
            <Input name="city" value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Berlin" required />
          </Field>
          <Field label="Country (ISO-2) *">
            <Input name="country" value={values.country} onChange={(e) => set("country", e.target.value.toUpperCase())} maxLength={2} minLength={2} placeholder="DE" required />
          </Field>
          <Field label="Capacity">
            <Input name="capacity" value={values.capacity} onChange={(e) => set("capacity", e.target.value)} type="number" min={0} />
          </Field>
          <Field label="Street address" className="md:col-span-3">
            <Input name="address" value={values.address} onChange={(e) => set("address", e.target.value)} placeholder="Linienstrasse 84, 10115 Berlin" />
          </Field>
        </div>
      </Section>

      <Section num="03" label="Pricing">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Min">
            <Input name="priceMin" value={values.priceMin} onChange={(e) => set("priceMin", e.target.value)} type="number" min={0} placeholder="2100" />
          </Field>
          <Field label="Max">
            <Input name="priceMax" value={values.priceMax} onChange={(e) => set("priceMax", e.target.value)} type="number" min={0} placeholder="2400" />
          </Field>
          <Field label="Currency">
            <Select name="currency" value={values.currency} onChange={(e) => set("currency", e.target.value)} options={[
              { v: "EUR", l: "EUR" }, { v: "USD", l: "USD" }, { v: "GBP", l: "GBP" },
            ]} />
          </Field>
          <Field label="Billing cycle">
            <Select name="billingCycle" value={values.billingCycle} onChange={(e) => set("billingCycle", e.target.value)} options={[
              { v: "one-time", l: "One-time" },
              { v: "monthly", l: "Monthly" },
              { v: "yearly", l: "Yearly" },
              { v: "hourly", l: "Hourly" },
            ]} />
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-between border-t border-ink-200 pt-6">
        <Link href="/app/listings" className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
          Cancel
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending || !values.title.trim() || !values.city.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-600 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" strokeWidth={2.5} /> {mode === "create" ? "Create listing" : "Save changes"}</>}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
      </div>
      <div className="space-y-4 rounded-2xl border border-ink-200 bg-white p-6">{children}</div>
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-plum-600 focus:ring-plum-600/15"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-plum-600 focus:ring-plum-600/15 resize-y"
    />
  );
}

function Select({ options, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] }) {
  return (
    <select {...rest} className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-900 shadow-sm transition-all focus:outline-none focus:ring-4 focus:border-plum-600 focus:ring-plum-600/15">
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
