import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Home, GraduationCap, Landmark, Scale, Coffee, Languages,
  MapPin, Star, Users, ShieldCheck, Globe2, Clock, Building2, Check,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPartnerListing, listCustomerBookings } from "@/lib/partner-api";
import { BookButton } from "../book-button";

export const metadata: Metadata = { title: "Listing" };

const kindIcons: Record<string, typeof Home> = {
  APARTMENT: Home,
  SCHOOL_SEAT: GraduationCap,
  BANK_APPOINTMENT: Landmark,
  LEGAL_PACKAGE: Scale,
  COWORKING: Coffee,
  LANGUAGE_COURSE: Languages,
};

const kindLabel: Record<string, string> = {
  APARTMENT: "Apartment",
  SCHOOL_SEAT: "School seat",
  BANK_APPOINTMENT: "Bank appointment",
  LEGAL_PACKAGE: "Legal package",
  COWORKING: "Coworking",
  LANGUAGE_COURSE: "Language course",
};

function money(n: number | null, cur: string) {
  if (n == null) return null;
  const sym = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
  return `${sym}${n.toLocaleString("en-GB")}`;
}

function formatPrice(l: { priceMin: number | null; priceMax: number | null; currency: string; billingCycle: string }) {
  const min = money(l.priceMin, l.currency);
  const max = money(l.priceMax, l.currency);
  const range = min && max && l.priceMin !== l.priceMax ? `${min}–${max}` : (min ?? max ?? "Undisclosed");
  const cycle = l.billingCycle === "one-time" ? "" : ` / ${l.billingCycle.replace(/ly$/, "").replace("hour", "hr")}`;
  return `${range}${cycle}`;
}

