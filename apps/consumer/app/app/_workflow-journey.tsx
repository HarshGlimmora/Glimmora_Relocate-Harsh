/**
 * Workflow journey — horizontal step-flow visualisation for the dashboard.
 *
 * Data-driven: consumes the same `WORKFLOW_STEPS` / `WorkflowCompletion` /
 * `firstIncompleteStep` already used by the sidebar, auto-skip CTA, and
 * navigation logic. Nothing is hardcoded here — adding a step in
 * `lib/workflow.ts` makes it appear automatically.
 *
 * Pure server component: all interactions are CSS-only (hover transforms,
 * animated gradients, pulse rings), so this renders inside an RSC tree
 * without a `"use client"` boundary.
 */

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  Check,
  FileCheck,
  FileText,
  Globe,
  Languages,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKFLOW_STEPS,
  type WorkflowCompletion,
  type WorkflowStep,
  type WorkflowStepId,
} from "@/lib/workflow";

const STEP_ICONS: Record<WorkflowStepId, LucideIcon> = {
  dashboard: Sparkles,
  resume: FileText,
  profile: UserCircle,
  country: Globe,
  jobs: Briefcase,
  visa: ShieldCheck,
  finance: Wallet,
  documents: FileCheck,
  family: Users,
  culture: Languages,
};

type StepState = "completed" | "active" | "pending";

function stepStateFor(
  step: WorkflowStep,
  completion: WorkflowCompletion,
  activeId: WorkflowStepId,
): StepState {
  if (completion[step.id]) return "completed";
  if (step.id === activeId) return "active";
  return "pending";
}

