import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, CheckCircle2, Clock, ArrowRight, Info } from "lucide-react";
import { requirePartnerSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { money, relativeTime, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  const { partner } = await requirePartnerSession();

  const payouts = await prisma.payout.findMany({
    where: { partnerId: partner.id },
    orderBy: { updatedAt: "desc" },
    include: {
      booking: {
        include: {
          listing: { select: { title: true } },
        },
      },
    },
  });

  const held = payouts.filter((p) => p.status === "HELD");
  const released = payouts.filter((p) => p.status === "RELEASED");

  const heldSum = held.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount;
    return acc;
  }, {});
  const releasedSum = released.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount;
    return acc;
  }, {});
  const feeSum = payouts.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.platformFee;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Payouts · Escrow</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Money in, money out.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Customer funds sit in escrow until fulfilment. Mark a booking fulfilled to release the payout.
        </p>
      </header>

      {/* KPIs */}
      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <KPICard
          Icon={Clock}
          label="Held in escrow"
          value={Object.keys(heldSum).length === 0 ? "—" : Object.entries(heldSum).map(([c, v]) => money(v, c)).join(" · ")}
          sub={`${held.length} pending release`}
          tone="gilt"
        />
        <KPICard
          Icon={CheckCircle2}
          label="Released"
          value={Object.keys(releasedSum).length === 0 ? "—" : Object.entries(releasedSum).map(([c, v]) => money(v, c)).join(" · ")}
          sub={`${released.length} payouts all-time`}
          tone="lagoon"
        />
        <KPICard
          Icon={Wallet}
          label="Platform fees"
          value={Object.keys(feeSum).length === 0 ? "—" : Object.entries(feeSum).map(([c, v]) => money(v, c)).join(" · ")}
          sub="5% Glimmora marketplace fee"
        />
      </section>

      {held.length === 0 && released.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-white">
            <Wallet className="h-5 w-5 text-ink-700" strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-sans text-[20px] font-semibold tracking-tight text-ink-900">No payouts yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-600">
            Every confirmed booking creates an escrow-held payout. It releases when you mark the booking fulfilled.
          </p>
          <Link href="/app/bookings" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-plum-600 pl-5 pr-4 text-[13.5px] font-semibold text-white hover:bg-plum-700">
            Open bookings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {held.length > 0 ? (
            <Section num="01" label="Held in escrow">
              <ul className="space-y-3">
                {held.map((p) => <PayoutRow key={p.id} payout={p} />)}
              </ul>
            </Section>
          ) : null}

          {released.length > 0 ? (
            <Section num={held.length > 0 ? "02" : "01"} label="Released">
              <ul className="space-y-3">
                {released.map((p) => <PayoutRow key={p.id} payout={p} released />)}
              </ul>
            </Section>
          ) : null}
        </>
      )}

      <section className="mt-10 rounded-2xl border border-ink-200 bg-parchment/60 p-5 flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-parchment">
          <Info className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-sans text-[14px] font-semibold text-ink-900">Payout cadence</p>
          <p className="mt-1 text-[13px] leading-[1.55] text-ink-600">
            Released funds are batched every Thursday and transferred to your connected bank account within 2 business days.
            Stripe Connect configuration arrives with billing (W4).
          </p>
        </div>
      </section>
    </div>
  );
}

function Section({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
      </div>
      {children}
    </section>
  );
}

function PayoutRow({
  payout: p, released,
}: {
  payout: Awaited<ReturnType<typeof prisma.payout.findMany>>[number] & {
    booking: { customerName: string; customerEmail: string; status: string; listing: { title: string } };
  };
  released?: boolean;
}) {
  return (
    <li className={cn("rounded-2xl border bg-white p-5 md:p-6", released ? "border-lagoon-200 bg-lagoon-50/30" : "border-gilt-200 bg-gilt-50/30")}>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
        <div className="min-w-0">
          <p className="font-sans text-[15px] font-semibold text-ink-900">{p.booking.customerName}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{p.booking.listing.title}</p>
          {p.note ? <p className="mt-1 text-[11.5px] italic text-ink-600">{p.note}</p> : null}
        </div>

        <div className="text-[12.5px] text-ink-600">
          <p className="inline-flex items-center gap-1">
            <Wallet className="h-3 w-3 text-ink-400" />
            Booking status: <span className="font-medium text-ink-800">{p.booking.status.toLowerCase().replace("_", " ")}</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Platform fee {money(p.platformFee, p.currency)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            {released && p.releasedAt ? `Released ${relativeTime(p.releasedAt)}` : `Created ${relativeTime(p.createdAt)}`}
          </p>
        </div>

        <div className="text-right md:justify-self-end">
          <p className={cn("font-mono text-[9.5px] uppercase tracking-[0.22em] font-medium", released ? "text-lagoon-700" : "text-gilt-800")}>
            {released ? "Paid out" : "Partner take"}
          </p>
          <p className="mt-0.5 font-sans text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink-900">
            {money(p.amount, p.currency)}
          </p>
          <Link
            href={`/app/bookings/${p.bookingId}`}
            className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900 font-medium"
          >
            Open booking <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function KPICard({
  Icon, label, value, sub, tone,
}: { Icon: typeof Wallet; label: string; value: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const bg =
    tone === "gilt"   ? "bg-gilt-50 border-gilt-200" :
    tone === "lagoon" ? "bg-lagoon-50 border-lagoon-100" :
    "bg-white border-ink-200";
  const iconBg =
    tone === "gilt"   ? "bg-gilt-500 text-ink-900" :
    tone === "lagoon" ? "bg-lagoon-500 text-white" :
    "bg-ink-900 text-parchment";
  return (
    <div className={cn("rounded-2xl border p-5", bg)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</p>
          <p className="mt-2 font-sans text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink-900 break-all">{value}</p>
          <p className="mt-2 text-[11.5px] font-medium text-ink-500">{sub}</p>
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}
