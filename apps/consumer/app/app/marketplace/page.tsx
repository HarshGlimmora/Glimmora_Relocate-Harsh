import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Home, GraduationCap, Landmark, Scale, Coffee, Languages,
  MapPin, Star, Users, ShieldCheck, ArrowRight, PackageSearch, Clock,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { listPartnerListings, listCustomerBookings, type PartnerListing, type PartnerBooking } from "@/lib/partner-api";
import { BookButton } from "./book-button";

export const metadata: Metadata = { title: "Marketplace" };

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

function formatPrice(l: PartnerListing) {
  if (l.priceMin == null && l.priceMax == null) return "—";
  const sym = l.currency === "EUR" ? "€" : l.currency === "GBP" ? "£" : "$";
  const range = l.priceMin != null && l.priceMax != null && l.priceMin !== l.priceMax
    ? `${sym}${l.priceMin.toLocaleString("en-GB")}–${sym}${l.priceMax.toLocaleString("en-GB")}`
    : `${sym}${(l.priceMin ?? l.priceMax)!.toLocaleString("en-GB")}`;
  const cycle = l.billingCycle === "one-time" ? "" : ` / ${l.billingCycle.replace(/ly$/, "").replace("hour", "hr")}`;
  return `${range}${cycle}`;
}

function bookingAmount(l: PartnerListing) {
  return l.priceMin ?? l.priceMax ?? 0;
}

export default async function MarketplacePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { twin: true, relocation: true },
  });
  if (!user) {
    redirect("/sign-in");
  }
  if (!user.relocation) {
    redirect("/onboarding");
  }

  const mode = (user.mode as "INDIVIDUAL" | "FAMILY" | "STUDENT" | undefined) ?? "INDIVIDUAL";
  const isStudent = mode === "STUDENT";
  const isFamily = mode === "FAMILY";

  // Country preference: relocation destination drives partner filtering.
  const primaryCountry = user.relocation.destCountry;

  let listings: PartnerListing[] = [];
  let bookings: PartnerBooking[] = [];
  let apiError: string | null = null;

  try {
    [listings, bookings] = await Promise.all([
      listPartnerListings({ country: primaryCountry }),
      listCustomerBookings(user.email),
    ]);
  } catch (e) {
    apiError = e instanceof Error ? e.message : "Partner portal unreachable";
  }

  const alreadyBookedIds = new Set(
    bookings
      .filter((b) => ["REQUESTED", "CONFIRMED", "IN_PROGRESS"].includes(b.status))
      .map((b) => b.listing.id)
  );

  const byCategory = listings.reduce<Record<string, PartnerListing[]>>((acc, l) => {
    (acc[l.partner.category] ??= []).push(l);
    return acc;
  }, {});

  const heroHeadline = isStudent
    ? "Everything your studies need."
    : isFamily
    ? "Everything your family needs."
    : "Everything your move needs.";

  const heroSub = isStudent
    ? "Verified halls and student housing, blocked-account providers, student insurance, language schools. Book with escrow protection — your deposit is held until you arrive."
    : isFamily
    ? "Verified family-sized housing, international and bilingual school seats, joint banking, paediatric cover, removalists. Book with escrow protection — every deposit guaranteed."
    : "Verified housing, school seats, legal packages, bank setups, coworking. Book with escrow protection — no deposit lost to unknown landlords.";

  const focusCategories = isStudent
    ? ["HOUSING", "BANK", "INSURANCE", "LANGUAGE"]
    : isFamily
    ? ["HOUSING", "SCHOOL", "BANK", "INSURANCE", "LEGAL"]
    : ["HOUSING", "BANK", "LEGAL", "INSURANCE", "LOCAL"];

  const focusLabel = isStudent
    ? "Most relevant for your studies"
    : isFamily
    ? "Most relevant for your family"
    : "Most relevant for your move";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Marketplace</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {heroHeadline}
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          {heroSub}
        </p>
      </header>

      {/* Mode-relevant focus tags — guides the user without hiding listings */}
      <section className="mb-8 rounded-2xl border border-ink-200 bg-white p-5 md:p-6">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
          {focusLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {focusCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex h-9 items-center rounded-full border border-ink-200 bg-parchment px-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-700 font-medium"
            >
              {categoryTitle(cat)}
            </span>
          ))}
        </div>
      </section>

      {apiError ? (
        <section className="mb-8 rounded-2xl border border-gilt-200 bg-gilt-50/60 p-5">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
            Inventory connecting
          </p>
          <p className="mt-2 text-[14px] font-semibold text-ink-900">
            Live partner inventory is reconnecting.
          </p>
          <p className="mt-1 text-[13px] text-ink-700 leading-[1.55]">
            Verified housing, school seats, banking, and legal packages will appear here as soon as the partner network responds. Check back in a moment.
          </p>
        </section>
      ) : null}

      {bookings.length > 0 ? (
        <section className="mb-10">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">01</span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">Your bookings</span>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {bookings.slice(0, 4).map((b) => <MyBookingCard key={b.id} booking={b} />)}
          </ul>
        </section>
      ) : null}

      {listings.length === 0 && !apiError ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <PackageSearch className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No listings available.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            {primaryCountry
              ? `No verified listings in ${primaryCountry} yet. Set a different target country in your Twin to see more.`
              : "Partners are adding inventory. Check back soon."}
          </p>
        </div>
      ) : null}

      {Object.entries(byCategory).map(([category, items], idx) => (
        <section key={category} className="mb-12">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">
              {String(idx + (bookings.length > 0 ? 2 : 1)).padStart(2, "0")}
            </span>
            <span className="h-px flex-1 bg-ink-200" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">
              {categoryTitle(category)}
            </span>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} alreadyBooked={alreadyBookedIds.has(l.id)} />
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Every partner is verified before you can book.
            </h3>
            <p className="mt-2 max-w-md text-[13.5px] text-white/65 leading-[1.6]">
              Business identity, tax registration, insurance. If anything goes wrong, Glimmora holds the escrow and resolves the dispute.
            </p>
          </div>
          <Link href="/app/plan" className="inline-flex h-11 items-center gap-2 rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white">
            Open my plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function categoryTitle(cat: string) {
  const map: Record<string, string> = {
    HOUSING: "Housing",
    SCHOOL: "Schools & childcare",
    BANK: "Banking",
    LEGAL: "Legal & visa",
    INSURANCE: "Insurance",
    LANGUAGE: "Language",
    LOCAL: "Local services",
  };
  return map[cat] ?? cat;
}

function ListingCard({ listing: l, alreadyBooked }: { listing: PartnerListing; alreadyBooked: boolean }) {
  const Icon = kindIcons[l.kind] ?? Home;
  return (
    <li className="group relative rounded-2xl border border-ink-200 bg-white p-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-800">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-[15.5px] font-semibold tracking-tight text-ink-900">
              <Link
                href={`/app/marketplace/${l.id}`}
                className="before:absolute before:inset-0 before:rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-900/15"
              >
                {l.title}
              </Link>
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-success-200 bg-success-50 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-700 font-medium">
              <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} /> Verified
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.city}, {l.country}</span>
            <span className="text-ink-300">·</span>
            <span>{l.partner.name}</span>
            <span className="text-ink-300">·</span>
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-gilt-500 text-gilt-500" /> {l.partner.rating.toFixed(1)}</span>
          </p>
          {l.summary ? <p className="mt-3 text-[13px] text-ink-700 leading-[1.55] line-clamp-3">{l.summary}</p> : null}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-ink-100 pt-4">
        <div>
          <p className="font-sans text-[18px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{formatPrice(l)}</p>
          <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            <Users className="h-3 w-3" /> {l.capacityRemaining > 0 ? `${l.capacityRemaining} left` : "Waitlist"}
            <span className="text-ink-300">·</span>
            <span>{kindLabel[l.kind] ?? l.kind}</span>
          </p>
        </div>
        <BookButton
          listingId={l.id}
          amount={bookingAmount(l)}
          currency={l.currency}
          title={l.title}
          partnerName={l.partner.name}
          alreadyBooked={alreadyBooked}
        />
      </div>
    </li>
  );
}

