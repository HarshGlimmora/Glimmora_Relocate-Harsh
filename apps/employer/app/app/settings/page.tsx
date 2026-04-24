import type { Metadata } from "next";
import { NotificationsForm } from "./notifications";
import { IntegrationGrid } from "./integrations";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Account</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Settings
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Notifications, integrations, and preferences for your hiring team.
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Notifications</p>
          <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">What we email you about</h2>
          <NotificationsForm />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Integrations</p>
          <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">ATS & calendar</h2>
          <IntegrationGrid />
        </section>
      </div>
    </div>
  );
}
