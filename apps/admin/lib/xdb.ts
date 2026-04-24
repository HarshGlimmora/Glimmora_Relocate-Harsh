// Cross-app database access for the Admin Ops Console.
// Reads span Employer + Consumer + Partner + Corporate SQLite files.
// Write handles (verification approvals, etc.) use a separate non-readonly
// connection. In production this becomes read replicas + RPC to write-owning
// services; the interface here stays the same.

import path from "node:path";
import Database from "better-sqlite3";

type Db = Database.Database;

type AppKey = "employer" | "consumer" | "partner" | "corporate";

const READ_DB_CACHE: Partial<Record<AppKey, Db>> = {};
const WRITE_DB_CACHE: Partial<Record<AppKey, Db>> = {};

const DEFAULTS: Record<AppKey, { envVar: string; fallback: string }> = {
  employer:  { envVar: "EMPLOYER_DB_PATH",  fallback: "../employer/prisma/prisma/dev.db"  },
  consumer:  { envVar: "CONSUMER_DB_PATH",  fallback: "../consumer/prisma/prisma/dev.db"  },
  partner:   { envVar: "PARTNER_DB_PATH",   fallback: "../partner/prisma/prisma/dev.db"   },
  corporate: { envVar: "CORPORATE_DB_PATH", fallback: "../corporate/prisma/prisma/dev.db" },
};

function resolveDb(key: AppKey): string {
  const { envVar, fallback } = DEFAULTS[key];
  const raw = process.env[envVar] ?? fallback;
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function openRead(key: AppKey): Db {
  const cached = READ_DB_CACHE[key];
  if (cached) return cached;
  const p = resolveDb(key);
  const db = new Database(p, { readonly: true, fileMustExist: true });
  READ_DB_CACHE[key] = db;
  return db;
}

function openWrite(key: AppKey): Db {
  const cached = WRITE_DB_CACHE[key];
  if (cached) return cached;
  const p = resolveDb(key);
  const db = new Database(p, { fileMustExist: true });
  // Enable WAL so we don't deadlock with the owning portal's own write traffic.
  db.pragma("journal_mode = WAL");
  WRITE_DB_CACHE[key] = db;
  return db;
}

// ---- EMPLOYER reads ----

export type EmpCompanyRow = {
  id: string;
  name: string;
  slug: string;
  hqCity: string | null;
  hqCountry: string | null;
  size: string | null;
  industry: string | null;
  verified: number;
  createdAt: number;
};

export function listEmployerCompanies(): EmpCompanyRow[] {
  const db = openRead("employer");
  return db
    .prepare<[], EmpCompanyRow>(
      `SELECT id, name, slug, hqCity, hqCountry, size, industry, verified, createdAt
       FROM Company
       ORDER BY createdAt DESC`
    )
    .all();
}

export function countEmployerJobs(): { active: number; total: number } {
  const db = openRead("employer");
  const r = db
    .prepare<[], { active: number; total: number }>(
      `SELECT
        (SELECT COUNT(*) FROM Job WHERE status='ACTIVE') as active,
        (SELECT COUNT(*) FROM Job) as total`
    )
    .get();
  return r ?? { active: 0, total: 0 };
}

export type HireRow = {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePassport: string | null;
  profession: string | null;
  companyId: string;
  companyName: string;
  companySlug: string;
  jobId: string;
  jobTitle: string;
  location: string | null;
  offerId: string | null;
  baseSalary: number | null;
  currency: string | null;
  acceptedAt: number | null;
  startDate: number | null;
  visaTier: string | null;
};

export function listHires(): HireRow[] {
  const db = openRead("employer");
  return db
    .prepare<[], HireRow>(
      `SELECT
         a.id               AS applicationId,
         a.candidateName    AS candidateName,
         a.candidateEmail   AS candidateEmail,
         a.passport         AS candidatePassport,
         a.profession       AS profession,
         c.id               AS companyId,
         c.name             AS companyName,
         c.slug             AS companySlug,
         j.id               AS jobId,
         j.title            AS jobTitle,
         j.location         AS location,
         j.visaTier         AS visaTier,
         o.id               AS offerId,
         o.baseSalary       AS baseSalary,
         o.currency         AS currency,
         o.respondedAt      AS acceptedAt,
         o.startDate        AS startDate
       FROM Application a
       JOIN Job     j ON j.id = a.jobId
       JOIN Company c ON c.id = j.companyId
       LEFT JOIN Offer o
              ON o.applicationId = a.id
             AND o.status = 'ACCEPTED'
       WHERE a.stage = 'HIRED'
       ORDER BY COALESCE(o.respondedAt, a.updatedAt) DESC`
    )
    .all();
}

export function employerPipelineStats(): {
  totalApplications: number;
  byStage: { stage: string; n: number }[];
} {
  const db = openRead("employer");
  const total = db
    .prepare<[], { n: number }>(`SELECT COUNT(*) as n FROM Application`)
    .get();
  const byStage = db
    .prepare<[], { stage: string; n: number }>(
      `SELECT stage, COUNT(*) as n FROM Application GROUP BY stage ORDER BY n DESC`
    )
    .all();
  return { totalApplications: total?.n ?? 0, byStage };
}

// ---- EMPLOYER writes ----

export function setEmployerVerified(companyId: string, verified: boolean): void {
  const db = openWrite("employer");
  db.prepare(`UPDATE Company SET verified = ?, updatedAt = ? WHERE id = ?`)
    .run(verified ? 1 : 0, new Date().toISOString(), companyId);
}

// ---- CONSUMER reads ----

export function countActiveRelocations(): number {
  const db = openRead("consumer");
  const r = db
    .prepare<[], { n: number }>(
      `SELECT COUNT(*) as n FROM Relocation WHERE status='ACTIVE'`
    )
    .get();
  return r?.n ?? 0;
}

export type RelocationRow = {
  id: string;
  userEmail: string;
  userName: string | null;
  employerName: string;
  jobTitle: string;
  destCountry: string;
  destCity: string | null;
  startDate: number | null;
  status: string;
  acceptedAt: number;
  doneCount: number;
  totalCount: number;
};

export function listRelocations(): RelocationRow[] {
  const db = openRead("consumer");
  return db
    .prepare<[], RelocationRow>(
      `SELECT
         r.id,
         u.email      AS userEmail,
         u.name       AS userName,
         r.employerName,
         r.jobTitle,
         r.destCountry,
         r.destCity,
         r.startDate,
         r.status,
         r.acceptedAt,
         (SELECT COUNT(*) FROM RelocationMilestone m WHERE m.relocationId = r.id AND m.status='DONE')  AS doneCount,
         (SELECT COUNT(*) FROM RelocationMilestone m WHERE m.relocationId = r.id) AS totalCount
       FROM Relocation r
       JOIN User u ON u.id = r.userId
       ORDER BY r.acceptedAt DESC`
    )
    .all();
}

export function countConsumerUsers(): number {
  const db = openRead("consumer");
  const r = db.prepare<[], { n: number }>(`SELECT COUNT(*) as n FROM User`).get();
  return r?.n ?? 0;
}

export type ConsumerUserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: number;
  relocationCount: number;
  activeRelocation: number;
};