function MyBookingCard({ booking: b }: { booking: PartnerBooking }) {
  const stageCls: Record<string, string> = {
    REQUESTED:   "bg-gilt-50 border-gilt-200 text-gilt-800",
    CONFIRMED:   "bg-lagoon-50 border-lagoon-200 text-lagoon-800",
    IN_PROGRESS: "bg-lagoon-100 border-lagoon-200 text-lagoon-900",
    FULFILLED:   "bg-success-50 border-success-200 text-success-700",
    DECLINED:    "bg-ink-50 border-ink-200 text-ink-500",
    CANCELLED:   "bg-danger-50 border-danger-200 text-danger-700",
  };
  return (
    <li className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[14.5px] font-semibold text-ink-900">{b.listing.title}</p>
          <p className="mt-0.5 text-[12px] text-ink-500">{b.partner.name} · {b.listing.city}, {b.listing.country}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium ${stageCls[b.status] ?? stageCls.REQUESTED}`}>
          {b.status.toLowerCase().replace("_", " ")}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-100 pt-3 text-[11.5px] text-ink-500">
        <span className="font-mono uppercase tracking-[0.18em]">Escrow: {b.escrowState}</span>
        {b.startDate ? (
          <span className="font-mono uppercase tracking-[0.18em]">
            <Clock className="mr-1 inline h-3 w-3" />
            Start {new Date(b.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        ) : null}
      </div>
    </li>
  );
}
