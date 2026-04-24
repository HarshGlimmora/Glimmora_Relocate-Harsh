import type { Metadata } from "next";
import { SlidersHorizontal, Eye, Users, Globe, Package, Beaker, Zap, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "Feature flags & config" };

type Flag = {
  key: string;
  name: string;
  area: "Copilot" | "Marketplace" | "Discovery" | "Corporate" | "Growth";
  rollout: number; // 0-100
  enabled: boolean;
  description: string;
};

const FLAGS: Flag[] = [
  { key: "copilot.streaming.v2",      name: "Copilot streaming v2",      area: "Copilot",     rollout: 10,  enabled: true,  description: "New streaming transport with tool-call progress." },
  { key: "copilot.plan.generation",   name: "Auto-generate plan",        area: "Copilot",     rollout: 0,   enabled: false, description: "Turn Twin state into a 9-month plan on first chat." },
  { key: "marketplace.escrow",        name: "Escrow holds",              area: "Marketplace", rollout: 100, enabled: true,  description: "Customer funds held by Glimmora until fulfilment." },
  { key: "marketplace.stripe_connect",name: "Stripe Connect payouts",    area: "Marketplace", rollout: 25,  enabled: false, description: "Direct partner payouts via Stripe Connect." },
  { key: "discover.visa_aware_match", name: "Visa-aware match v3",       area: "Discovery",   rollout: 100, enabled: true,  description: "Block roles the candidate's passport cannot take." },
  { key: "corporate.approvals_ai",    name: "AI budget exception check", area: "Corporate",   rollout: 50,  enabled: true,  description: "Flag policy-breaking approvals before HR sees them." },
  { key: "growth.referral_program",   name: "Referral program",          area: "Growth",      rollout: 0,   enabled: false, description: "€50 credit on successful referral." },
  { key: "infra.read_replicas",       name: "Admin read replicas",       area: "Corporate",   rollout: 0,   enabled: false, description: "Admin queries hit replicas instead of primaries." },
];

export default function FlagsPage() {
  const active = FLAGS.filter((f) => f.enabled);
  const ramping = FLAGS.filter((f) => f.rollout > 0 && f.rollout < 100);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Finance & Config</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900">
            Feature flags & config.
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] text-ink-600 leading-[1.6]">
            Platform-wide toggles. Ramp percentages, kill switches, experiment cohorts. Changes here touch every user — super-admin only.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-700 font-medium">
          Flag writes · W5
        </span>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <Kpi n={FLAGS.length} l="Total flags" sub="platform-wide" />
        <Kpi n={active.length} l="Enabled" sub="currently on" tone="lagoon" />
        <Kpi n={ramping.length} l="Ramping" sub="partial rollout" tone="gilt" />
        <Kpi n={0} l="Experiments" sub="A/B cohorts" />
      </section>

      <section className="mb-10">
        <SectionHead num="01" label="Flags" />
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          {FLAGS.map((f, i) => (
            <div
              key={f.key}
              className={`flex flex-wrap items-center gap-4 px-5 py-4 md:px-6 ${i < FLAGS.length - 1 ? "border-b border-ink-100" : ""}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${areaCls(f.area)}`}>
                <AreaIcon area={f.area} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-sans text-[14px] font-semibold text-ink-900">{f.name}</p>
                  <span className="font-mono text-[10px] text-ink-500">{f.key}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-ink-600">{f.description}</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="hidden sm:block min-w-[120px]">
                  <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                    <span>Rollout</span>
                    <span className="text-ink-900">{f.rollout}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.rollout > 0 ? "bg-gradient-to-r from-lagoon-400 to-lagoon-600" : ""}`}
                      style={{ width: `${Math.max(0, f.rollout)}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  title="Flag writes ship with W5."
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 font-mono text-[9.5px] uppercase tracking-[0.18em] font-medium cursor-not-allowed ${
                    f.enabled
                      ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
                      : "border-ink-200 bg-parchment text-ink-600"
                  }`}
                >
                  {f.enabled ? "Enabled" : "Off"}
                  <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${f.enabled ? "bg-white text-lagoon-700" : "bg-ink-100 text-ink-600"}`}>W5</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ConfigCard
          Icon={Eye}
          title="Observability"
          body="Error tracking, performance traces, audit streams. Hosted on Sentry + Grafana."
          items={["Sentry prod DSN", "Grafana dashboards", "Audit log retention (90d)"]}
        />
        <ConfigCard
          Icon={Users}
          title="Auth & roles"
          body="Role-to-permission matrix for Ops staff. Separation of duties enforced at write-time."
          items={["SUPER_ADMIN · 12 perms", "TRUST_OFFICER · 4 perms", "SUPPORT_AGENT · 2 perms"]}
        />
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function Kpi({ n, l, sub, tone }: { n: number; l: string; sub: string; tone?: "gilt" | "lagoon" }) {
  const toneCls = tone === "gilt"
    ? "border-gilt-200 bg-gilt-50 text-gilt-800"
    : tone === "lagoon"
    ? "border-lagoon-200 bg-lagoon-50 text-lagoon-800"
    : "border-ink-200 bg-white text-ink-700";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] font-medium">{l}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-none tracking-[-0.035em] text-ink-900">{n}</p>
      <p className="mt-2 text-[12px] text-ink-600">{sub}</p>
    </div>
  );
}

type IconCmp = LucideIcon;

function ConfigCard({ Icon, title, body, items }: { Icon: IconCmp; title: string; body: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-parchment">
          <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
        </span>
        <h3 className="font-sans text-[15px] font-semibold tracking-tight text-ink-900">{title}</h3>
      </div>
      <p className="mt-3 text-[13px] text-ink-600 leading-[1.55]">{body}</p>
      <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-700 font-mono uppercase tracking-[0.18em]">
        {items.map((it) => <li key={it}>· {it}</li>)}
      </ul>
    </div>
  );
}

function areaCls(area: Flag["area"]): string {
  switch (area) {
    case "Copilot":     return "bg-ink-900 text-parchment";
    case "Marketplace": return "bg-gilt-100 text-gilt-800";
    case "Discovery":   return "bg-lagoon-100 text-lagoon-700";
    case "Corporate":   return "bg-ink-100 text-ink-700";
    case "Growth":      return "bg-warning-100 text-warning-800";
    default:            return "bg-parchment text-ink-700";
  }
}

function AreaIcon({ area }: { area: Flag["area"] }) {
  const cls = "h-[16px] w-[16px]";
  const sw = 1.75;
  if (area === "Copilot")     return <Sparkles className={cls} strokeWidth={sw} />;
  if (area === "Marketplace") return <Package  className={cls} strokeWidth={sw} />;
  if (area === "Discovery")   return <Globe    className={cls} strokeWidth={sw} />;
  if (area === "Corporate")   return <Users    className={cls} strokeWidth={sw} />;
  if (area === "Growth")      return <Zap      className={cls} strokeWidth={sw} />;
  return <Beaker className={cls} strokeWidth={sw} />;
}
