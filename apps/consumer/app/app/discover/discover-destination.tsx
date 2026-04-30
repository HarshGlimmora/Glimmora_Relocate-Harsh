import Link from "next/link";
import {
  ArrowUpRight, MapPin, Sparkles, Train, Banknote, Wifi, HeartPulse,
  Home, Coffee, GraduationCap, Briefcase, Languages, ShieldCheck,
} from "lucide-react";

// ---- Destination knowledge base — seeded for 4 cities (DE/NL/IE/PT).
// In W4, this becomes data-driven from a Country Knowledge Graph.
type CityInfo = {
  city: string;
  country: string;
  flag: string;
  intro: string;
  neighborhoods: { name: string; vibe: string; rentRange: string; tag: string }[];
  transit: string[];
  banking: string[];
  mobile: string[];
  healthcare: string[];
  language: { local: string; englishOk: string };
  costSnapshot: { l: string; v: string }[];
  studentNotes?: string[];
  familyNotes?: string[];
};

const BERLIN: CityInfo = {
  city: "Berlin",
  country: "DE",
  flag: "🇩🇪",
  intro: "Capital of Germany. Affordable for a major EU city, English-friendly in tech and academia, deep public-transport coverage. Bureaucracy is real — appointments matter.",
  neighborhoods: [
    { name: "Prenzlauer Berg",  vibe: "Family-friendly, cafés, parks, good schools",      rentRange: "€1,200–1,800", tag: "popular" },
    { name: "Mitte",            vibe: "Central, walkable, denser, near most offices",     rentRange: "€1,400–2,000", tag: "central" },
    { name: "Kreuzberg",        vibe: "Diverse, nightlife, food scene, younger crowd",    rentRange: "€1,100–1,600", tag: "lively" },
    { name: "Friedrichshain",   vibe: "Student/creative quarter, cheaper, lots going on", rentRange: "€900–1,400",   tag: "student-friendly" },
    { name: "Charlottenburg",   vibe: "Quieter, leafy, established, family pace",         rentRange: "€1,300–1,900", tag: "quiet" },
    { name: "Neukölln",         vibe: "Multicultural, fast-changing, affordable still",   rentRange: "€800–1,300",   tag: "affordable" },
  ],
  transit: [
    "BVG monthly · €58 (Deutschlandticket €49 covers all of DE)",
    "U-Bahn + S-Bahn run frequently 5am–1am, all night Fri/Sat",
    "Cycling network covers most central districts",
    "Berlin Tegel is closed — fly into BER (~45 min from Mitte)",
  ],
  banking: [
    "N26 — fully digital, English app, instant IBAN",
    "Commerzbank — branch network, English bilingual at city locations",
    "DKB — solid online bank for residents",
    "Wise — good for cross-border + your home account",
  ],
  mobile: [
    "Telekom — best coverage, premium price (~€40/mo)",
    "Vodafone — strong network, mid-price",
    "O2 — cheaper plans, slightly weaker rural coverage",
    "Aldi Talk / Lidl Connect — prepaid, ~€10/mo for solid data",
  ],
  healthcare: [
    "TK (Techniker Krankenkasse) — most popular for English-speaking residents",
    "AOK — public, regional, broad network",
    "Mawista / Care Concept — short-term while waiting for residence permit",
    "Doctolib — book German doctors in English",
  ],
  language: {
    local: "German is official. Most under-40s speak conversational English.",
    englishOk: "Tech, academia, and central services are English-friendly. Bureaucracy (Bürgeramt, Ausländerbehörde) is German-only — bring a translator or use Glimmora partner.",
  },
  costSnapshot: [
    { l: "1-bed flat (rent)",     v: "€1,200/mo" },
    { l: "Groceries (1 person)",  v: "€280/mo"   },
    { l: "Health insurance",      v: "€480/mo"   },
    { l: "Coffee at a café",      v: "€3.50"     },
    { l: "Monthly transit pass",  v: "€58"       },
    { l: "Beer at a bar",         v: "€4.50"     },
  ],
  studentNotes: [
    "Studierendenwerk dorms are the cheapest housing — apply early, demand is high",
    "Semesterticket is included in your tuition fee — covers all BVG transit",
    "TK student plan is ~€121/mo — required, much cheaper than non-student",
    "City registration (Anmeldung) at your Bürgeramt within 14 days of arrival",
  ],
  familyNotes: [
    "Daycare (Kita) is heavily subsidised after age 1 — apply months ahead",
    "International schools concentrate in Mitte, Charlottenburg, Zehlendorf",
    "Family flats: 3-bed in Prenzlauer Berg or Charlottenburg, ~€2,000–2,800",
    "Family doctor (Hausarzt) registration recommended in first month",
  ],
};

