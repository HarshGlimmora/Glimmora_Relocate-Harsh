import { ModulePageSkeleton } from "@/components/backend/skeleton";

export default function FinanceLoading() {
  return (
    <ModulePageSkeleton
      eyebrow="04 · Financial feasibility"
      title="Affordable comfortably, or only on paper?"
      hint="Stress-testing take-home, monthly cost, surplus, and runway…"
      metricCount={4}
      panelCount={2}
    />
  );
}
