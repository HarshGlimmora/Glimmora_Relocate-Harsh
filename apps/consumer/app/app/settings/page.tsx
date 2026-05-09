import type { Metadata } from "next";
import { Bell, Shield, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PreferencesForm } from "./preferences-form";
import { PasswordForm } from "./password-form";
import { DangerZone } from "./danger-zone";
import { SettingsSnapshot } from "./settings-snapshot";
import { DangerConsequences } from "./danger-consequences";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prefs =
    (await prisma.preferences.findUnique({ where: { userId: session.user.id } })) ??
    (await prisma.preferences.create({ data: { userId: session.user.id } }));

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Account</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Settings
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          How Glimmora talks to you, what it shares, and how it looks.
        </p>
      </header>

      <SettingsSnapshot
        emailNotifications={prefs.emailNotifications}
        pushNotifications={prefs.pushNotifications}
        weeklyDigest={prefs.weeklyDigest}
        productUpdates={prefs.productUpdates}
        marketingEmails={prefs.marketingEmails}
        shareWithPartners={prefs.shareWithPartners}
        allowFamilyView={prefs.allowFamilyView}
        twinShareWithCoach={prefs.twinShareWithCoach}
        theme={prefs.theme as "light" | "dark" | "system"}
        density={prefs.density as "comfortable" | "compact"}
        reduceMotion={prefs.reduceMotion}
      />

      <div className="space-y-6">
        <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lagoon-100 text-lagoon-700"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Notifications &amp; privacy</p>
              <h2 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Preferences</h2>
              <p className="mt-1 text-[12.5px] text-ink-600">Pick the channels and audiences that fit you.</p>
            </div>
          </div>
          <PreferencesForm
            initial={{
              emailNotifications: prefs.emailNotifications,
              pushNotifications: prefs.pushNotifications,
              weeklyDigest: prefs.weeklyDigest,
              productUpdates: prefs.productUpdates,
              marketingEmails: prefs.marketingEmails,
              shareWithPartners: prefs.shareWithPartners,
              allowFamilyView: prefs.allowFamilyView,
              twinShareWithCoach: prefs.twinShareWithCoach,
              theme: prefs.theme as "light" | "dark" | "system",
              density: prefs.density as "comfortable" | "compact",
              reduceMotion: prefs.reduceMotion,
            }}
          />
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success-100 text-success-700"
            >
              <Shield className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Security</p>
              <h2 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Change password</h2>
              <p className="mt-1 text-[12.5px] text-ink-600">Choose something only you'd guess.</p>
            </div>
          </div>
          <PasswordForm />
        </section>

        <section className="rounded-2xl border border-danger-200 bg-danger-50/40 p-6 md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger-100 text-danger-700"
            >
              <Trash2 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-danger-700 font-medium">Danger zone</p>
              <h2 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-danger-800">Delete account</h2>
              <p className="mt-1 text-[12.5px] text-danger-700/80">Walk through what's about to disappear before you confirm.</p>
            </div>
          </div>
          <DangerConsequences />
          <DangerZone />
        </section>
      </div>
    </div>
  );
}
