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

export function money(amount: number | null | undefined, currency: string | null | undefined = "EUR"): string {
  if (amount == null) return "—";
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${amount.toLocaleString("en-GB")}`;
}

export function relativeTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const future = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.round(abs / (1000 * 60 * 60 * 24));
  if (days === 0) return future ? "today" : "today";
  if (days === 1) return future ? "tomorrow" : "yesterday";
  if (days < 7) return future ? `in ${days} days` : `${days} days ago`;
  if (days < 14) return future ? "in 1 week" : "1 week ago";
  if (days < 30) {
    const w = Math.floor(days / 7);
    return future ? `in ${w} weeks` : `${w} weeks ago`;
  }
  const m = Math.floor(days / 30);
  return future ? `in ${m} month${m === 1 ? "" : "s"}` : `${m} month${m === 1 ? "" : "s"} ago`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
