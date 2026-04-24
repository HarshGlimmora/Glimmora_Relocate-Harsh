import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus, Home, GraduationCap, Landmark, Scale, Coffee, Languages,
  MapPin, Eye, PackageSearch, CalendarClock,
} from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, cn, relativeTime } from "@/lib/utils";
import { ListingRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Listings" };

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
  BANK_APPOINTMENT: "Bank appt.",
  LEGAL_PACKAGE: "Legal package",
  COWORKING: "Coworking",
  LANGUAGE_COURSE: "Language course",
};

function statusPill(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIVE:   { cls: "bg-success-50 border-success-200 text-success-700", label: "Active" },
    DRAFT:    { cls: "bg-ink-50 border-ink-200 text-ink-700",             label: "Draft" },
    ARCHIVED: { cls: "bg-ink-100 border-ink-200 text-ink-500",            label: "Archived" },
  };
  return map[status] ?? map.DRAFT;
}

function formatPrice(l: { priceMin: number | null; priceMax: number | null; currency: string; billingCycle: string }) {
  if (l.priceMin == null && l.priceMax == null) return "—";
  const range =
    l.priceMin != null && l.priceMax != null && l.priceMin !== l.priceMax
      ? `${money(l.priceMin, l.currency)}–${money(l.priceMax, l.currency)}`
      : money(l.priceMin ?? l.priceMax, l.currency);
  const cycle = l.billingCycle === "one-time" ? "" : ` / ${l.billingCycle.replace(/ly$/, "").replace("hour", "hr")}`;
  return `${range}${cycle}`;
}

export default async function ListingsPage() {
  const { partner } = await requirePartnerSession();

  const listings = await prisma.listing.findMany({
    where: { partnerId: partner.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { bookings: true } } },
  });

  const active = listings.filter((l) => l.status === "ACTIVE");
  const draft = listings.filter((l) => l.status === "DRAFT");
  const archived = listings.filter((l) => l.status === "ARCHIVED");

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Listings</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Your inventory.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            Apartments, school seats, legal packages, coworking — anything relocating professionals can book through Glimmora.
          </p>
        </div>
        <Link
          href="/app/listings/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-600 pl-5 pr-4 text-[13.5px] font-semibold text-white hover:bg-plum-700"
        >
          <Plus className="h-4 w-4" /> New listing
        </Link>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard n={active.length} label="Active" sub="live in marketplace" />
        <StatCard n={draft.length} label="Drafts" sub="hidden until published" />
        <StatCard n={archived.length} label="Archived" sub="no longer offered" />
      </section>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <PackageSearch className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No listings yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Add your first apartment, school seat, or legal package. Drafts stay private until you publish.
          </p>
          <Link
            href="/app/listings/new"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-plum-600 pl-5 pr-4 text-[13.5px] font-semibold text-white hover:bg-plum-700"
          >
            <Plus className="h-4 w-4" /> Create your first listing
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => {
            const Icon = kindIcons[l.kind] ?? Home;
            const pill = statusPill(l.status);
            return (
              <li
                key={l.id}
                className="group relative rounded-2xl border border-ink-200 bg-white px-5 py-5 transition-all hover:border-ink-900 hover:shadow-[0_4px_20px_-8px_rgba(14,18,28,0.12)] md:px-6"
              >
                <div className="grid gap-4 md:grid-cols-[auto_1.4fr_auto_auto_auto_auto] md:items-center">
                  <span className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                    l.status === "ACTIVE" ? "border-plum-200 bg-plum-50 text-plum-700" : "border-ink-200 bg-parchment text-ink-600",
                  )}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/app/listings/${l.id}/edit`}
                        className="font-sans text-[15px] font-semibold tracking-tight text-ink-900 hover:underline decoration-ink-300 decoration-1 underline-offset-4 before:absolute before:inset-0 before:rounded-2xl"
                      >
                        {l.title}
                      </Link>
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium", pill.cls)}>
                        {pill.label}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                      <span>{kindLabel[l.kind] ?? l.kind}</span>
                      <span className="text-ink-300">·</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.city}, {l.country}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Price</p>
                    <p className="mt-0.5 font-sans text-[13.5px] font-semibold text-ink-900">{formatPrice(l)}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Capacity</p>
                    <p className="mt-0.5 font-sans text-[13.5px] font-semibold text-ink-900">{l.capacity - l.capacityTaken}/{l.capacity}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Bookings</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 font-sans text-[13.5px] font-semibold text-ink-900">
                      <CalendarClock className="h-3 w-3 text-ink-500" /> {l._count.bookings}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {l.status === "ACTIVE" ? (
                      <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-success-50 border border-success-200 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-success-700 font-medium">
                        <Eye className="h-2.5 w-2.5" /> Live
                      </span>
                    ) : null}
                    <ListingRowActions id={l.id} status={l.status} title={l.title} />
                  </div>
                </div>

                <p className="mt-3 border-t border-ink-100 pt-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500">
                  {l.status === "ACTIVE" && l.publishedAt ? `Published ${relativeTime(l.publishedAt)}` : `Created ${relativeTime(l.createdAt)}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.025em] text-ink-900">{n}</p>
      <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p>
    </div>
  );
}
