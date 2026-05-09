import { ModulePageSkeleton } from "@/components/backend/skeleton";

export default function VisaLoading() {
  return (
    <ModulePageSkeleton
      eyebrow="03 · Visa direction"
      title="The most likely route — and what blocks it."
      hint="Mapping primary route, requirements, and blockers from your latest analyses…"
      metricCount={4}
      panelCount={3}
    />
  );
}