function formatAttribute(key: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function attributeLabel(key: string): string {
  const map: Record<string, string> = {
    bedrooms: "Bedrooms", bathrooms: "Bathrooms", sqm: "Size (m²)",
    furnished: "Furnished", petFriendly: "Pet-friendly", deposit: "Deposit",
    grade: "Grade", curriculum: "Curriculum", language: "Language",
    startMonth: "Start month", visa: "Visa route", countries: "Countries",
    turnaround: "Turnaround", scope: "Scope",
  };
  return map[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { twin: true },
  });

  const listing = await getPartnerListing(params.id).catch(() => null);
  if (!listing) notFound();

  const bookings = user?.email ? await listCustomerBookings(user.email).catch(() => []) : [];
  const alreadyBooked = bookings.some(
    (b) => b.listing.id === listing.id && ["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );

  const Icon = kindIcons[listing.kind] ?? Home;
  const attributes = Object.entries(listing.attributes).filter(([, v]) => v != null && v !== "");

  const bookingAmount = listing.priceMin ?? listing.priceMax ?? 0;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <Link href="/app/marketplace" className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 hover:text-ink-900 font-medium">
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Back to marketplace
      </Link>

      {/* Hero */}
      <section className="relative mt-6 overflow-hidden rounded-[28px] bg-ink-900 p-8 text-parchment md:p-12">
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gilt-500/25 blur-[70px]" />
        <div aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-lagoon-500/15 blur-[80px]" />
        <div className="relative grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                <Icon className="h-3 w-3" /> {kindLabel[listing.kind] ?? listing.kind}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-lagoon-500/20 border border-lagoon-400/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-300">
                <ShieldCheck className="h-3 w-3" /> KYB verified
              </span>
            </div>
            <h1 className="mt-5 font-sans text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              {listing.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-white/75">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.country}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {listing.partner.name}</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-gilt-400 text-gilt-400" /> {listing.partner.rating.toFixed(1)} ({listing.partner.reviewCount} reviews)</span>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
              <Users className="h-3 w-3" />
              {listing.capacityRemaining > 0 ? `${listing.capacityRemaining} left` : "Waitlist only"}
              <span className="text-white/30">·</span>
              {listing.totalBookings} booking{listing.totalBookings === 1 ? "" : "s"} to date
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Price</p>
            <p className="mt-2 font-sans text-[40px] font-semibold leading-none tracking-[-0.025em] text-parchment">
              {formatPrice(listing)}
            </p>
            <p className="mt-3 text-[13px] text-white/65 leading-[1.5]">
              Escrow-held. Refunded instantly if the partner declines.
            </p>
          </div>
        </div>
      </section>

      {/* Action strip */}
      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 md:p-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Ready to book</p>
          <p className="mt-1 font-sans text-[16px] font-semibold text-ink-900">Your Twin becomes the application — no uploads.</p>
          <p className="mt-1 text-[13px] text-ink-600 max-w-lg">
            Passport, profession, and current country go directly to {listing.partner.name}. You'll hear back in under 24 hours.
          </p>
        </div>
        <BookButton
          listingId={listing.id}
          amount={bookingAmount}
          currency={listing.currency}
          title={listing.title}
          partnerName={listing.partner.name}
          alreadyBooked={alreadyBooked}
        />
      </section>

      {/* Body */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {listing.summary ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">About this listing</p>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-ink-700 whitespace-pre-wrap">
                {listing.summary}
              </p>
            </section>
          ) : null}

          {attributes.length > 0 ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Details</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                {attributes.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                      {attributeLabel(k)}
                    </dt>
                    <dd className="mt-1 font-sans text-[14px] font-semibold text-ink-900 capitalize">
                      {formatAttribute(k, v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {listing.address ? (
            <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Address</p>
              <p className="mt-3 inline-flex items-center gap-2 text-[14px] text-ink-800">
                <MapPin className="h-4 w-4 text-ink-500" strokeWidth={1.75} />
                {listing.address}
              </p>
            </section>
          ) : null}

          {/* Trust strip */}
          <section className="rounded-2xl border border-lagoon-200 bg-lagoon-50/40 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lagoon-500 text-white">
                <ShieldCheck className="h-[16px] w-[16px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">Booking protections</p>
                <h2 className="mt-0.5 font-sans text-[18px] font-semibold tracking-tight text-ink-900">Escrow-held. Refund guaranteed.</h2>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[13.5px] text-ink-700">
              <li className="inline-flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-lagoon-700 shrink-0" /> Your deposit is held by Glimmora until the partner confirms fulfilment.</li>
              <li className="inline-flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-lagoon-700 shrink-0" /> If anything goes wrong, we refund within 5 business days — no arguments.</li>
              <li className="inline-flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-lagoon-700 shrink-0" /> Partner is KYB-verified with {listing.partner.fulfilmentRate.toFixed(1)}% fulfilment rate.</li>
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="rounded-2xl bg-ink-900 p-6 text-parchment relative overflow-hidden">
            <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lagoon-500/20 blur-[50px]" />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lagoon-300">
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <p className="mt-4 font-sans text-[15px] font-semibold">{listing.partner.name}</p>
              {listing.partner.hqCity || listing.partner.hqCountry ? (
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  {listing.partner.hqCity}{listing.partner.hqCity && listing.partner.hqCountry ? ", " : ""}{listing.partner.hqCountry}
                </p>
              ) : null}
              {listing.partner.about ? (
                <p className="mt-3 text-[12.5px] text-white/70 leading-[1.55]">{listing.partner.about}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-[12px]">
                <SideStat label="Rating" value={listing.partner.rating.toFixed(1)} />
                <SideStat label="Reviews" value={String(listing.partner.reviewCount)} />
                <SideStat label="Fulfilment" value={`${listing.partner.fulfilmentRate.toFixed(1)}%`} />
                <SideStat label="Category" value={listing.partner.category.toLowerCase()} />
              </div>
              {listing.partner.website ? (
                <a
                  href={listing.partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-lagoon-300 hover:text-lagoon-200 font-medium"
                >
                  <Globe2 className="h-3 w-3" /> Partner website
                </a>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Published</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-700">
              <Clock className="h-3.5 w-3.5 text-ink-500" />
              {listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SideStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/50">{label}</p>
      <p className="mt-1 font-sans text-[13px] font-semibold text-parchment capitalize">{value}</p>
    </div>
  );
}
