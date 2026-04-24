// Guides — SEO-driven long-form content. In production this comes from a CMS.
// For now inline markdown-ish content keyed by slug.

export type GuideSummary = {
  slug: string;
  title: string;
  subtitle: string;
  category: "Visa" | "Moving" | "Tax" | "Family" | "Housing";
  readMinutes: number;
  publishedAt: string; // ISO
  heroBullets: string[];
  country?: string;
  authorName: string;
};

export type Guide = GuideSummary & {
  body: Array<{ kind: "p" | "h2" | "list" | "callout"; text?: string; items?: string[] }>;
};

export const GUIDES: Guide[] = [
  {
    slug: "eu-blue-card-playbook",
    title: "The EU Blue Card playbook",
    subtitle: "Everything a tech worker needs to get from offer letter to Schengen entry in under 10 weeks.",
    category: "Visa",
    readMinutes: 9,
    publishedAt: "2026-03-18",
    country: "DE",
    authorName: "Aisha Berhane",
    heroBullets: [
      "Salary threshold: €45,300 (tech) / €58,400 (non-tech) in 2026",
      "Typical turnaround 4–8 weeks for complete applications",
      "Permanent residency in 33 months with B1 German",
    ],
    body: [
      { kind: "p", text: "The EU Blue Card is the fastest visa route into Germany for skilled tech workers. If you have a university degree and an offer that clears the salary threshold, you clear the hard criteria. What usually slows people down is document prep." },
      { kind: "h2", text: "Who qualifies" },
      { kind: "list", items: [
        "Bachelor's or higher from a recognized institution (5+ years relevant experience works as a substitute since 2023)",
        "Binding job offer from a German employer",
        "Gross annual salary ≥ €45,300 for shortage occupations (IT, engineering, medicine, math) or ≥ €58,400 for everything else",
        "Valid passport with 6+ months remaining",
      ]},
      { kind: "h2", text: "The six documents that matter" },
      { kind: "list", items: [
        "Employment contract (original + German translation)",
        "University degree + academic transcripts, apostilled",
        "Proof of anabin recognition (most common slowdown)",
        "Passport-sized biometric photos",
        "Health insurance coverage letter (valid from day 1 of entry)",
        "Proof of address in Germany (accommodation contract)",
      ]},
      { kind: "callout", text: "If your university isn't on the anabin list pre-recognized, file the assessment first. It takes 4–8 weeks and blocks everything else." },
      { kind: "h2", text: "The timeline" },
      { kind: "p", text: "Week 0: Sign contract. Start anabin check and pull apostilled transcripts in parallel (they take weeks to arrive from abroad). Week 4: Book consulate appointment — Berlin / Frankfurt / Hamburg slots fill 6+ weeks out. Week 6: Submit. Week 8–10: Approval. Entry with D-visa. First 14 days: register address (Anmeldung) and convert D-visa to residence permit." },
      { kind: "h2", text: "Common pitfalls" },
      { kind: "list", items: [
        "Transcripts without apostille — rejected instantly",
        "Health insurance scheduled to start after entry — should cover from entry day",
        "Salary below the threshold because bonus is variable — base alone must clear the bar",
        "Missing Anmeldung appointment — blocks residence permit conversion",
      ]},
      { kind: "h2", text: "After approval: the first month" },
      { kind: "p", text: "Register your address within 14 days of move-in at the Bürgeramt. This is required to open a bank account, get your tax ID, and convert your D-visa to a residence permit. Wi-Fi, a SIM, and a bank appointment — in that order — will unblock everything else." },
      { kind: "p", text: "Glimmora walks each of these steps for you with deadline reminders, document validation, and a partner lawyer for edge cases. Start your plan to get the full checklist calibrated to your situation." },
    ],
  },
  {
    slug: "india-to-berlin-first-90-days",
    title: "India → Berlin: the first 90 days",
    subtitle: "A senior engineer's field guide to landing in Berlin — housing, Anmeldung, bank, taxes, kita spots.",
    category: "Moving",
    readMinutes: 11,
    publishedAt: "2026-02-27",
    country: "DE",
    authorName: "Rahul Iyer",
    heroBullets: [
      "Housing deposit: expect 2–3 months rent, held in a Kaution account",
      "Anmeldung: must happen within 14 days of move-in",
      "Tax ID arrives in ~3 weeks by post; without it, your employer withholds at Class VI",
    ],
    body: [
      { kind: "p", text: "Berlin is Europe's most relocation-ready tech city, but the first 90 days punish improvisation. This is the order I wish someone had given me." },
      { kind: "h2", text: "Before you fly" },
      { kind: "list", items: [
        "Book 30 days of temporary, registration-friendly housing (important: not every Airbnb allows Anmeldung)",
        "Open a Wise or Revolut multi-currency account to avoid SEPA headaches in week 1",
        "Bring originals of: degree + apostille, marriage certificate if partnered, vaccination records for kids",
        "Download Anmeldung forms in PDF and pre-fill them",
      ]},
      { kind: "h2", text: "Week 1–2: the paperwork sprint" },
      { kind: "p", text: "The Bürgeramt is the gate. You can book appointments online; on bad weeks they're 5 weeks out. Glimmora's plan auto-books your slot the day you confirm your lease so you're not waiting. Bring passport, rental contract, Wohnungsgeberbestätigung (landlord confirmation)." },
      { kind: "h2", text: "Week 2–4: banking, health insurance, tax" },
      { kind: "list", items: [
        "German bank accounts need your Anmeldung certificate. N26, DKB, or Sparkasse are the usual picks",
        "Public health insurance (TK, AOK) is mandatory. Choose before day 30 — your employer auto-enrolls you otherwise",
        "Tax ID (Steueridentifikationsnummer) arrives by post 2–3 weeks after Anmeldung",
      ]},
      { kind: "callout", text: "If you're married, the Anmeldung is also how you unlock joint tax class III/V for your spouse. Don't file this alone if your spouse will be a dependent." },
      { kind: "h2", text: "Kita spots if you have children" },
      { kind: "p", text: "Kitas fill 6+ months out. Every Kiezmutter knows the dance: enroll on 5+ lists, call weekly. Berlin has the Kita-Gutschein voucher system — apply at the Jugendamt in your Bezirk as soon as you have your Anmeldung." },
      { kind: "h2", text: "Month 2–3: tax optimisation" },
      { kind: "p", text: "The §34b relief for expat signing bonuses is underrated. If you got a lump-sum relocation payment, a Steuerberater can often split it across years. One hour of tax advice pays for itself if you relocated with a family." },
    ],
  },
  {
    slug: "portugal-tech-visa-fast-track",
    title: "Portugal D3 Tech Visa: the 3-week path",
    subtitle: "Lisbon's Tech Visa is the fastest EU route for remote-capable engineers. Here's how to actually use it.",
    category: "Visa",
    readMinutes: 7,
    publishedAt: "2026-04-10",
    country: "PT",
    authorName: "Sofia Almeida",
    heroBullets: [
      "Certified employer letter is the unlock",
      "No legal minimum salary, but €2.5k+/mo clears discretion thresholds",
      "Path to EU citizenship in 5 years with A2 Portuguese",
    ],
    body: [
      { kind: "p", text: "D3 is Portugal's fast-track visa for technical and scientific workers. It skips most SEF queues if your employer is on the certified list. Turnaround is typically 3 weeks from filing, sometimes faster." },
      { kind: "h2", text: "What you need" },
      { kind: "list", items: [
        "Offer from a company on the certified employers list (AICEP maintains it)",
        "University degree OR 5 years relevant experience + portfolio",
        "Clean background check from every country you've lived in for 1+ years as adult",
        "Proof of means — typically the employer letter covers this",
      ]},
      { kind: "h2", text: "Why D3 beats Digital Nomad Visa for most people" },
      { kind: "p", text: "Unlike the DNV, D3 is an employee route — you don't need to show €3,040/mo passive income. Your employer's certified status does the heavy lifting. And unlike the D7, you don't have to spend 16 months per year in Portugal." },
      { kind: "h2", text: "The NHR question" },
      { kind: "callout", text: "NHR (Non-Habitual Resident tax regime) ended for new applicants in 2024. Don't plan your move around it. The new IFICI regime exists but is narrower — only R&D, academic, and certified startup roles qualify." },
      { kind: "h2", text: "Lisbon vs Porto" },
      { kind: "p", text: "Lisbon has more jobs, more English, more startup density, and twice the rent. Porto is ~35% cheaper, cooler climate, and has a tight-knit tech scene but fewer senior roles. If you're remote-only, Porto is the hack. If you want in-person work options, Lisbon." },
    ],
  },
  {
    slug: "moving-with-family",
    title: "Moving abroad with kids: a 6-month checklist",
    subtitle: "School enrollment, medical records, pet transit, spouse visas — the things first-time movers miss.",
    category: "Family",
    readMinutes: 8,
    publishedAt: "2026-01-15",
    authorName: "Maya Ross",
    heroBullets: [
      "International schools have 6-12 month waitlists — start first",
      "Pet transit for cats: ~€800 · Dogs: €1,200-2,000",
      "Spouse work rights differ wildly by country — check before signing",
    ],
    body: [
      { kind: "p", text: "Moving alone is a logistics problem. Moving with a family is a family systems problem that looks like logistics. Here's what breaks if you don't plan 6 months ahead." },
      { kind: "h2", text: "Schools — start first, finish last" },
      { kind: "p", text: "International schools (IB / Cambridge / French Lycée network) have 6-12 month waitlists in every major EU city. In Berlin, Amsterdam, and Dublin, schools interview parents, not just children. If schools are a hard constraint, your destination is your school — not your employer." },
      { kind: "h2", text: "Medical records" },
      { kind: "list", items: [
        "Request full pediatric records including vaccinations (apostilled if possible)",
        "Prescription medications: bring 90-day supply + generic-name prescription",
        "Ongoing specialist care: get referral letters addressed to \"attending physician\"",
      ]},
      { kind: "h2", text: "Pets" },
      { kind: "p", text: "Cats and dogs need EU pet passports, rabies vaccination 21+ days before travel, and ISO microchips. Budget 2x what Google says for pet relocation — every airline has quirks." },
      { kind: "h2", text: "Spouse work rights" },
      { kind: "list", items: [
        "Germany (EU Blue Card dependent): work rights on day 1, no separate permit",
        "Netherlands (HSM): dependent permit, but full work rights",
        "Portugal (D3): family reunification unlocks work rights after 6 months",
        "Ireland (Critical Skills): spouse gets Stamp 1G, full work rights after 90 days",
      ]},
      { kind: "callout", text: "Rule of thumb: the country's tolerance for trailing spouses working signals its long-term policy on immigrants. It predicts how hard year 3 onward will be." },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
