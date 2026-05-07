/**
 * Sidebar navigation — driven by the approved consumer workflow order:
 *
 *   Dashboard → Resume → Profile → Country → Job fit → Visa →
 *   Finance → Documents → Family → Culture
 *
 * Source of truth for the order is `lib/workflow.ts`; this file maps each
 * workflow step to its sidebar icon and exposes the legacy "Other"
 * entries that aren't part of the primary flow.
 */

import {
  Home,
  Compass,
  FileSpreadsheet,
  IdCard,
  Briefcase,
  Globe2,
  Users,
  Coins,
  FolderClosed,
  Network,
  Languages,
  CalendarRange,
  Trophy,
  Settings,
  CreditCard,
  Store,
  Route,
  type LucideIcon,
} from "lucide-react";
import {
  WORKFLOW_STEPS,
  type WorkflowCompletion,
  type WorkflowStepId,
} from "@/lib/workflow";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
  /** Workflow step this item maps to, when applicable. */
  stepId?: WorkflowStepId;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ICON_BY_STEP: Record<WorkflowStepId, LucideIcon> = {
  dashboard: Home,
  resume: FileSpreadsheet,
  profile: IdCard,
  country: Globe2,
  jobs: Briefcase,
  visa: IdCard,
  finance: Coins,
  documents: FolderClosed,
  family: Users,
  culture: Languages,
};

const DESCRIPTION_BY_STEP: Partial<Record<WorkflowStepId, string>> = {
  dashboard: "Today's status",
  resume: "Upload & parse",
  profile: "Confirm details",
  country: "Origin vs destination",
  jobs: "Role, salary, sponsor",
  visa: "Route & blockers",
  finance: "Affordability",
  documents: "Checklist",
  family: "Household impact",
  culture: "Norms & language",
};

const workflowItems: NavItem[] = WORKFLOW_STEPS.map((s) => ({
  label: s.label,
  href: s.href,
  icon: ICON_BY_STEP[s.id],
  description: DESCRIPTION_BY_STEP[s.id],
  stepId: s.id,
}));

export const navSections: NavSection[] = [
  { title: "Workflow", items: workflowItems },
  {
    title: "More",
    items: [
      { label: "Workflow graph", href: "/app/workflow", icon: Network },
      { label: "Timeline", href: "/app/timeline", icon: CalendarRange },
      { label: "Final synthesis", href: "/app/synthesis", icon: Trophy },
      { label: "Discover", href: "/app/discover", icon: Compass },
      { label: "Plan", href: "/app/plan", icon: Route },
      { label: "Marketplace", href: "/app/marketplace", icon: Store },
    ],
  },
];

/**
 * Intent emphasis is no longer used to reorder the sidebar — the
 * approved workflow has a fixed sequence. Kept as a no-op so older
 * call sites continue to type-check while we phase intent-driven
 * ordering out of the consumer flow.
 */
export function navSectionsForIntent(_emphasis: readonly string[] | null): NavSection[] {
  return navSections;
}

export const accountNav: NavItem[] = [
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
];

export function flattenNav(): NavItem[] {
  return [...navSections.flatMap((s) => s.items), ...accountNav];
}

export type { WorkflowCompletion };
