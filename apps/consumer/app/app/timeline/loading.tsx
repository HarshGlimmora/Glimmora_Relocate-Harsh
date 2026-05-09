import { ModulePageSkeleton } from "@/components/backend/skeleton";

export default function TimelineLoading() {
  return (
    <ModulePageSkeleton
      eyebrow="09 · Timeline"
      title="When does each piece have to happen?"
      hint="Mapping phases, milestones, and blockers from your latest analyses…"
      metricCount={3}
      panelCount={3}
    />
  );
}
