import { ModulePageSkeleton } from "@/components/backend/skeleton";

export default function JobsLoading() {
  return (
    <ModulePageSkeleton
      eyebrow="02 · Job fit"
      title="Is your career path realistic here?"
      hint="Running the AI job-fit analysis with your country, finance, and visa context…"
      metricCount={4}
      panelCount={3}
    />
  );
}
