import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListingForm } from "../listing-form";

export const metadata: Metadata = { title: "New listing" };

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 md:px-10 md:py-12">
      <Link href="/app/listings" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to listings
      </Link>
      <header className="mt-6 mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-plum-700 font-medium">New listing</p>
        <h1 className="mt-3 font-sans text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
          What are you offering?
        </h1>
        <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-ink-600">
          Save as draft first, publish when you're ready. Active listings appear in the customer marketplace immediately.
        </p>
      </header>
      <ListingForm mode="create" />
    </div>
  );
}
