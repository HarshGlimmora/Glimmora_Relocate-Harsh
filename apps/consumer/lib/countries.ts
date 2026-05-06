/**
 * Country display layer.
 *
 * Backend stores ISO-3166-1 alpha-2 codes. The UI must show full names.
 *
 *   Backend:  target_country = "DE"
 *   UI:       "Germany"
 *   Backend:  current_country = "IN"
 *   UI:       "India"
 *
 * Use `countryName(code)` everywhere a country surfaces in user-facing
 * copy. Use `lookupCountryByName(input)` when accepting free-form user
 * input — accepts a name or an ISO-2 code and returns a normalized ISO-2
 * code that can be sent back to the backend.
 *
 * Adding a country: append to COUNTRIES with `{ code, name, region? }`.
 * The list is curated to the destinations the product actually supports
 * + common origin countries; full ISO-3166 catalogue is intentionally
 * not bundled.
 */

export interface CountryEntry {
  /** ISO-3166-1 alpha-2 (e.g. "DE"). Always uppercase. */
  code: string;
  /** Display name shown to the user (e.g. "Germany"). */
  name: string;
  /** Optional region for grouping in selectors. */
  region?: "Europe" | "North America" | "Asia" | "Oceania" | "Middle East" | "South America" | "Africa";
  /** Common alternates we'll accept on input (lowercase). */
  aliases?: string[];
}

export const COUNTRIES: readonly CountryEntry[] = [
  // Destinations the product actively supports
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe", aliases: ["holland"] },
  { code: "IE", name: "Ireland", region: "Europe" },
  { code: "GB", name: "United Kingdom", region: "Europe", aliases: ["uk", "britain", "england", "great britain"] },
  { code: "FR", name: "France", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "NO", name: "Norway", region: "Europe" },
  { code: "DK", name: "Denmark", region: "Europe" },
  { code: "FI", name: "Finland", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  { code: "AT", name: "Austria", region: "Europe" },
  { code: "BE", name: "Belgium", region: "Europe" },
  { code: "PL", name: "Poland", region: "Europe" },
  { code: "EE", name: "Estonia", region: "Europe" },
  { code: "CZ", name: "Czech Republic", region: "Europe", aliases: ["czechia"] },
  { code: "CA", name: "Canada", region: "North America" },
  { code: "US", name: "United States", region: "North America", aliases: ["usa", "america", "united states of america"] },
  { code: "MX", name: "Mexico", region: "North America" },
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
  { code: "AE", name: "United Arab Emirates", region: "Middle East", aliases: ["uae", "dubai"] },
  { code: "SA", name: "Saudi Arabia", region: "Middle East" },
  { code: "QA", name: "Qatar", region: "Middle East" },
  { code: "IL", name: "Israel", region: "Middle East" },
  { code: "SG", name: "Singapore", region: "Asia" },
  { code: "JP", name: "Japan", region: "Asia" },
  { code: "KR", name: "South Korea", region: "Asia", aliases: ["korea"] },
  { code: "HK", name: "Hong Kong", region: "Asia" },
  { code: "TW", name: "Taiwan", region: "Asia" },
  { code: "MY", name: "Malaysia", region: "Asia" },
  { code: "TH", name: "Thailand", region: "Asia" },
  { code: "VN", name: "Vietnam", region: "Asia" },
  { code: "PH", name: "Philippines", region: "Asia" },
  { code: "ID", name: "Indonesia", region: "Asia" },

  // Common origin countries
  { code: "IN", name: "India", region: "Asia" },
  { code: "PK", name: "Pakistan", region: "Asia" },
  { code: "BD", name: "Bangladesh", region: "Asia" },
  { code: "LK", name: "Sri Lanka", region: "Asia" },
  { code: "NP", name: "Nepal", region: "Asia" },
  { code: "CN", name: "China", region: "Asia" },
  { code: "BR", name: "Brazil", region: "South America" },
  { code: "AR", name: "Argentina", region: "South America" },
  { code: "CL", name: "Chile", region: "South America" },
  { code: "CO", name: "Colombia", region: "South America" },
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "NG", name: "Nigeria", region: "Africa" },
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "MA", name: "Morocco", region: "Africa" },
  { code: "TR", name: "Türkiye", region: "Europe", aliases: ["turkey"] },
  { code: "RU", name: "Russia", region: "Europe" },
  { code: "UA", name: "Ukraine", region: "Europe" },
];

const _byCode: Record<string, CountryEntry> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
);

const _byName: Record<string, CountryEntry> = Object.fromEntries(
  COUNTRIES.flatMap((c) => [
    [c.name.toLowerCase(), c] as [string, CountryEntry],
    ...(c.aliases ?? []).map((a) => [a.toLowerCase(), c] as [string, CountryEntry]),
  ]),
);

/**
 * Get the display name for an ISO-2 code. Falls back to the input if
 * unknown — never throws, never returns empty (so it's safe in JSX).
 */
export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  const upper = code.toUpperCase();
  return _byCode[upper]?.name ?? upper;
}

/** Format an origin → destination pair for display. */
export function originDestinationLabel(
  fromCode: string | null | undefined,
  toCode: string | null | undefined,
): string {
  const from = countryName(fromCode);
  const to = countryName(toCode);
  if (from && to) return `${from} → ${to}`;
  if (to) return to;
  if (from) return from;
  return "—";
}

/**
 * Accept free-form user input ("germany", "DE", "Deutschland"-no, "uk")
 * and return the canonical ISO-2 code, or null if not recognised.
 */
export function lookupCountryByName(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    return _byCode[upper]?.code ?? null;
  }
  return _byName[trimmed.toLowerCase()]?.code ?? null;
}

/** Useful when you need {value, label} pairs for a select. */
export function countryOptions(): { value: string; label: string }[] {
  return COUNTRIES.map((c) => ({ value: c.code, label: c.name })).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