export function listConsumerUsers(): ConsumerUserRow[] {
  const db = openRead("consumer");
  const rows = db
    .prepare<[], ConsumerUserRow & { createdAt: number | string }>(
      `SELECT
         u.id, u.email, u.name, u.createdAt,
         (SELECT COUNT(*) FROM Relocation r WHERE r.userId = u.id) AS relocationCount,
         (SELECT COUNT(*) FROM Relocation r WHERE r.userId = u.id AND r.status = 'ACTIVE') AS activeRelocation
       FROM User u
       ORDER BY u.createdAt DESC`
    )
    .all();
  return rows.map((r) => ({ ...r, createdAt: toMs(r.createdAt) ?? 0 }));
}

// ---- PARTNER reads ----

export type PartnerRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  website: string | null;
  hqCountry: string | null;
  hqCity: string | null;
  verificationStatus: string;
  kybSubmittedAt: number | null;
  kybApprovedAt: number | null;
  kybRejectedReason: string | null;
  rating: number;
  reviewCount: number;
  fulfilmentRateBps: number;
  createdAt: number;
  listingCount: number;
  activeListings: number;
  bookingCount: number;
  docCount: number;
};

function toMs(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const parsed = Date.parse(v);
  return Number.isFinite(parsed) ? parsed : null;
}

