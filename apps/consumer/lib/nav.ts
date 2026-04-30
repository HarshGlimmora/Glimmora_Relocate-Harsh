/**
 * Sidebar navigation — ordered to mirror the backend pipeline:
 *   Auth → Resume → Profile → Country → Jobfit → Visa → Family →
 *   Finance → Documents → Workflow → Culture → Timeline → Synthesis.
 *
 * Older routes (`/app/discover`, `/app/career`, `/app/life`,
 * `/app/marketplace`, `/app/messages`, `/app/plan`) are kept available
 * but de-emphasized under "Other" since the user's main flow goes
 * through the backend-driven analysis pages above.
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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Per-module slug used for intent emphasis. Only Analysis items have one.
 */
type ModuleSlug =
  | "country" | "jobs" | "visa" | "family" | "finance"
  | "documents" | "workflow" | "culture" | "timeline";

const SLUG_BY_HREF: Record<string, ModuleSlug> = {
  "/app/country": "country",
  "/app/jobs": "jobs",
  "/app/visa": "visa",
  "/app/family": "family",
  "/app/finance": "finance",
  "/app/documents": "documents",
  "/app/workflow": "workflow",
  "/app/culture": "culture",
  "/app/timeline": "timeline",
};

/**
 * Reorders the Analysis section so the user's intent-priority modules sit
 * at the top. `emphasis` is the ordered list from `lib/intent.ts`.
 */
export function navSectionsForIntent(emphasis: readonly string[] | null): NavSection[] {
  if (!emphasis?.length) return navSections;
  const order = new Map<string, number>();
  emphasis.forEach((slug, i) => order.set(slug, i));
  return navSections.map((s) => {
    if (s.title !== "Analysis") return s;
    const items = [...s.items].sort((a, b) => {
      const sa = SLUG_BY_HREF[a.href];
      const sb = SLUG_BY_HREF[b.href];
      const ra = sa ? order.get(sa) ?? 99 : 99;
      const rb = sb ? order.get(sb) ?? 99 : 99;
      return ra - rb;
    });
    return { ...s, items };
  });
}

export const navSections: NavSection[] = [
  {
    title: "Home",
    items: [
      { label: "Dashboard", href: "/app", icon: Home, description: "Today's status" },
    ],
  },
  {
    title: "Onboarding",
    items: [
      { label: "Resume", href: "/app/onboarding/resume", icon: FileSpreadsheet, description: "Upload & parse" },
      { label: "Profile", href: "/app/onboarding/profile", icon: IdCard, description: "Confirm details" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { label: "Country", href: "/app/country", icon: Globe2, description: "Origin vs destination" },
      { label: "Job fit", href: "/app/jobs", icon: Briefcase, description: "Role, salary, sponsor" },
      { label: "Visa", href: "/app/visa", icon: IdCard, description: "Route & blockers" },
      { label: "Family", href: "/app/family", icon: Users, description: "Household impact" },
      { label: "Finance", href: "/app/finance", icon: Coins, description: "Affordability" },
      { label: "Documents", href: "/app/documents", icon: FolderClosed, description: "Checklist" },
      { label: "Workflow", href: "/app/workflow", icon: Network, description: "Dependencies" },
      { label: "Culture", href: "/app/culture", icon: Languages, description: "Norms & language" },
      { label: "Timeline", href: "/app/timeline", icon: CalendarRange, description: "Phases & milestones" },
    ],
  },
  {
    title: "Decision",
    items: [
      { label: "Final synthesis", href: "/app/synthesis", icon: Trophy, description: "Verdict & next actions" },
    ],
  },
  {
    title: "Other",
    items: [
      { label: "Discover", href: "/app/discover", icon: Compass },
      { label: "Plan", href: "/app/plan", icon: Route },
      { label: "Marketplace", href: "/app/marketplace", icon: Store },
    ],
  },
];

export const accountNav: NavItem[] = [
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
];

export function flattenNav(): NavItem[] {
  return [...navSections.flatMap((s) => s.items), ...accountNav];
}
