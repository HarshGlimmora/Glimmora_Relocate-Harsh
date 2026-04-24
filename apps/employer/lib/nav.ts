import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  HandCoins,
  Building2,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}
export interface NavSection { title: string; items: NavItem[] }

export const navSections: NavSection[] = [
  {
    title: "Hiring",
    items: [
      { label: "Dashboard",  href: "/app",             icon: LayoutDashboard },
      { label: "Jobs",       href: "/app/jobs",        icon: Briefcase },
      { label: "Candidates", href: "/app/candidates",  icon: Users },
      { label: "Interviews", href: "/app/interviews",  icon: MessageSquare },
      { label: "Offers",     href: "/app/offers",      icon: HandCoins },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Profile",    href: "/app/company",     icon: Building2 },
      { label: "Team",       href: "/app/team",        icon: Users },
    ],
  },
];

export const accountNav: NavItem[] = [
  { label: "Settings", href: "/app/settings", icon: Settings },
  { label: "Billing",  href: "/app/billing",  icon: CreditCard },
];

export function flattenNav(): NavItem[] {
  return [...navSections.flatMap(s => s.items), ...accountNav];
}