export function WorkflowJourney({
  completion,
  activeId,
}: {
  completion: WorkflowCompletion;
  /** The id of the step the user should tackle next (e.g. `firstIncompleteStep`). */
  activeId: WorkflowStepId;
}) {
  // The dashboard is the entry surface and not a workflow step the user
  // performs — strip it from the visualisation.
  const steps = WORKFLOW_STEPS.filter((s) => s.id !== "dashboard");

  const totalSteps = steps.length;
  const doneCount = steps.filter((s) => completion[s.id]).length;
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  return (
    <section
      aria-label="Relocation workflow"
      className="rounded-2xl border border-ink-200 bg-white p-5 md:p-6 shadow-elev-sm"
    >
      {/* Header band */}
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
            Your journey
          </p>
          <h2 className="mt-1 font-sans text-[18px] font-semibold tracking-[-0.015em] text-ink-900">
            Resume → Profile → Country → Job fit → Visa → Finance → Documents → Family → Culture
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tabular-nums text-ink-700">
            {doneCount}/{totalSteps} done
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-success-500 to-success-400 transition-[width] duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
              aria-label="Workflow completion"
            />
          </div>
        </div>
      </header>

      {/* Horizontal step flow — scrolls on narrow viewports */}
      <ol
        className={cn(
          "flex items-stretch gap-0 overflow-x-auto pb-2",
          "snap-x snap-mandatory scroll-pl-2",
          // Subtle scrollbar styling so the journey row doesn't feel
          // visually noisy when overflowing on tablet widths.
          "[scrollbar-width:thin]",
        )}
      >
        {steps.map((step, idx) => {
          const state = stepStateFor(step, completion, activeId);
          const isLast = idx === steps.length - 1;
          const nextState = !isLast
            ? stepStateFor(steps[idx + 1]!, completion, activeId)
            : null;

          return (
            <li
              key={step.id}
              className="flex shrink-0 items-stretch snap-start"
            >
              <StepCard step={step} index={idx} state={state} />
              {!isLast ? (
                <StepConnector
                  fromState={state}
                  toState={nextState!}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
        Tap any step to open it. Steps unlock as you complete the ones before them.
      </p>
    </section>
  );
}

// ============================================================================
// Step card
// ============================================================================

function StepCard({
  step,
  index,
  state,
}: {
  step: WorkflowStep;
  index: number;
  state: StepState;
}) {
  const Icon = STEP_ICONS[step.id] ?? Sparkles;

  // Per-state styling matrix — kept declarative so adding a 4th state later
  // is a one-line change.
  const styling: Record<
    StepState,
    {
      shell: string;
      iconWrap: string;
      iconColor: string;
      label: string;
      badge: string;
      glow: string;
    }
  > = {
    completed: {
      shell:
        "border-success-200 bg-success-50/60 hover:bg-success-50 hover:-translate-y-1 hover:shadow-elev-md",
      iconWrap: "bg-success-500 text-white ring-2 ring-success-200",
      iconColor: "text-white",
      label: "text-success-800",
      badge: "bg-success-500 text-white",
      glow: "",
    },
    active: {
      shell:
        "border-caramel-700/40 bg-gradient-to-br from-gilt-50 to-white hover:-translate-y-1 hover:shadow-elev-lg shadow-glow-gilt",
      iconWrap: "bg-caramel-700 text-parchment ring-2 ring-gilt-300",
      iconColor: "text-parchment",
      label: "text-ink-900",
      badge: "bg-caramel-700 text-parchment",
      glow: "",
    },
    pending: {
      shell:
        "border-dashed border-ink-200 bg-white hover:border-ink-300 hover:-translate-y-0.5 hover:shadow-elev-sm",
      iconWrap: "bg-ink-50 text-ink-400 ring-2 ring-ink-100",
      iconColor: "text-ink-400",
      label: "text-ink-600",
      badge: "bg-ink-200 text-ink-600",
      glow: "",
    },
  };

  const s = styling[state];

  return (
    <Link
      href={step.href}
      aria-label={`${step.label} — ${state}`}
      className={cn(
        "group relative flex w-[112px] flex-col items-center justify-between rounded-2xl border bg-white p-3 transition-all duration-300 ease-out",
        "md:w-[120px]",
        s.shell,
      )}
    >
      {/* Subtle pulsing aura on the active step — pure CSS, no JS. */}
      {state === "active" ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[20px] bg-gilt-300/30 opacity-60 blur-md animate-pulse-soft"
        />
      ) : null}

      {/* Step number eyebrow */}
      <p className="relative z-10 mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-500">
        Step {index + 1}
      </p>

      {/* Icon disc with state-tinted background */}
      <div className="relative z-10">
        <div
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105",
            s.iconWrap,
          )}
        >
          {state === "completed" ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <Icon className={cn("h-5 w-5", s.iconColor)} strokeWidth={2} />
          )}
          {/* Tiny status pip on the icon disc */}
          {state === "active" ? (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-gilt-400 opacity-75" />
              <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-gilt-500 ring-2 ring-white" />
            </span>
          ) : null}
        </div>
      </div>

      {/* Label */}
      <p
        className={cn(
          "relative z-10 mt-2 text-center text-[13px] font-semibold leading-tight",
          s.label,
        )}
      >
        {step.label}
      </p>

      {/* State chip */}
      <span
        className={cn(
          "relative z-10 mt-2 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]",
          s.badge,
        )}
      >
        {state === "completed" ? "Done" : state === "active" ? "Now" : "Pending"}
      </span>
    </Link>
  );
}

// ============================================================================
// Connector between cards
// ============================================================================

function StepConnector({
  fromState,
  toState,
}: {
  fromState: StepState;
  toState: StepState;
}) {
  // The connector is "completed" only when the step BEFORE it is done.
  // The connector is "active" when crossing from done into the current step
  // — that's where we run an animated flow.
  const isCompleted = fromState === "completed" && toState === "completed";
  const isFlowing = fromState === "completed" && toState === "active";

  return (
    <div
      aria-hidden
      className="relative flex w-6 shrink-0 items-center md:w-8"
    >
      {/* Track */}
      <span
        className={cn(
          "absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full",
          isCompleted
            ? "bg-success-500"
            : isFlowing
            ? "bg-gradient-to-r from-success-500 to-gilt-400"
            : "bg-ink-200",
          isFlowing &&
            // Animated dash-flow effect using a striped background that
            // moves rightward.
            "bg-[length:200%_100%] [background-image:linear-gradient(90deg,#10B27E_0%,#10B27E_45%,#E4B538_55%,#E4B538_100%)] animate-[journeyFlow_2.2s_linear_infinite]",
        )}
      />
      {/* Arrow tick */}
      <span
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 text-[10px] leading-none",
          isCompleted
            ? "text-success-500"
            : isFlowing
            ? "text-gilt-500"
            : "text-ink-300",
        )}
      >
        ▶
      </span>

      {/* Local keyframes — scoped via Tailwind's arbitrary keyframes syntax */}
      <style>{`
        @keyframes journeyFlow {
          from { background-position: 200% 0; }
          to   { background-position: 0% 0; }
        }
      `}</style>
    </div>
  );
}