const AMSTERDAM: CityInfo = {
  city: "Amsterdam",
  country: "NL",
  flag: "🇳🇱",
  intro: "Compact, bike-first, English-fluent. Higher rent than Berlin but easier bureaucracy. The 30% ruling makes early years tax-friendly for skilled migrants.",
  neighborhoods: [
    { name: "De Pijp",     vibe: "Lively, cafés, weekly market, central",          rentRange: "€1,800–2,400", tag: "popular" },
    { name: "Oud-West",    vibe: "Trendy, Vondelpark nearby, family pace",         rentRange: "€1,900–2,600", tag: "quiet" },
    { name: "Jordaan",     vibe: "Picturesque canals, walkable, premium",          rentRange: "€2,000–2,800", tag: "central" },
    { name: "Amsterdam-Noord", vibe: "Up-and-coming, ferry to centre, more space", rentRange: "€1,400–1,900", tag: "affordable" },
    { name: "Oud-Zuid",    vibe: "Established, museums, top schools",              rentRange: "€2,200–3,200", tag: "quiet" },
    { name: "Indische Buurt", vibe: "Diverse, fast-changing, student-friendly",    rentRange: "€1,300–1,700", tag: "student-friendly" },
  ],
  transit: [
    "GVB monthly · €98 · all of NS within Amsterdam",
    "Trains to Schiphol airport every 5 min, 15 min ride",
    "OV-fiets bike rental at every train station, €4.45/day",
    "Cycle lanes go everywhere — owning a bike is non-optional",
  ],
  banking: [
    "ING — most popular, English-friendly, strong app",
    "ABN AMRO — established bank, broad branch network",
    "Bunq — fully digital, Dutch and EU-wide",
    "Wise — for cross-border between home and Dutch accounts",
  ],
  mobile: [
    "KPN — best coverage, premium pricing (~€35/mo)",
    "Vodafone — mid-tier, strong network",
    "Odido — competitive pricing, decent coverage",
    "Lebara / Lyca — prepaid, ~€15/mo for 10GB",
  ],
  healthcare: [
    "Zilveren Kruis — largest insurer, English support",
    "VGZ — good for expat plans",
    "OneFit — alt for short-term coverage during arrival",
    "Huisarts (GP) — register in your district within 1st month",
  ],
  language: {
    local: "Dutch is official. ~95% of working-age adults speak fluent English.",
    englishOk: "You can live, work, and bank in English long-term. Government letters arrive in Dutch — translation tools handle most of it.",
  },
  costSnapshot: [
    { l: "1-bed flat (rent)",     v: "€1,800/mo" },
    { l: "Groceries (1 person)",  v: "€340/mo"   },
    { l: "Health insurance",      v: "€140/mo"   },
    { l: "Coffee at a café",      v: "€4"        },
    { l: "Monthly transit pass",  v: "€98"       },
    { l: "Beer at a bar",         v: "€5.50"     },
  ],
  studentNotes: [
    "Studentenstad housing platforms (Kamernet, ROOM.nl) for shared flats",
    "OV-Studenten kort gives student rail discounts when studying full-time",
    "Aanvullende verzekering for student health insurance, ~€45/mo",
    "BSN registration at your gemeente office within first 5 days of arrival",
  ],
  familyNotes: [
    "Kinderopvang (daycare) is partly subsidised; apply 6+ months ahead",
    "International schools cluster in Amstelveen and Oud-Zuid",
    "Toeslagen (allowances) for childcare, rent, and health are means-tested",
    "Bike trailers are the standard family transport — even for two kids",
  ],
};