export function listPartners(): PartnerRow[] {
  const db = openRead("partner");
  const rows = db
    .prepare<[], PartnerRow & { kybSubmittedAt: number | string | null; kybApprovedAt: number | string | null; createdAt: number | string }>(
      `SELECT
         p.id, p.name, p.slug, p.category, p.website, p.hqCountry, p.hqCity,
         p.verificationStatus, p.kybSubmittedAt, p.kybApprovedAt, p.kybRejectedReason,
         p.rating, p.reviewCount, p.fulfilmentRateBps, p.createdAt,
         (SELECT COUNT(*) FROM Listing l WHERE l.partnerId = p.id) AS listingCount,
         (SELECT COUNT(*) FROM Listing l WHERE l.partnerId = p.id AND l.status = 'ACTIVE') AS activeListings,
         (SELECT COUNT(*) FROM Booking b WHERE b.partnerId = p.id) AS bookingCount,
         (SELECT COUNT(*) FROM KybDocument d WHERE d.partnerId = p.id) AS docCount
       FROM Partner p
       ORDER BY p.createdAt DESC`
    )
    .all();
  return rows.map((r) => ({
    ...r,
    kybSubmittedAt: toMs(r.kybSubmittedAt),
    kybApprovedAt: toMs(r.kybApprovedAt),
    createdAt: toMs(r.createdAt) ?? 0,
  }));
}

export type KybDocRow = {
  id: string;
  partnerId: string;
  kind: string;
  fileName: string;
  fileUrl: string | null;
  uploadedAt: number;
  status: string;
};

export function listPartnerKybDocs(partnerId: string): KybDocRow[] {
  const db = openRead("partner");
  const rows = db
    .prepare<[string], KybDocRow & { uploadedAt: number | string }>(
      `SELECT id, partnerId, kind, fileName, fileUrl, uploadedAt, status
       FROM KybDocument WHERE partnerId = ? ORDER BY uploadedAt ASC`
    )
    .all(partnerId);
  return rows.map((r) => ({ ...r, uploadedAt: toMs(r.uploadedAt) ?? 0 }));
}

export type PartnerReviewRow = {
  id: string;
  partnerId: string;
  bookingId: string;
  rating: number;
  body: string | null;
  authorName: string;
  createdAt: number;
  partnerName: string;
};

export function listPartnerReviews(limit = 40): PartnerReviewRow[] {
  const db = openRead("partner");
  const rows = db
    .prepare<[number], PartnerReviewRow & { createdAt: number | string }>(
      `SELECT r.id, r.partnerId, r.bookingId, r.rating, r.body, r.authorName, r.createdAt,
              p.name AS partnerName
       FROM Review r
       JOIN Partner p ON p.id = r.partnerId
       ORDER BY r.createdAt DESC
       LIMIT ?`
    )
    .all(limit);
  return rows.map((r) => ({ ...r, createdAt: toMs(r.createdAt) ?? 0 }));
}

export type PartnerBookingRow = {
  id: string;
  partnerId: string;
  partnerName: string;
  listingId: string;
  listingTitle: string;
  customerEmail: string;
  customerName: string;
  status: string;
  amount: number;
  currency: string;
  escrowState: string;
  startDate: number | null;
  confirmedAt: number | null;
  createdAt: number;
};

export function listPartnerBookings(): PartnerBookingRow[] {
  const db = openRead("partner");
  const rows = db
    .prepare<[], PartnerBookingRow & { startDate: number | string | null; confirmedAt: number | string | null; createdAt: number | string }>(
      `SELECT b.id, b.partnerId, p.name AS partnerName,
              b.listingId, l.title AS listingTitle,
              b.customerEmail, b.customerName,
              b.status, b.amount, b.currency, b.escrowState,
              b.startDate, b.confirmedAt, b.createdAt
       FROM Booking b
       JOIN Partner p ON p.id = b.partnerId
       JOIN Listing l ON l.id = b.listingId
       ORDER BY b.createdAt DESC`
    )
    .all();
  return rows.map((r) => ({
    ...r,
    startDate: toMs(r.startDate),
    confirmedAt: toMs(r.confirmedAt),
    createdAt: toMs(r.createdAt) ?? 0,
  }));
}

export type PayoutRow = {
  id: string;
  partnerId: string;
  partnerName: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  currency: string;
  status: string;
  releasedAt: number | null;
  createdAt: number;
};

