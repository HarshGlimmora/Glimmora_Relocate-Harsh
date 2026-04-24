import type { Metadata } from "next";
import { Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PolicyEditor } from "./policy-editor";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const m = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { company: { include: { sponsorship: true } } },
  });
  if (!m) return null;
  const company = m.company;
  const policy = company.sponsorship;
  const sponsorsCountries: string[] = policy ? JSON.parse(policy.sponsorsCountries || "[]") : [];
  const tiers: string[] = policy ? JSON.parse(policy.visaTiers || "[]") : [];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Company</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          {company.name}
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
          Your public company profile and the sponsorship policy that drives visa-aware matching.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Company summary */}
        <aside className="h-fit">
          <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6 text-parchment">
            <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lagoon-500/25 blur-[60px]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-lagoon-300">
                <Building2 className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-sans text-[18px] font-semibold">{company.name}</p>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/60">{company.slug}.glimmora.work</p>
                {company.verified ? (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-lagoon-500/20 border border-lagoon-400/30 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-300">
                    <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={3} /> Verified
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13px]">
              <Row label="HQ" value={company.hqCity ? `${company.hqCity}, ${company.hqCountry ?? ""}` : "—"} />
              <Row label="Size" value={company.size ?? "—"} />
              <Row label="Industry" value={company.industry ?? "—"} />
              <Row label="Website" value={company.website ?? "—"} />
            </div>
          </div>
        </aside>

        {/* Sponsorship policy */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lagoon-100 text-lagoon-700">
                <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Sponsorship policy</p>
                <h2 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-ink-900">Visa capabilities</h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mono-label mb-2">Countries you sponsor</p>
                <div className="flex flex-wrap gap-1.5">
                  {sponsorsCountries.length === 0 ? (
                    <span className="text-[13px] italic text-ink-400">None set</span>
                  ) : (
                    sponsorsCountries.map((c) => (
                      <span key={c} className="rounded-full border border-lagoon-100 bg-lagoon-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-lagoon-800">
                        {c}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="mono-label mb-2">Visa tiers supported</p>
                <div className="flex flex-wrap gap-1.5">
                  {tiers.length === 0 ? (
                    <span className="text-[13px] italic text-ink-400">None set</span>
                  ) : (
                    tiers.map((t) => (
                      <span key={t} className="rounded-full border border-ink-200 bg-parchment px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-800">
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Relocation benefit" value={policy?.relocationBenefit ?? "Not set"} plain />
                <Row label="Remote-friendly" value={policy?.remoteFriendly ? "Yes" : "No"} plain />
              </div>
            </div>

            <div className="mt-8">
              <PolicyEditor
                initial={{
                  sponsorsCountries,
                  visaTiers: tiers,
                  relocationBenefit: policy?.relocationBenefit ?? null,
                  remoteFriendly: policy?.remoteFriendly ?? false,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gilt-200 bg-gilt-50 p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">Tip</p>
            <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-800">
              A clear sponsorship policy dramatically improves candidate quality. Every job you post inherits these defaults — override per-job as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, plain }: { label: string; value: string; plain?: boolean }) {
  return (
    <div className={plain ? "" : "flex items-baseline justify-between gap-4"}>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">{label}</span>
      <span className={plain ? "mt-1 block font-sans text-[14px] text-ink-900" : "text-[13px] capitalize opacity-90"}>{value}</span>
    </div>
  );
}