const DUBLIN: CityInfo = {
  city: "Dublin",
  country: "IE",
  flag: "🇮🇪",
  intro: "English-speaking, EU-anchored tech hub. Housing is the hardest part — rent is high and supply is tight. Friendly, walkable, and pubs everywhere.",
  neighborhoods: [
    { name: "Dublin 4 (Ballsbridge)", vibe: "Embassies, leafy, premium", rentRange: "€2,400–3,400", tag: "quiet" },
    { name: "Dublin 6 (Rathmines)",   vibe: "Student-heavy, cafés, lively", rentRange: "€1,800–2,400", tag: "student-friendly" },
    { name: "Dublin 2 (City Centre)", vibe: "Walking distance to most offices", rentRange: "€2,000–2,800", tag: "central" },
    { name: "Dublin 7 (Stoneybatter)", vibe: "Up-and-coming, indie shops",   rentRange: "€1,700–2,200", tag: "popular" },
    { name: "Dublin 8 (Portobello)",   vibe: "Canal-side, hip, cafés",       rentRange: "€1,800–2,400", tag: "popular" },
    { name: "Dublin 15 (Blanchardstown)", vibe: "Suburban, family-friendly", rentRange: "€1,500–2,000", tag: "affordable" },
  ],
  transit: [
    "Dublin Bus + Luas tram + DART rail · TaxSaver leap card €110/mo",
    "TFI Leap card refills via app, contactless on most transit",
    "Cycle infrastructure improving but not Amsterdam-level yet",
    "Dublin Airport bus connects to most areas under 45 min",
  ],
  banking: [
    "AIB — largest retail bank, broad branch network",
    "Bank of Ireland — strong digital app, English service",
    "Revolut — popular among newcomers, instant Irish IBAN",
    "N26 / Wise — for international transfers and FX",
  ],
  mobile: [
    "Three Ireland — strong network, competitive pricing",
    "Vodafone — premium, broad rural coverage",
    "Eir — incumbent, good in cities",
    "GoMo — budget option (€15/mo unlimited)",
  ],
  healthcare: [
    "VHI — largest private health insurer",
    "Laya Healthcare — main competitor, expat-friendly",
    "Public HSE GP — register at a local clinic",
    "Drug Payment Scheme caps monthly meds at €80",
  ],
  language: {
    local: "English is official. Irish (Gaeilge) is taught in schools.",
    englishOk: "No language barrier whatsoever for daily life or work.",
  },
  costSnapshot: [
    { l: "1-bed flat (rent)",     v: "€2,000/mo" },
    { l: "Groceries (1 person)",  v: "€350/mo"   },
    { l: "Health insurance",      v: "€110/mo"   },
    { l: "Coffee at a café",      v: "€3.80"     },
    { l: "Monthly transit pass",  v: "€110"      },
    { l: "Pint at a pub",         v: "€6.50"     },
  ],
  studentNotes: [
    "On-campus dorms at TCD/UCD are first choice — book before May",
    "Student Leap Card halves transit fares",
    "Free GP visits for under-25s with student card",
    "PSC (Public Services Card) needed for many services — book early",
  ],
  familyNotes: [
    "Free GP for under-6s and over-70s",
    "Primary schools are often Catholic — check ethos at enrolment",
    "ECCE scheme gives free 3hrs/day pre-school for ages 2y8m–5y6m",
    "Childcare is expensive; means-tested NCS subsidy helps",
  ],
};

