import { ModulePageSkeleton } from "@/components/backend/skeleton";

export default function CountryLoading() {
  return (
    <ModulePageSkeleton
      eyebrow="01 · Country comparison"
      title="Pick your shortlist. We rank it."
      hint="Loading curated 2026-Q1 country metrics and your saved shortlist…"
      metricCount={3}
      panelCount={3}
    />
  );
}