export function listPartnerPayouts(): PayoutRow[] {
  const db = openRead("partner");
  const rows = db
    .prepare<[], PayoutRow & { releasedAt: number | string | null; createdAt: number | string }>(
      `SELECT y.id, y.partnerId, p.name AS partnerName, y.bookingId,
              y.amount, y.platformFee, y.currency, y.status, y.releasedAt, y.createdAt
       FROM Payout y
       JOIN Partner p ON p.id = y.partnerId
       ORDER BY y.createdAt DESC`
    )
    .all();
  return rows.map((r) => ({ ...r, releasedAt: toMs(r.releasedAt), createdAt: toMs(r.createdAt) ?? 0 }));
}

// ---- PARTNER writes ----

export function setPartnerVerification(
  partnerId: string,
  decision: "APPROVED" | "REJECTED" | "IN_REVIEW",
  reason?: string,
): void {
  const db = openWrite("partner");
  const now = new Date().toISOString();
  if (decision === "APPROVED") {
    db.prepare(
      `UPDATE Partner
       SET verificationStatus = 'APPROVED',
           kybApprovedAt = ?,
           kybRejectedReason = NULL,
           updatedAt = ?
       WHERE id = ?`
    ).run(now, now, partnerId);
  } else if (decision === "REJECTED") {
    db.prepare(
      `UPDATE Partner
       SET verificationStatus = 'REJECTED',
           kybRejectedReason = ?,
           updatedAt = ?
       WHERE id = ?`
    ).run(reason ?? "No reason given", now, partnerId);
  } else {
    db.prepare(
      `UPDATE Partner SET verificationStatus = 'IN_REVIEW', updatedAt = ? WHERE id = ?`
    ).run(now, partnerId);
  }
}

// ---- CORPORATE reads ----

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  hqCountry: string | null;
  hqCity: string | null;
  industry: string | null;
  size: string | null;
  contractTier: string;
  billingEmail: string | null;
  createdAt: number;
  employeeCount: number;
  activeRelocations: number;
  policyCount: number;
  openApprovals: number;
  invoiceCount: number;
};

export function listOrganizations(): OrganizationRow[] {
  const db = openRead("corporate");
  const rows = db
    .prepare<[], OrganizationRow & { createdAt: number | string }>(
      `SELECT
         o.id, o.name, o.slug, o.hqCountry, o.hqCity, o.industry, o.size,
         o.contractTier, o.billingEmail, o.createdAt,
         (SELECT COUNT(*) FROM Employee e WHERE e.organizationId = o.id) AS employeeCount,
         (SELECT COUNT(*) FROM Employee e WHERE e.organizationId = o.id AND e.relocationStatus = 'ACTIVE') AS activeRelocations,
         (SELECT COUNT(*) FROM Policy  p WHERE p.organizationId = o.id AND p.active = 1) AS policyCount,
         (SELECT COUNT(*) FROM Approval a WHERE a.organizationId = o.id AND a.status = 'PENDING') AS openApprovals,
         (SELECT COUNT(*) FROM Invoice i WHERE i.organizationId = o.id) AS invoiceCount
       FROM Organization o
       ORDER BY o.createdAt DESC`
    )
    .all();
  return rows.map((r) => ({ ...r, createdAt: toMs(r.createdAt) ?? 0 }));
}

export type CorporateInvoiceRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  number: string;
  period: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: number;
  paidAt: number | null;
  dueAt: number;
  createdAt: number;
};

export function listCorporateInvoices(): CorporateInvoiceRow[] {
  const db = openRead("corporate");
  const rows = db
    .prepare<[], CorporateInvoiceRow & { issuedAt: number | string; paidAt: number | string | null; dueAt: number | string; createdAt: number | string }>(
      `SELECT i.id, i.organizationId, o.name AS organizationName,
              i.number, i.period, i.total AS amount, i.currency, i.status,
              i.issuedAt, i.paidAt, i.dueAt, i.createdAt
       FROM Invoice i
       JOIN Organization o ON o.id = i.organizationId
       ORDER BY i.createdAt DESC`
    )
    .all();
  return rows.map((r) => ({
    ...r,
    issuedAt: toMs(r.issuedAt) ?? 0,
    paidAt: toMs(r.paidAt),
    dueAt: toMs(r.dueAt) ?? 0,
    createdAt: toMs(r.createdAt) ?? 0,
  }));
}
