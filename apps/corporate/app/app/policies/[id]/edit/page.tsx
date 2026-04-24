import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCorporateSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PolicyForm } from "../../policy-form";

export const metadata: Metadata = { title: "Edit policy" };

export default async function EditPolicyPage({ params }: { params: { id: string } }) {
  const { organization } = await requireCorporateSession();
  const p = await prisma.policy.findUnique({ where: { id: params.id } });
  if (!p || p.organizationId !== organization.id) notFound();

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 md:px-10 md:py-12">
      <Link href="/app/policies" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to policies
      </Link>
      <header className="mt-6 mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-moss-700 font-medium">Edit policy</p>
        <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
          {p.name}
        </h1>
      </header>
      <PolicyForm mode="edit" initial={{
        id: p.id,
        name: p.name,
        tier: p.tier,
        relocationCap: String(p.relocationCap),
        housingCap: p.housingCap != null ? String(p.housingCap) : "",
        lumpSum: p.lumpSum != null ? String(p.lumpSum) : "",
        currency: p.currency,
        shippingIncluded: p.shippingIncluded,
        active: p.active,
        description: p.description ?? "",
      }} />
    </div>
  );
}