const LISBON: CityInfo = {
  city: "Lisbon",
  country: "PT",
  flag: "🇵🇹",
  intro: "Sunny, hilly, deeply walkable. Lower cost of living than Berlin or Dublin. Bureaucracy is patient — set aside time. NHR tax regime is attractive but rules changed in 2024.",
  neighborhoods: [
    { name: "Príncipe Real",  vibe: "Trendy, garden squares, cafés",   rentRange: "€1,400–2,000", tag: "popular" },
    { name: "Alfama",         vibe: "Historic, narrow streets, charm", rentRange: "€1,100–1,600", tag: "quiet" },
    { name: "Belém",          vibe: "Riverside, museums, family pace", rentRange: "€1,200–1,700", tag: "quiet" },
    { name: "Marvila",        vibe: "Up-and-coming, breweries, lofts", rentRange: "€900–1,300",   tag: "affordable" },
    { name: "Avenidas Novas", vibe: "Central, business district",      rentRange: "€1,500–2,100", tag: "central" },
    { name: "Estrela",        vibe: "Leafy, embassy district, family", rentRange: "€1,300–1,800", tag: "popular" },
  ],
  transit: [
    "Carris + Metro · Navegante monthly €40, family discounts available",
    "Trams (28, 25) are tourist-heavy but locals use them too",
    "Uber/Bolt are cheap and reliable",
    "Lisbon airport is in the city — taxi to Príncipe Real is ~€10",
  ],
  banking: [
    "Caixa Geral de Depósitos — largest, public bank",
    "Millennium BCP — broad branch network",
    "ActivoBank — fully digital, NIF-friendly",
    "Revolut — popular among expats, instant Portuguese IBAN",
  ],
  mobile: [
    "MEO — best coverage, owns most of the network",
    "NOS — competitive bundles, good in cities",
    "Vodafone — mid-tier",
    "WTF / Uzo — budget prepaid, ~€10/mo",
  ],
  healthcare: [
    "SNS — public system, residents only after NIF + utente number",
    "Médis / Multicare — private health for faster access",
    "Lusíadas — hospital network with English-speaking doctors",
    "Pharmacies (farmácias) are common and dispense many things OTC",
  ],
  language: {
    local: "Portuguese is official. Brazilian Portuguese is understood but not identical.",
    englishOk: "Lisbon centre is very English-friendly. Outside the centre and with bureaucracy, basic Portuguese helps a lot.",
  },
  costSnapshot: [
    { l: "1-bed flat (rent)",     v: "€1,200/mo" },
    { l: "Groceries (1 person)",  v: "€220/mo"   },
    { l: "Health insurance",      v: "€90/mo"    },
    { l: "Coffee at a café",      v: "€1.20"     },
    { l: "Monthly transit pass",  v: "€40"       },
    { l: "Beer at a bar",         v: "€2.50"     },
  ],
  studentNotes: [
    "Residências universitárias are heavily oversubscribed; apply early",
    "Sub-23 transit pass is heavily discounted (Navegante Familiar/Estudante)",
    "SNS access for students after 90 days of residency",
    "Atestado de Residência (proof of address) needed for most services",
  ],
  familyNotes: [
    "Public crèches are subsidised but waitlists are long; private ~€500–800/mo",
    "International schools concentrate in Belém, Estoril, and Cascais",
    "Family doctor (médico de família) assigned by your health centre",
    "Abono de família (family allowance) is means-tested",
  ],
};

const DESTINATIONS: Record<string, CityInfo> = {
  // Lookup by country code first, then by city if needed.
  DE: BERLIN,
  NL: AMSTERDAM,
  IE: DUBLIN,
  PT: LISBON,
};

function lookupCity(destCity: string | null, destCountry: string): CityInfo | null {
  // City match wins over country match
  const cityMatch = Object.values(DESTINATIONS).find(
    (d) => destCity && d.city.toLowerCase() === destCity.toLowerCase(),
  );
  if (cityMatch) return cityMatch;
  return DESTINATIONS[destCountry.toUpperCase()] ?? null;
}

