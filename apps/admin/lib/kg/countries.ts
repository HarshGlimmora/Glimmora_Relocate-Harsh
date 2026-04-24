// Country data for Public Site tools. In production, this comes from the Knowledge Graph
// maintained via Admin Console. For now, hand-curated and mockable.

export type CountryData = {
  code: string;     // ISO-2
  flag: string;
  name: string;
  capital: string;
  // Visa
  visaRoute: string;
  visaTurnaround: string; // "4-8 weeks"
  eligibleFrom: string[]; // ISO-2 list of common origin passports
  // Economics
  medianSalaryEUR: number;
  effectiveTaxPct: number;
  costOfLivingIndex: number; // 100 = Berlin baseline
  rentMedianEUR: number;     // 1BR city-center
  // Social
  languagePrimary: string;
  englishAtWork: "widely" | "common" | "rare";
  // Program quality
  techJobsIndex: number;     // 100 = best
  pathToCitizenship: string; // "8 years"
  pathToPermanent: string;   // "5 years"
  familyFriendly: 1 | 2 | 3 | 4 | 5;
  // Free-form
  highlight: string;
  watchout: string;
};

export const COUNTRIES: CountryData[] = [
  {
    code: "DE", flag: "🇩🇪", name: "Germany", capital: "Berlin",
    visaRoute: "EU Blue Card",
    visaTurnaround: "4-8 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "ID", "MX", "AR", "KE", "VN", "PK", "ZA"],
    medianSalaryEUR: 78000,
    effectiveTaxPct: 36,
    costOfLivingIndex: 100,
    rentMedianEUR: 1340,
    languagePrimary: "German",
    englishAtWork: "widely",
    techJobsIndex: 95,
    pathToCitizenship: "8 years",
    pathToPermanent: "33 months",
    familyFriendly: 5,
    highlight: "Largest EU tech market with fast-track permanent residency after just 33 months.",
    watchout: "Rental market is competitive in Berlin/Munich — start housing search 4 months out.",
  },
  {
    code: "NL", flag: "🇳🇱", name: "Netherlands", capital: "Amsterdam",
    visaRoute: "Highly Skilled Migrant",
    visaTurnaround: "2-4 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "MX", "AR", "PK", "ZA"],
    medianSalaryEUR: 72000,
    effectiveTaxPct: 37,
    costOfLivingIndex: 115,
    rentMedianEUR: 1720,
    languagePrimary: "Dutch",
    englishAtWork: "widely",
    techJobsIndex: 82,
    pathToCitizenship: "5 years",
    pathToPermanent: "5 years",
    familyFriendly: 5,
    highlight: "30% ruling — tax break that can save €20-25k/yr for the first 5 years.",
    watchout: "Housing is extremely tight. Queue for social housing can take 10+ years.",
  },
  {
    code: "PT", flag: "🇵🇹", name: "Portugal", capital: "Lisbon",
    visaRoute: "D3 Tech Visa",
    visaTurnaround: "3-6 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "ID", "MX", "AR", "KE", "VN", "PK", "BD", "ZA", "CO"],
    medianSalaryEUR: 42000,
    effectiveTaxPct: 28,
    costOfLivingIndex: 72,
    rentMedianEUR: 980,
    languagePrimary: "Portuguese",
    englishAtWork: "common",
    techJobsIndex: 65,
    pathToCitizenship: "5 years",
    pathToPermanent: "5 years",
    familyFriendly: 4,
    highlight: "Lowest cost of living in Western EU + fastest path to citizenship (5 years).",
    watchout: "Salaries are lower. Makes sense if you earn in EUR on a remote contract or stay long.",
  },
  {
    code: "IE", flag: "🇮🇪", name: "Ireland", capital: "Dublin",
    visaRoute: "Critical Skills Permit",
    visaTurnaround: "6-10 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "PK", "ZA", "VN"],
    medianSalaryEUR: 62000,
    effectiveTaxPct: 40,
    costOfLivingIndex: 125,
    rentMedianEUR: 1860,
    languagePrimary: "English",
    englishAtWork: "widely",
    techJobsIndex: 88,
    pathToCitizenship: "5 years",
    pathToPermanent: "5 years",
    familyFriendly: 4,
    highlight: "English-first culture, European HQ for most US tech giants.",
    watchout: "Housing shortage is acute. Expect 3-6 months to find long-term housing in Dublin.",
  },
  {
    code: "ES", flag: "🇪🇸", name: "Spain", capital: "Madrid",
    visaRoute: "Digital Nomad Visa",
    visaTurnaround: "2-4 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "ID", "MX", "AR", "KE", "VN", "PK", "CO"],
    medianSalaryEUR: 38000,
    effectiveTaxPct: 30,
    costOfLivingIndex: 80,
    rentMedianEUR: 1120,
    languagePrimary: "Spanish",
    englishAtWork: "common",
    techJobsIndex: 60,
    pathToCitizenship: "10 years",
    pathToPermanent: "5 years",
    familyFriendly: 5,
    highlight: "Beckham Law — 24% flat tax for 6 years if you qualify as a new arrival.",
    watchout: "Autónomo (self-employed) social security is punishingly expensive.",
  },
  {
    code: "FR", flag: "🇫🇷", name: "France", capital: "Paris",
    visaRoute: "Passeport Talent",
    visaTurnaround: "4-6 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "MX", "AR", "VN", "PK", "ZA"],
    medianSalaryEUR: 55000,
    effectiveTaxPct: 41,
    costOfLivingIndex: 110,
    rentMedianEUR: 1480,
    languagePrimary: "French",
    englishAtWork: "common",
    techJobsIndex: 75,
    pathToCitizenship: "5 years",
    pathToPermanent: "5 years",
    familyFriendly: 5,
    highlight: "Healthcare is world-class. Parental leave + childcare subsidies are generous.",
    watchout: "Bureaucracy is no joke. First 6 months involve a lot of paperwork.",
  },
  {
    code: "SE", flag: "🇸🇪", name: "Sweden", capital: "Stockholm",
    visaRoute: "Work Permit",
    visaTurnaround: "3-8 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "MX", "PK", "ZA"],
    medianSalaryEUR: 58000,
    effectiveTaxPct: 42,
    costOfLivingIndex: 112,
    rentMedianEUR: 1580,
    languagePrimary: "Swedish",
    englishAtWork: "widely",
    techJobsIndex: 80,
    pathToCitizenship: "5 years",
    pathToPermanent: "4 years",
    familyFriendly: 5,
    highlight: "Work-life balance is a right, not a perk. 480 days of parental leave to split.",
    watchout: "Public rental housing is allocated by queue — expect to rent in the private market first.",
  },
  {
    code: "DK", flag: "🇩🇰", name: "Denmark", capital: "Copenhagen",
    visaRoute: "Fast-track (Pay Limit Scheme)",
    visaTurnaround: "2-4 weeks",
    eligibleFrom: ["IN", "BR", "TR", "UA", "NG", "EG", "PH", "MX", "PK", "ZA"],
    medianSalaryEUR: 68000,
    effectiveTaxPct: 45,
    costOfLivingIndex: 120,
    rentMedianEUR: 1720,
    languagePrimary: "Danish",
    englishAtWork: "widely",
    techJobsIndex: 78,
    pathToCitizenship: "9 years",
    pathToPermanent: "4 years",
    familyFriendly: 5,
    highlight: "Expat tax regime — 27% flat for 7 years if you earn DKK 72k+/mo.",
    watchout: "Among the highest standard tax rates in the OECD. Expat regime is essential.",
  },
];

export function getCountry(code: string): CountryData | undefined {
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

// Purchasing power adjustment — rough "how far your EUR goes" compared to Berlin (index 100).
// Index 72 means Lisbon is 28% cheaper than Berlin for the same basket.
export function purchasingPowerRatio(fromCode: string, toCode: string): number {
  const from = getCountry(fromCode);
  const to = getCountry(toCode);
  if (!from || !to) return 1;
  return from.costOfLivingIndex / to.costOfLivingIndex;
}
