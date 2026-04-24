import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { TwinForm } from "./twin-form";

export const metadata: Metadata = { title: "Profile & Twin" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, twin: true },
  });
  if (!user) return null;

  const targetCountries: string[] = user.twin?.targetCountries
    ? (JSON.parse(user.twin.targetCountries) as string[])
    : [];
  const readiness = user.twin?.readinessScore ?? 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Account</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          Your profile &amp; Twin.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          The more Glimmora knows about you, the sharper its recommendations. Everything here is private and only used to personalise your journey.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Identity card — dark */}
        <aside className="h-fit space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6 text-parchment">
            <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gilt-500/20 blur-[60px]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gilt-300 to-gilt-600 font-sans text-[22px] font-semibold text-ink-900">
                {initials(user.profile?.displayName ?? user.name ?? user.email)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-sans text-[18px] font-semibold tracking-tight">{user.profile?.displayName ?? user.name ?? "Member"}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-white/60">{user.email}</p>
                <span className="mt-2 inline-block rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-300">
                  {user.mode}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5 space-y-4 text-[13px]">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">Twin stage</span>
                <span className="capitalize">{user.twin?.stage ?? "exploring"}</span>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">Readiness</span>
                  <span className="font-sans text-[15px] font-semibold">{readiness}/100</span>
                </div>
                <div className="mt-2 h-[3px] rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gilt-400 to-gilt-300" style={{ width: `${readiness}%` }} />
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium mb-2">Target corridors</p>
                {targetCountries.length === 0 ? (
                  <p className="text-[13px] text-white/60 italic">Not set yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {targetCountries.map((c) => (
                      <span key={c} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-white/85">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 font-medium">Member since</span>
                <span>{new Date(user.createdAt).toLocaleDateString("en", { year: "numeric", month: "short" })}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gilt-200 bg-gilt-50 p-5">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">Tip</p>
            <p className="mt-2 text-[13px] leading-[1.55] text-ink-800">
              Completing your Twin unlocks sharper country matches and visa-aware jobs.
            </p>
          </div>
        </aside>

        {/* Forms */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Profile</p>
                <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Who you are</h2>
              </div>
            </div>
            <ProfileForm
              initial={{
                displayName: user.profile?.displayName ?? user.name ?? "",
                headline: user.profile?.headline ?? "",
                bio: user.profile?.bio ?? "",
                currentCountry: user.profile?.currentCountry ?? "",
                currentCity: user.profile?.currentCity ?? "",
                nationality: user.profile?.nationality ?? "",
                phone: user.profile?.phone ?? "",
              }}
            />
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Digital Twin</p>
                <h2 className="mt-2 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Your situation</h2>
              </div>
            </div>
            <TwinForm
              initial={{
                profession: user.twin?.profession ?? "",
                seniorityLevel: user.twin?.seniorityLevel ?? "",
                yearsExperience: user.twin?.yearsExperience ?? null,
                timelineMonths: user.twin?.timelineMonths ?? null,
                budgetUSD: user.twin?.budgetUSD ?? null,
                targetCountries,
                familySize: user.twin?.familySize ?? 1,
                hasChildren: user.twin?.hasChildren ?? false,
                childrenCount: user.twin?.childrenCount ?? 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
