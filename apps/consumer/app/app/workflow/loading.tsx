import { ModulePageSkeleton } from "@/components/backend/skeleton";

export default function WorkflowLoading() {
  return (
    <ModulePageSkeleton
      eyebrow="07 · Workflow & dependencies"
      title="What's the order of operations?"
      hint="Building the dependency graph across visa, documents, and finance…"
      metricCount={3}
      panelCount={3}
    />
  );
}