export async function DiscoverDestination({
  destCity,
  destCountry,
  mode,
}: {
  destCity: string | null;
  destCountry: string;
  mode: "INDIVIDUAL" | "FAMILY" | "STUDENT";
}) {
  const info = lookupCity(destCity, destCountry);
  const cityLabel = destCity || destCountry;

  // Graceful fallback for destinations not yet in the knowledge base
  if (!info) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
        <header className="mb-10">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
            Discover · Your destination
          </p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Settle in {cityLabel}.
          </h1>
        </header>
        <div className="rounded-2xl border border-dashed border-ink-300 bg-parchment/60 p-10 text-center">
          <p className="text-[15px] text-ink-700">
            We don't yet have a settlement guide for {cityLabel}, but every other tool — Plan, Documents, Marketplace, Finance — is fully active.
          </p>
          <p className="mt-2 text-[13px] text-ink-500">
            Country-specific data for this destination ships in W4.
          </p>
        </div>
      </div>
    );
  }
  const isStudent = mode === "STUDENT";
  const isFamily = mode === "FAMILY";

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Discover · Your destination</p>
          <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
            Settle in {cityLabel}.
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-[1.6] text-ink-600">
            {isStudent
              ? `Everything a student needs for ${cityLabel} — neighborhoods, transit, banking, healthcare. Tuned for the student rhythm.`
              : isFamily
              ? `Everything a household needs for ${cityLabel} — family-friendly neighborhoods, schools, transit, healthcare.`
              : `Everything you need to know about ${cityLabel} — neighborhoods, transit, banking, mobile, healthcare.`}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-lagoon-50 border border-lagoon-100 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-lagoon-800 font-medium">
          <span className="text-base leading-none">{info.flag}</span> {info.city}, {info.country}
        </span>
      </header>

      {/* Intro */}
      <section className="mb-10">
        <div className="rounded-[28px] bg-ink-900 p-8 text-parchment md:p-10 relative overflow-hidden">
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gilt-500/20 blur-[70px]" />
          <div className="relative max-w-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="mt-5 font-sans text-[20px] leading-[1.5] tracking-tight text-parchment/95">
              {info.intro}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              {info.costSnapshot.slice(0, 6).map((row) => (
                <div key={row.l}>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/45 font-medium">{row.l}</p>
                  <p className="mt-1 font-sans text-[16px] font-semibold text-parchment">{row.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mode-specific tips */}
      {(isStudent || isFamily) ? (
        <section className="mb-10">
          <SectionHead num="01" label={isStudent ? "Student-life essentials" : "Family-life essentials"} />
          <div className="rounded-2xl border border-gilt-200 bg-gilt-50/40 p-6 md:p-7">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gilt-500 text-white">
              {isStudent ? <GraduationCap className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Home className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </span>
            <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-gilt-800 font-medium">
              {isStudent ? "If you're a student in Berlin" : "If you're moving with family"}
            </p>
            <ul className="mt-3 grid gap-2.5 md:grid-cols-2 text-[13.5px] leading-[1.55] text-ink-800">
              {(isStudent ? info.studentNotes! : info.familyNotes!).map((n, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gilt-500" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Neighborhoods */}
      <section className="mb-10">
        <SectionHead num={isStudent || isFamily ? "02" : "01"} label="Neighborhoods" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {info.neighborhoods.map((n) => {
            const tagLabel =
              n.tag === "student-friendly" ? "Student-friendly" :
              n.tag === "popular"          ? "Popular" :
              n.tag === "quiet"            ? "Quiet" :
              n.tag === "affordable"       ? "Budget-friendly" :
              n.tag === "lively"           ? "Lively" :
              n.tag === "central"          ? "Central" :
              null;
            return (
              <article
                key={n.name}
                className="rounded-2xl border border-ink-200 bg-white p-5"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.75} />
                  <h3 className="font-sans text-[16px] font-semibold tracking-tight text-ink-900">{n.name}</h3>
                  {tagLabel ? (
                    <span className="ml-auto rounded-full border border-ink-200 bg-parchment px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600 font-medium">
                      {tagLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[13px] leading-[1.55] text-ink-600">{n.vibe}</p>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium">Rent / mo</span>
                  <span className="font-sans text-[13px] font-semibold text-ink-900">{n.rentRange}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Practical grids */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <PracticalCard Icon={Train}      title="Public transport" items={info.transit}    accent="ink" />
        <PracticalCard Icon={Banknote}   title="Banking"          items={info.banking}    accent="lagoon" />
        <PracticalCard Icon={Wifi}       title="Mobile carriers"  items={info.mobile}     accent="ink" />
        <PracticalCard Icon={HeartPulse} title="Healthcare"       items={info.healthcare} accent="lagoon" />
      </section>

      {/* Language */}
      <section className="mb-10">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-parchment">
              <Languages className="h-[18px] w-[18px] text-ink-700" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Language</p>
              <h3 className="mt-1 font-sans text-[18px] font-semibold tracking-tight text-ink-900">
                Will you get by in English?
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6] text-ink-700">{info.language.local}</p>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-600">{info.language.englishOk}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace bridge */}
      <section className="rounded-[28px] bg-ink-900 p-10 text-parchment md:p-12">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="mt-5 font-sans text-[24px] font-semibold leading-[1.2] tracking-[-0.015em]">
              Ready to book? Glimmora's verified partners cover every category.
            </h3>
            <p className="mt-3 max-w-lg text-[13.5px] text-white/65 leading-[1.6]">
              Visa filing, housing search, banking onboarding, mobile setup, healthcare registration — partner-led, escrow-protected.
            </p>
          </div>
          <Link
            href="/app/marketplace"
            className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-parchment pl-5 pr-4 text-[13.5px] font-semibold text-ink-900 hover:bg-white md:self-center"
          >
            Open Marketplace <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-400 font-medium">{num}</span>
      <span className="h-px flex-1 bg-ink-200" />
      <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-700 font-medium">{label}</span>
    </div>
  );
}

function PracticalCard({
  Icon,
  title,
  items,
  accent,
}: {
  Icon: typeof Train;
  title: string;
  items: string[];
  accent: "ink" | "lagoon";
}) {
  const iconCls = accent === "lagoon" ? "bg-lagoon-500 text-white" : "bg-ink-900 text-parchment";
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconCls}`}>
          <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
        </span>
        <h3 className="font-sans text-[16px] font-semibold tracking-tight text-ink-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5 text-[13px] leading-[1.55] text-ink-700">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
