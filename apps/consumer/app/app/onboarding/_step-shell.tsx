import * as React from "react";
import { ONBOARDING_STEPS, type OnboardingStepId } from "@/lib/onboarding";

/**
 * Server-only shell used by every onboarding step page. Renders the
 * step pills (`[data-onboarding-stepper]`) + page header. The Continue
 * button + Back link live in `_step-nav.tsx` (client) — keeping this
 * file free of `<Link>` so it doesn't accidentally need the navigation
 * context when imported into a client tree.
 */
export function OnboardingShell({
  active,
  title,
  description,
  children,
}: {
  active: OnboardingStepId;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[860px] px-6 py-12" data-onboarding-step={active}>
      <Stepper active={active} />
      <header className="mb-6 mt-6">
        <h1 className="font-sans text-[clamp(1.6rem,3.2vw,2.25rem)] font-semibold tracking-[-0.02em] text-ink-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-[14px] leading-[1.6] text-ink-600">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function Stepper({ active }: { active: OnboardingStepId }) {
  const activeIdx = ONBOARDING_STEPS.findIndex((s) => s.id === active);
  return (
    <ol
      data-onboarding-stepper
      className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-500"
    >
      {ONBOARDING_STEPS.map((s, i) => {
        const isActive = s.id === active;
        const isPast = i < activeIdx;
        return (
          <React.Fragment key={s.id}>
            <li
              data-step={s.id}
              data-step-state={isActive ? "active" : isPast ? "past" : "future"}
              className={
                "rounded-full border px-2.5 py-1 " +
                (isActive
                  ? "border-ink-900 bg-ink-900 text-parchment"
                  : isPast
                  ? "border-ink-300 bg-white text-ink-700"
                  : "border-ink-200 bg-white text-ink-400")
              }
            >
              {s.index}. {s.label}
            </li>
            {i < ONBOARDING_STEPS.length - 1 ? (
              <span className="text-ink-300">·</span>
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}
