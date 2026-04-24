import {
  Home,
  Compass,
  Route,
  Briefcase,
  Building2,
  Users,
  Coins,
  FileText,
  Store,
  Globe,
  MessageSquareText,
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
      {
        label: "Dashboard",
        href: "/app",
        icon: Home,
        description: "Today, at a glance",
      },
    ],
  },
  {
    title: "Explore",
    items: [
      {
        label: "Discover",
        href: "/app/discover",
        icon: Compass,
        description: "Countries, jobs, opportunities",
      },
      {
        label: "My Plan",
        href: "/app/plan",
        icon: Route,
        description: "Timeline, tasks, readiness",
      },
    ],
  },
  {
    title: "Build your life",
    items: [
      {
        label: "Career",
        href: "/app/career",
        icon: Briefcase,
        description: "Applications, CVs, interviews",
      },
      {
        label: "Life Setup",
        href: "/app/life",
        icon: Building2,
        description: "Housing, schools, banking, more",
      },
      {
        label: "Family",
        href: "/app/family",
        icon: Users,
        description: "Spouse, children, community",
      },
      {
        label: "Finance",
        href: "/app/finance",
        icon: Coins,
        description: "Salary, tax, cost of living",
      },
    ],
  },
  {
    title: "Execute",
    items: [
      {
        label: "Documents",
        href: "/app/documents",
        icon: FileText,
        description: "Checklist, vault, validation",
      },
      {
        label: "Marketplace",
        href: "/app/marketplace",
        icon: Store,
        description: "Verified partners & bookings",
      },
      {
        label: "Culture & Language",
        href: "/app/culture",
        icon: Globe,
        description: "Learning paths, cultural fit",
      },
      {
        label: "Messages",
        href: "/app/messages",
        icon: MessageSquareText,
        description: "Copilot threads & partner chats",
      },
    ],
  },
];

export const accountNav: NavItem[] = [
  { label: "Profile & Twin", href: "/app/profile", icon: Users },
  { label: "Settings", href: "/app/settings", icon: Compass },
  { label: "Billing", href: "/app/billing", icon: Coins },
];

export function flattenNav(): NavItem[] {
  return [...navSections.flatMap((s) => s.items), ...accountNav];
}
