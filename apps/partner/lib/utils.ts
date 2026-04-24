import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(s?: string | null) {
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || first.toUpperCase();
}

export function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "—";
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${amount.toLocaleString("en-GB")}`;
}

export function relativeTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  const mins = Math.round(diff / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
}

export function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    HOUSING: "Housing",
    SCHOOL: "Schools",
    BANK: "Banking",
    LEGAL: "Legal · Visa",
    INSURANCE: "Insurance",
    LANGUAGE: "Language",
    LOCAL: "Local services",
  };
  return map[cat] ?? cat;
}
