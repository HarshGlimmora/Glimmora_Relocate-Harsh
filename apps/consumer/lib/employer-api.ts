// Typed HTTP client for the Employer portal's internal APIs.
// This is the layer a backend engineer will replace with the production API gateway.
// Contract (request/response shapes + endpoints + auth header) should stay stable;
// only the base URL and auth mechanism should change.

import { z } from "zod";

const base = process.env.EMPLOYER_API_URL ?? "http://localhost:3002";
const apiKey = process.env.INTERNAL_API_KEY;

// ---- Response schemas ----

const companyRef = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  hqCity: z.string().nullable(),
  hqCountry: z.string().nullable(),
  verified: z.boolean(),
});

const jobListItem = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string().nullable(),
  location: z.string().nullable(),
  remote: z.string().nullable(),
  seniority: z.string().nullable(),
  employmentType: z.string().nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  currency: z.string(),
  description: z.string().nullable(),
  requirements: z.string().nullable(),
  visaSponsorship: z.boolean(),
  visaTier: z.string().nullable(),
  eligiblePassports: z.array(z.string().length(2)),
  publishedAt: z.string().nullable(),
  company: companyRef,
  visaFit: z.enum(["yes", "maybe", "no"]),
});

const jobDetail = jobListItem
  .omit({ visaFit: true })
  .extend({
    company: companyRef.extend({
      about: z.string().nullable(),
      website: z.string().nullable(),
      industry: z.string().nullable(),
      size: z.string().nullable(),
    }),
    applicantCount: z.number().int().nonnegative(),
  });

const applicationItem = z.object({
  id: z.string(),
  stage: z.string(),
  matchScore: z.number().int(),
  visaFit: z.string(),
  appliedAt: z.string(),
  updatedAt: z.string(),
  job: z.object({
    id: z.string(),
    title: z.string(),
    location: z.string().nullable(),
    seniority: z.string().nullable(),
    salaryMin: z.number().int().nullable(),
    salaryMax: z.number().int().nullable(),
    currency: z.string(),
    visaTier: z.string().nullable(),
    company: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
  }),
  nextInterview: z
    .object({ id: z.string(), kind: z.string(), scheduledAt: z.string().nullable() })
    .nullable()
    .optional(),
  activeOffer: z
    .object({
      id: z.string(),
      status: z.string(),
      baseSalary: z.number().int().nullable(),
      currency: z.string().nullable(),
      startDate: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export type EmployerJob = z.infer<typeof jobListItem>;
export type EmployerJobDetail = z.infer<typeof jobDetail>;
export type EmployerApplication = z.infer<typeof applicationItem>;

// ---- Helpers ----

function assertConfigured() {
  if (!apiKey) {
    throw new Error("INTERNAL_API_KEY is not set in the Consumer app environment.");
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>
): Promise<T> {
  assertConfigured();
  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Employer API ${res.status} at ${path}: ${body.slice(0, 200)}`);
  }
  const json = await res.json().catch(() => null);
  return schema.parse(json);
}

// ---- Public functions ----

export async function listPublicJobs(opts?: { passport?: string }): Promise<EmployerJob[]> {
  const qs = opts?.passport ? `?passport=${encodeURIComponent(opts.passport.toUpperCase())}` : "";
  const data = await request(
    `/api/internal/jobs${qs}`,
    { method: "GET" },
    z.object({ jobs: z.array(jobListItem) })
  );
  return data.jobs;
}

export async function getPublicJob(id: string): Promise<EmployerJobDetail | null> {
  try {
    return await request(`/api/internal/jobs/${encodeURIComponent(id)}`, { method: "GET" }, jobDetail);
  } catch (err) {
    if (err instanceof Error && err.message.includes(" 404 ")) return null;
    throw err;
  }
}

export async function listApplicationsForEmail(email: string): Promise<EmployerApplication[]> {
  const data = await request(
    `/api/internal/applications?email=${encodeURIComponent(email)}`,
    { method: "GET" },
    z.object({ applications: z.array(applicationItem) })
  );
  return data.applications;
}

export async function submitApplication(input: {
  jobId: string;
  candidateEmail: string;
  candidateName: string;
  passport?: string | null;
  currentCountry?: string | null;
  profession?: string | null;
  yearsExp?: number | null;
  matchScore: number;
  visaFit: "yes" | "maybe" | "no" | "unknown";
}): Promise<{ ok: true; applicationId: string; stage: string; alreadyApplied: boolean }> {
  return request(
    "/api/internal/applications",
    { method: "POST", body: JSON.stringify(input) },
    z.object({
      ok: z.literal(true),
      applicationId: z.string(),
      stage: z.string(),
      alreadyApplied: z.boolean(),
    })
  );
}
