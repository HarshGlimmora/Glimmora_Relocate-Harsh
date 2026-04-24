import type { Metadata } from "next";
import { requirePartnerSession } from "@/lib/session";
import { NotificationsForm } from "./notifications";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { partner } = await requirePartnerSession();

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Settings</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Workspace preferences.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Notification and integration controls for {partner.name}.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Notifications</p>
        <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">What we email your team</h2>
        <NotificationsForm />
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Integrations</p>
        <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Calendar & payments</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            { name: "Stripe Connect", desc: "Payouts to your business bank account", badge: "W4" },
            { name: "Google Calendar", desc: "Appointment slots sync from your calendar", badge: "W3" },
            { name: "Zoom", desc: "Auto-create video links for legal consultations", badge: "W3" },
            { name: "QuickBooks", desc: "Sync invoice + payout ledger", badge: "W5" },
          ].map((i) => (
            <div key={i.name} className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-parchment px-4 py-3">
              <div>
                <p className="font-sans text-[14px] font-semibold text-ink-900">{i.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-500">{i.desc}</p>
              </div>
              <button
                disabled
                title={`Lands with ${i.badge} milestone.`}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-ink-200 bg-white px-3 text-[11.5px] font-medium text-ink-500 cursor-not-allowed"
              >
                Connect
                <span className="ml-1 rounded-full bg-ink-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-600">{i.badge}</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
