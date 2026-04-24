import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ListingForm } from "../../listing-form";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const { partner } = await requirePartnerSession();

  const l = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!l || l.partnerId !== partner.id) notFound();

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 md:px-10 md:py-12">
      <Link href="/app/listings" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to listings
      </Link>
      <header className="mt-6 mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-plum-700 font-medium">Edit listing</p>
        <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
          {l.title}
        </h1>
      </header>
      <ListingForm
        mode="edit"
        initial={{
          id: l.id,
          kind: l.kind,
          title: l.title,
          summary: l.summary ?? "",
          city: l.city,
          country: l.country,
          address: l.address ?? "",
          priceMin: l.priceMin != null ? String(l.priceMin) : "",
          priceMax: l.priceMax != null ? String(l.priceMax) : "",
          currency: l.currency,
          billingCycle: l.billingCycle,
          capacity: String(l.capacity),
          status: l.status === "ARCHIVED" ? "DRAFT" : l.status,
        }}
      />
    </div>
  );
}
