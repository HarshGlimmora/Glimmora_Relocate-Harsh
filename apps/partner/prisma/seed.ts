import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Partner DB…");

  const existingUser = await prisma.partnerUser.findUnique({ where: { email: "demo@partner.glimmora.ai" } });
  if (existingUser) {
    console.log("Partner demo already seeded.");
    return;
  }

  const password = "partner1234";
  const hash = await bcrypt.hash(password, 10);

  // ----- Demo partner user (operates Havn Housing)
  const operator = await prisma.partnerUser.create({
    data: {
      email: "demo@partner.glimmora.ai",
      passwordHash: hash,
      name: "Sofia Larsson",
      title: "Head of Operations",
      emailVerified: new Date(),
    },
  });

  // ----- Partner 1 — Havn Housing (APPROVED, rich inventory)
  const havn = await prisma.partner.create({
    data: {
      name: "Havn Housing",
      slug: "havn-housing",
      category: "HOUSING",
      website: "https://havn.example",
      about: "Curated furnished apartments for relocating professionals across the EU. Every unit is relocation-ready: utilities set up, bedding, kitchenware, registration support.",
      hqCountry: "DE",
      hqCity: "Berlin",
      verificationStatus: "APPROVED",
      kybSubmittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
      kybApprovedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55),
      rating: 4.8,
      reviewCount: 124,
      fulfilmentRateBps: 9840,
      members: { create: { userId: operator.id, role: "OWNER" } },
    },
  });

  // ----- Partner 2 — Nordic Schools (IN_REVIEW)
  const nordic = await prisma.partner.create({
    data: {
      name: "Nordic Schools International",
      slug: "nordic-schools",
      category: "SCHOOL",
      website: "https://nordic-schools.example",
      about: "International K-12 placement across DE, NL, DK, SE. Priority admissions for relocating families.",
      hqCountry: "DE",
      hqCity: "Hamburg",
      verificationStatus: "IN_REVIEW",
      kybSubmittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      rating: 4.6,
      reviewCount: 38,
      fulfilmentRateBps: 9650,
    },
  });

  // ----- Partner 3 — Pathway Legal (APPROVED)
  const pathway = await prisma.partner.create({
    data: {
      name: "Pathway Legal",
      slug: "pathway-legal",
      category: "LEGAL",
      website: "https://pathway-legal.example",
      about: "Immigration lawyers specializing in EU Blue Card, Dutch HSM, and Portugal Tech Visa. Fast-track filings for time-critical hires.",
      hqCountry: "NL",
      hqCity: "Amsterdam",
      verificationStatus: "APPROVED",
      kybSubmittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      kybApprovedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 87),
      rating: 4.9,
      reviewCount: 73,
      fulfilmentRateBps: 9920,
    },
  });

  // ----- Listings
  const listings = [
    // Havn Housing · Berlin
    {
      partnerId: havn.id, kind: "APARTMENT",
      title: "Mitte 2BR — sunlit, fully furnished",
      summary: "2-bedroom apartment in Berlin Mitte, 70m², south-facing, U-Bahn 3 min. Includes registration support (Anmeldung).",
      city: "Berlin", country: "DE", address: "Linienstrasse 84, 10115 Berlin",
      priceMin: 2100, priceMax: 2400, currency: "EUR", billingCycle: "monthly",
      attributes: JSON.stringify({ bedrooms: 2, bathrooms: 1, sqm: 70, furnished: true, petFriendly: false, deposit: "1.5 months" }),
      capacity: 1, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    },
    {
      partnerId: havn.id, kind: "APARTMENT",
      title: "Prenzlauer Berg 1BR — quiet courtyard",
      summary: "Bright 1-bedroom, 48m², courtyard-side. 2-person max. Lease 6-12 months.",
      city: "Berlin", country: "DE", address: "Kollwitzstrasse 22, 10405 Berlin",
      priceMin: 1450, priceMax: 1650, currency: "EUR", billingCycle: "monthly",
      attributes: JSON.stringify({ bedrooms: 1, bathrooms: 1, sqm: 48, furnished: true, petFriendly: true, deposit: "2 months" }),
      capacity: 2, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    {
      partnerId: havn.id, kind: "APARTMENT",
      title: "Kreuzberg studio — relocate-ready",
      summary: "Compact studio, 32m², includes mini-lease (3 months) for bridge housing on arrival.",
      city: "Berlin", country: "DE", address: "Oranienstrasse 160, 10969 Berlin",
      priceMin: 980, priceMax: 1100, currency: "EUR", billingCycle: "monthly",
      attributes: JSON.stringify({ bedrooms: 0, bathrooms: 1, sqm: 32, furnished: true, petFriendly: false, deposit: "1 month" }),
      capacity: 3, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      partnerId: havn.id, kind: "APARTMENT",
      title: "Amsterdam Jordaan 1BR",
      summary: "Canal-side 1-bedroom in the Jordaan, 45m². Availability limited.",
      city: "Amsterdam", country: "NL", address: "Prinsengracht 110, 1015 EA Amsterdam",
      priceMin: 2450, priceMax: 2700, currency: "EUR", billingCycle: "monthly",
      attributes: JSON.stringify({ bedrooms: 1, bathrooms: 1, sqm: 45, furnished: true, petFriendly: false, deposit: "2 months" }),
      capacity: 1, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    },
    {
      partnerId: havn.id, kind: "APARTMENT",
      title: "Lisbon Graça 2BR — terrace",
      summary: "2-bedroom with 18m² south terrace. Perfect for families arriving in Q3.",
      city: "Lisbon", country: "PT", address: "R. Sra. do Monte 35, 1170-365 Lisbon",
      priceMin: 1650, priceMax: 1850, currency: "EUR", billingCycle: "monthly",
      attributes: JSON.stringify({ bedrooms: 2, bathrooms: 2, sqm: 85, furnished: true, petFriendly: true, deposit: "1 month" }),
      capacity: 2, status: "DRAFT",
    },

    // Nordic Schools
    {
      partnerId: nordic.id, kind: "SCHOOL_SEAT",
      title: "Berlin International School — Grade 3 seat",
      summary: "IB curriculum, English-medium. One seat for 2026/27 academic year, priority relocation placement.",
      city: "Berlin", country: "DE", address: "Lentzeallee 8-14, 14195 Berlin",
      priceMin: 22000, priceMax: 22000, currency: "EUR", billingCycle: "yearly",
      attributes: JSON.stringify({ grade: "3", curriculum: "IB", language: "English", startMonth: "August" }),
      capacity: 1, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
    },
    {
      partnerId: nordic.id, kind: "SCHOOL_SEAT",
      title: "Amsterdam British School — Year 7 seat",
      summary: "Two seats available for September intake. Cambridge curriculum.",
      city: "Amsterdam", country: "NL", address: "Havikslaan 2, 1021 Amsterdam",
      priceMin: 24500, priceMax: 24500, currency: "EUR", billingCycle: "yearly",
      attributes: JSON.stringify({ grade: "Year 7", curriculum: "Cambridge", language: "English", startMonth: "September" }),
      capacity: 2, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    },

    // Pathway Legal
    {
      partnerId: pathway.id, kind: "LEGAL_PACKAGE",
      title: "EU Blue Card — Full Filing",
      summary: "End-to-end EU Blue Card application for DE/NL/PT. Includes document preparation, embassy liaison, and biometrics appointment booking. Typical timeline 4–8 weeks.",
      city: "Amsterdam", country: "NL",
      priceMin: 1200, priceMax: 1200, currency: "EUR", billingCycle: "one-time",
      attributes: JSON.stringify({ visa: "EU Blue Card", countries: ["DE", "NL", "PT"], turnaround: "4-8 weeks" }),
      capacity: 25, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
    },
    {
      partnerId: pathway.id, kind: "LEGAL_PACKAGE",
      title: "Family reunification add-on",
      summary: "Spouse + children under 18. Must be paired with a primary application. Typical 6–10 weeks.",
      city: "Amsterdam", country: "NL",
      priceMin: 850, priceMax: 850, currency: "EUR", billingCycle: "one-time",
      attributes: JSON.stringify({ scope: "Family", turnaround: "6-10 weeks" }),
      capacity: 20, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
    {
      partnerId: pathway.id, kind: "LEGAL_PACKAGE",
      title: "Portugal Tech Visa — Fast-track",
      summary: "D3 Tech Visa filing with certified employer letter. 3-week turnaround on non-complex cases.",
      city: "Lisbon", country: "PT",
      priceMin: 1400, priceMax: 1400, currency: "EUR", billingCycle: "one-time",
      attributes: JSON.stringify({ visa: "Tech Visa (D3)", countries: ["PT"], turnaround: "3 weeks" }),
      capacity: 15, status: "ACTIVE", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  ];

  const createdListings = [];
  for (const l of listings) {
    const created = await prisma.listing.create({ data: l });
    createdListings.push(created);
  }

  // ----- Bookings (tied to our Consumer demo user — demo@glimmora.ai)
  const mitte = createdListings[0];
  const prenz = createdListings[1];
  const blueCard = createdListings.find((l) => l.title.includes("EU Blue Card"))!;
  const schoolSeat = createdListings.find((l) => l.title.includes("Berlin International"))!;

  // Booking 1 — Havn Mitte, CONFIRMED (move-in in 30 days)
  const b1 = await prisma.booking.create({
    data: {
      partnerId: havn.id,
      listingId: mitte.id,
      customerEmail: "demo@glimmora.ai",
      customerName: "Priya Menon",
      customerCountry: "IN",
      customerPassport: "IN",
      note: "Arrival May 15. Two adults, no pets. Anmeldung support appreciated.",
      status: "CONFIRMED",
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 395),
      amount: 2250,
      currency: "EUR",
      escrowState: "HELD",
      confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  });

  // Booking 2 — Pathway Legal Blue Card, IN_PROGRESS
  const b2 = await prisma.booking.create({
    data: {
      partnerId: pathway.id,
      listingId: blueCard.id,
      customerEmail: "demo@glimmora.ai",
      customerName: "Priya Menon",
      customerCountry: "IN",
      customerPassport: "IN",
      note: "Employer: Kontra GmbH. Role: Senior Backend Engineer. Need biometrics appointment by June 15.",
      status: "IN_PROGRESS",
      amount: 1200,
      currency: "EUR",
      escrowState: "HELD",
      confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    },
  });

  // Booking 3 — Havn Prenzlauer, REQUESTED (needs partner confirmation)
  const b3 = await prisma.booking.create({
    data: {
      partnerId: havn.id,
      listingId: prenz.id,
      customerEmail: "alex@example.com",
      customerName: "Alex Novikov",
      customerCountry: "UA",
      customerPassport: "UA",
      note: "Flexible move-in June or July. Would prefer pet-friendly unit.",
      status: "REQUESTED",
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      amount: 1500,
      currency: "EUR",
      escrowState: "HELD",
    },
  });

  // Booking 4 — FULFILLED (past booking, gets review + payout)
  const b4 = await prisma.booking.create({
    data: {
      partnerId: havn.id,
      listingId: mitte.id,
      customerEmail: "maria@example.com",
      customerName: "Maria Santos",
      customerCountry: "PT",
      customerPassport: "PT",
      status: "FULFILLED",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      amount: 2250,
      currency: "EUR",
      escrowState: "RELEASED",
      confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 95),
      fulfilledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
  });

  // ----- Messages for active bookings
  await prisma.message.createMany({
    data: [
      {
        bookingId: b1.id, sender: "CUSTOMER", author: "Priya Menon",
        body: "Hi — I'm arriving May 15. Could I get a floor plan for Mitte 2BR? Also, is Anmeldung support part of the included services?",
      },
      {
        bookingId: b1.id, sender: "PARTNER", author: "Sofia Larsson",
        body: "Hi Priya! Attaching the floor plan. Yes — full Anmeldung support is included. We'll book your Bürgeramt appointment the week you arrive.",
      },
      {
        bookingId: b1.id, sender: "CUSTOMER", author: "Priya Menon",
        body: "Perfect, thank you. Paying the deposit now.",
      },
      {
        bookingId: b2.id, sender: "PARTNER", author: "Pathway Legal",
        body: "Case opened. We'll need: signed employer contract, university transcripts (translated), and your passport scan. Upload via the portal link.",
      },
      {
        bookingId: b2.id, sender: "CUSTOMER", author: "Priya Menon",
        body: "Contract and passport uploaded. Transcripts coming once my university in India sends apostilled copies.",
      },
      {
        bookingId: b3.id, sender: "CUSTOMER", author: "Alex Novikov",
        body: "Hi — interested in the Prenzlauer 1BR. Is it available from mid-June? I have a rescue cat.",
      },
    ],
  });

  // ----- Payouts
  await prisma.payout.create({
    data: {
      partnerId: havn.id,
      bookingId: b1.id,
      amount: 2137,           // 95% of 2250
      platformFee: 113,       // 5% Glimmora fee
      currency: "EUR",
      status: "HELD",
      note: "Releases on move-in (May 15).",
    },
  });

  await prisma.payout.create({
    data: {
      partnerId: pathway.id,
      bookingId: b2.id,
      amount: 1140,
      platformFee: 60,
      currency: "EUR",
      status: "HELD",
      note: "Releases on visa approval.",
    },
  });

  await prisma.payout.create({
    data: {
      partnerId: havn.id,
      bookingId: b4.id,
      amount: 2137,
      platformFee: 113,
      currency: "EUR",
      status: "RELEASED",
      releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      note: "Paid out after tenant move-in confirmation.",
    },
  });

  // ----- Reviews (on completed bookings)
  await prisma.review.create({
    data: {
      partnerId: havn.id,
      bookingId: b4.id,
      rating: 5,
      body: "Move-in was seamless. Anmeldung was done within a week. Wi-Fi set up before arrival. Would highly recommend to anyone relocating to Berlin.",
      authorName: "Maria Santos",
    },
  });

  // ----- KYB docs for the demo partner (Havn) — approved
  await prisma.kybDocument.createMany({
    data: [
      { partnerId: havn.id, kind: "CERT_OF_INCORPORATION", fileName: "havn-cert-incorp.pdf", status: "APPROVED" },
      { partnerId: havn.id, kind: "VAT",                     fileName: "havn-vat.pdf",         status: "APPROVED" },
      { partnerId: havn.id, kind: "PROOF_OF_ADDRESS",        fileName: "havn-address.pdf",     status: "APPROVED" },
      { partnerId: havn.id, kind: "DIRECTOR_ID",             fileName: "larsson-id.pdf",       status: "APPROVED" },
      { partnerId: havn.id, kind: "INSURANCE",               fileName: "havn-insurance.pdf",   status: "APPROVED" },
    ],
  });

  // ----- KYB docs for Nordic (in review)
  await prisma.kybDocument.createMany({
    data: [
      { partnerId: nordic.id, kind: "CERT_OF_INCORPORATION", fileName: "nordic-cert.pdf",     status: "SUBMITTED" },
      { partnerId: nordic.id, kind: "VAT",                     fileName: "nordic-vat.pdf",      status: "SUBMITTED" },
      { partnerId: nordic.id, kind: "PROOF_OF_ADDRESS",        fileName: "nordic-address.pdf",  status: "SUBMITTED" },
    ],
  });

  console.log(`Seeded Partner: ${operator.email} / ${password}`);
  console.log(`  · 3 partners, ${listings.length} listings`);
  console.log(`  · 4 bookings, 6 messages, 3 payouts, 1 review`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
