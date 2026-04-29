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
