/**
 * Typed HTTP client for the Glimmora Relocate FastAPI backend.
 *
 * Every call goes through `backend()`, which:
 *   - obtains (or refreshes) a backend access token bound to the
 *     currently-signed-in NextAuth user via `ensureBackendSession()`,
 *   - injects `Authorization: Bearer …`,
 *   - logs the request + response shape (in dev) for easy debugging,
 *   - returns typed JSON or throws a structured `BackendApiError`.
 *
 * Never call this from a client component directly. Always wrap in a
 * server action (`"use server"`) or a route handler.
 */

import { ensureBackendSession } from "./session";
import { logBackendError } from "@/lib/server-logger";
import type {
  BackendProfile,
  CaseSummary,
  CountryComparisonDetail,
  CultureDetail,
  DocumentChecklistDetail,
  FamilyImpactDetail,
  FinanceCategoryDetail,
  FinanceCategoryKey,
  FinanceDetail,
  JobFitDetail,
  ModuleResponse,
  ShortlistRequest,
  ShortlistResponse,
  SynthesisDetail,
  TimelineDetail,
  VisaDirectionDetail,
  WorkflowDetail,
} from "./types";

export const BACKEND_BASE_URL =
  process.env.GLIMMORA_BACKEND_URL ?? "http://localhost:8000";

const DEBUG = process.env.NODE_ENV !== "production";

export class BackendApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

interface CallOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  multipart?: FormData;
  signal?: AbortSignal;
  /** Set to false to skip the auth header (used by /auth/* endpoints). */
  authed?: boolean;
}

/**
 * Make a typed request to the backend. Caller-supplied generic `T` is the
 * expected JSON shape on a 2xx.
 *
 * Auth resilience: if an authed call returns 401, we force-refresh the
 * backend session (refresh → login → register) and retry once. This keeps
 * the system working even when the proactively-stored `expiresAt` has
 * drifted out of sync with the actual JWT exp claim — the cause of the
 * "Access token expired" symptom.
 */
export async function backend<T>(
  path: string,
  opts: CallOptions = {},
): Promise<T> {
  const { method = "GET", body, multipart, signal, authed = true } = opts;
  return _doBackend<T>(path, { method, body, multipart, signal, authed }, false);
}

async function _doBackend<T>(
  path: string,
  opts: Required<Pick<CallOptions, "method" | "authed">> & CallOptions,
  isRetry: boolean,
): Promise<T> {
  const { method, body, multipart, signal, authed } = opts;
  const url = `${BACKEND_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined && !multipart) {
    headers["Content-Type"] = "application/json";
  }
  if (authed) {
    const sess = isRetry
      ? await ensureBackendSession({ forceRefresh: true })
      : await ensureBackendSession();
    headers["Authorization"] = `Bearer ${sess.accessToken}`;
  }

  const reqInit: RequestInit = {
    method,
    headers,
    signal,
    cache: "no-store",
  };
  if (multipart) {
    reqInit.body = multipart;
  } else if (body !== undefined) {
    reqInit.body = JSON.stringify(body);
  }

  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(url, reqInit);
  } catch (e) {
    // Network-level failure (ECONNREFUSED, DNS, TLS, abort). Without this
    // unwrap, Next.js would just print "TypeError: fetch failed" — useless.
    logBackendError({
      source: "backend-client",
      method,
      url,
      durationMs: Date.now() - t0,
      error: e,
    });
    throw e;
  }
  const ms = Date.now() - t0;

  let payload: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => null);
  }

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(
      `[backend] ${method} ${path} → ${res.status} (${ms}ms)${isRetry ? " [retry]" : ""}`,
      typeof payload === "object" && payload && "status" in (payload as Record<string, unknown>)
        ? { status: (payload as Record<string, unknown>).status }
        : "",
    );
  }

  if (!res.ok) {
    if (res.status === 401 && authed && !isRetry) {
      return _doBackend<T>(path, opts, true);
    }
    const err = payload as { error?: { code?: string; message?: string } } | null;
    const code = err?.error?.code ?? `http_${res.status}`;
    const message = err?.error?.message ?? `Backend ${method} ${path} failed`;
    const apiError = new BackendApiError(res.status, code, message, payload);
    // 404 on GET is a normal "no data yet" signal (e.g. dashboard polling
    // `/synthesis` before the user has run synthesis). Callers like
    // `moduleLatest` already coerce it to `null` — don't pollute the
    // terminal with red error blocks for an expected control-flow signal.
    const isBenignNotFound = res.status === 404 && method === "GET";
    if (!isBenignNotFound) {
      logBackendError({
        source: "backend-client",
        method,
        url,
        status: res.status,
        durationMs: ms,
        error: apiError,
        extra: { responseBody: payload },
      });
    }
    throw apiError;
  }

  return payload as T;
}

// ---- Auth ----

export interface AuthRegisterResponse {
  user: { id: string; email: string; name: string | null };
  case_id: string;
  tokens: { access_token: string; refresh_token: string; expires_in: number };
}

export async function authRegister(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthRegisterResponse> {
  return backend<AuthRegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    body: input,
    authed: false,
  });
}

export async function authLogin(input: {
  email: string;
  password: string;
}): Promise<AuthRegisterResponse> {
  return backend<AuthRegisterResponse>("/api/v1/auth/login", {
    method: "POST",
    body: input,
    authed: false,
  });
}

export async function authRefresh(input: {
  refresh_token: string;
}): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  return backend("/api/v1/auth/refresh", {
    method: "POST",
    body: input,
    authed: false,
  });
}

// ---- Profile ----

interface GetProfileResponse {
  profile: BackendProfile;
  field_sources?: Record<string, string>;
  completion_percentage?: number;
  required_missing?: string[];
}

/**
 * Returns the user's profile, flattened. The backend wraps the profile
 * inside `{ profile: {...} }`; we unwrap so callers can read fields
 * directly. `field_sources` is merged onto the profile so the
 * onboarding form can highlight inferred fields.
 */
export async function getProfile(): Promise<BackendProfile> {
  const r = await backend<GetProfileResponse>("/api/v1/profile");
  return { ...r.profile, field_sources: r.field_sources, completion_percentage: r.completion_percentage };
}

export async function patchProfile(
  patch: Partial<BackendProfile>,
): Promise<{ profile: BackendProfile; impacted_modules: string[]; changed_keys: string[] }> {
  return backend("/api/v1/profile", { method: "PATCH", body: patch });
}

// ---- Case ----

export async function getActiveCase(): Promise<CaseSummary> {
  return backend<CaseSummary>("/api/v1/case/active");
}

// ---- Resume ----

export interface ResumeUploadResponse {
  parse_id: string;
  status: "parsing" | "ready" | "failed";
  extracted?: BackendProfile;
}

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  return backend<ResumeUploadResponse>("/api/v1/resume/upload", {
    method: "POST",
    multipart: fd,
  });
}

export async function getResumeStatus(parseId: string): Promise<ResumeUploadResponse> {
  return backend<ResumeUploadResponse>(`/api/v1/resume/${parseId}`);
}

export interface ApplyResumeResponse {
  parse_id: string;
  profile_completion: number;
  fields_filled_from_resume: string[];
  field_sources: Record<string, string>;
}

export async function applyResumeToProfile(parseId: string): Promise<ApplyResumeResponse> {
  return backend<ApplyResumeResponse>(`/api/v1/resume/${parseId}/apply`, { method: "POST" });
}

// ---- Module run helpers ----

const SLUGS = {
  country_comparison: "country-comparison",
  jobfit: "job-fit",
  visa: "visa",
  family: "family",
  finance: "finance",
  documents: "documents",
  workflow: "workflow",
  culture: "culture",
  timeline: "timeline",
  synthesis: "synthesis",
} as const;

type Kind = keyof typeof SLUGS;

async function moduleRun<TDetail>(
  caseId: string,
  kind: Kind,
  body: Record<string, unknown> = {},
): Promise<ModuleResponse<TDetail>> {
  return backend<ModuleResponse<TDetail>>(
    `/api/v1/case/${caseId}/${SLUGS[kind]}/run`,
    { method: "POST", body },
  );
}

async function moduleLatest<TDetail>(
  caseId: string,
  kind: Kind,
): Promise<ModuleResponse<TDetail> | null> {
  try {
    return await backend<ModuleResponse<TDetail>>(
      `/api/v1/case/${caseId}/${SLUGS[kind]}`,
    );
  } catch (e) {
    if (e instanceof BackendApiError && e.status === 404) return null;
    throw e;
  }
}

/**
 * Generic helper: get the latest analysis row, or run if missing or stale.
 * Returns the freshest envelope the user should see.
 *
 * Resilience: if the run-call fails (missing-input 400, backend 5xx, etc.)
 * we synthesize a `failed` ModuleResponse so the page renders
 * `FailedEnvelopeView` instead of throwing an uncaught error overlay.
 * Server components can't catch errors from descendants, so the boundary
 * has to live here.
 */
async function ensureLatestOrRun<TDetail>(
  caseId: string,
  kind: Kind,
  body: Record<string, unknown> = {},
): Promise<ModuleResponse<TDetail>> {
  const latest = await moduleLatest<TDetail>(caseId, kind);
  if (latest && latest.status === "ready" && !latest.recompute_required) {
    return latest;
  }
  try {
    return await moduleRun<TDetail>(caseId, kind, body);
  } catch (e) {
    if (latest) return latest;
    return _synthesizeFailedRow<TDetail>(caseId, kind, e);
  }
}

function _synthesizeFailedRow<TDetail>(
  caseId: string,
  kind: Kind,
  e: unknown,
): ModuleResponse<TDetail> {
  const message =
    e instanceof BackendApiError ? e.message : (e as Error)?.message ?? "Run failed.";
  const code = e instanceof BackendApiError ? e.code : "client_error";
  const now = new Date().toISOString();
  return {
    id: `synthetic-${kind}-${Date.now()}`,
    case_id: caseId,
    kind,
    status: "failed",
    envelope: {
      kind,
      status: "failed",
      error_code: code,
      user_message: message,
      metadata: {
        model: "n/a",
        prompt_version: "n/a",
        input_hash: "n/a",
        analysis_version: 0,
        detail: message,
      },
    } as unknown as ModuleResponse<TDetail>["envelope"],
    analysis_version: 0,
    stale: false,
    recompute_required: false,
    stale_reason: null,
    created_at: now,
    updated_at: now,
  } as unknown as ModuleResponse<TDetail>;
}

// ---- typed wrappers per module ----

export const country = {
  latest: (caseId: string) =>
    moduleLatest<CountryComparisonDetail>(caseId, "country_comparison"),
  ensure: (caseId: string) =>
    ensureLatestOrRun<CountryComparisonDetail>(caseId, "country_comparison"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<CountryComparisonDetail>(caseId, "country_comparison", body),
  /**
   * Deterministic multi-country decision board. Cheap (no Vertex);
   * safe to call on every weight slider change.
   */
  shortlist: (caseId: string, body: ShortlistRequest) =>
    backend<ShortlistResponse>(
      `/api/v1/case/${caseId}/country-comparison/shortlist`,
      { method: "POST", body },
    ),
};

export const jobfit = {
  latest: (caseId: string) => moduleLatest<JobFitDetail>(caseId, "jobfit"),
  ensure: (caseId: string) => ensureLatestOrRun<JobFitDetail>(caseId, "jobfit"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<JobFitDetail>(caseId, "jobfit", body),
};

export const visa = {
  latest: (caseId: string) => moduleLatest<VisaDirectionDetail>(caseId, "visa"),
  ensure: (caseId: string) => ensureLatestOrRun<VisaDirectionDetail>(caseId, "visa"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<VisaDirectionDetail>(caseId, "visa", body),
};

export const family = {
  latest: (caseId: string) => moduleLatest<FamilyImpactDetail>(caseId, "family"),
  ensure: (caseId: string, body?: Record<string, unknown>) =>
    body
      ? moduleRun<FamilyImpactDetail>(caseId, "family", body)
      : ensureLatestOrRun<FamilyImpactDetail>(caseId, "family"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<FamilyImpactDetail>(caseId, "family", body),
};

export const finance = {
  latest: (caseId: string) => moduleLatest<FinanceDetail>(caseId, "finance"),
  ensure: (caseId: string) => ensureLatestOrRun<FinanceDetail>(caseId, "finance"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<FinanceDetail>(caseId, "finance", body),
};

export const documents = {
  latest: (caseId: string) => moduleLatest<DocumentChecklistDetail>(caseId, "documents"),
  ensure: (caseId: string) =>
    ensureLatestOrRun<DocumentChecklistDetail>(caseId, "documents"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<DocumentChecklistDetail>(caseId, "documents", body),
};

export const workflow = {
  latest: (caseId: string) => moduleLatest<WorkflowDetail>(caseId, "workflow"),
  ensure: (caseId: string) => ensureLatestOrRun<WorkflowDetail>(caseId, "workflow"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<WorkflowDetail>(caseId, "workflow", body),
};

export const culture = {
  latest: (caseId: string) => moduleLatest<CultureDetail>(caseId, "culture"),
  ensure: (caseId: string) => ensureLatestOrRun<CultureDetail>(caseId, "culture"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<CultureDetail>(caseId, "culture", body),
};

export const timeline = {
  latest: (caseId: string) => moduleLatest<TimelineDetail>(caseId, "timeline"),
  ensure: (caseId: string) => ensureLatestOrRun<TimelineDetail>(caseId, "timeline"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<TimelineDetail>(caseId, "timeline", body),
};

export const synthesis = {
  latest: (caseId: string) => moduleLatest<SynthesisDetail>(caseId, "synthesis"),
  ensure: (caseId: string) => ensureLatestOrRun<SynthesisDetail>(caseId, "synthesis"),
  run: (caseId: string, body?: Record<string, unknown>) =>
    moduleRun<SynthesisDetail>(caseId, "synthesis", body),
};

// ---- Finance category deep-dive (housing | utilities | food | transport | healthcare) ----
// One service handles all five categories; the route includes {category}.
// We don't use the generic `moduleLatest` helper because each category is its
// own kind (`finance_cat_<category>`) and uses a different URL prefix.

export type FinanceCategoryResponse = ModuleResponse<FinanceCategoryDetail> & {
  category: FinanceCategoryKey;
};

async function financeCategoryLatest(
  caseId: string,
  category: FinanceCategoryKey,
): Promise<FinanceCategoryResponse | null> {
  try {
    return await backend<FinanceCategoryResponse>(
      `/api/v1/case/${caseId}/finance/category/${category}`,
    );
  } catch (e) {
    if (e instanceof BackendApiError && e.status === 404) return null;
    throw e;
  }
}

async function financeCategoryRun(
  caseId: string,
  category: FinanceCategoryKey,
  body: Record<string, unknown> = {},
): Promise<FinanceCategoryResponse> {
  return backend<FinanceCategoryResponse>(
    `/api/v1/case/${caseId}/finance/category/${category}/run`,
    { method: "POST", body },
  );
}

/**
 * Get-or-create wrapper that mirrors `ensureLatestOrRun` semantics:
 * returns the cached row if it exists and is fresh, otherwise calls /run.
 * On any failure, returns a synthetic failed envelope so server components
 * can render the failure state without crashing.
 */
async function financeCategoryEnsure(
  caseId: string,
  category: FinanceCategoryKey,
): Promise<FinanceCategoryResponse> {
  const latest = await financeCategoryLatest(caseId, category);
  if (latest && latest.status === "ready" && !latest.recompute_required) {
    return latest;
  }
  try {
    return await financeCategoryRun(caseId, category);
  } catch (e) {
    if (e instanceof BackendApiError) {
      return {
        id: latest?.id ?? "synthetic",
        case_id: caseId,
        kind: `finance_cat_${category}` as unknown as ModuleResponse<FinanceCategoryDetail>["kind"],
        status: "failed",
        envelope: {
          status: "failed",
          kind: `finance_cat_${category}` as unknown as FailedEnvelopeKindShim,
          error_code: e.code,
          user_message: e.message,
          metadata: { detail: e.detail },
        } as unknown as FinanceCategoryResponse["envelope"],
        analysis_version: latest?.analysis_version ?? 1,
        stale: latest?.stale ?? false,
        recompute_required: latest?.recompute_required ?? false,
        stale_reason: latest?.stale_reason ?? null,
        category,
      } satisfies FinanceCategoryResponse;
    }
    throw e;
  }
}

// FailedEnvelope.kind is typed as AnalysisKind on the page renderer, but the
// finance-category sub-feature uses its own kind strings. The shim type lets
// the synthetic failure object satisfy the structural shape without polluting
// the canonical AnalysisKind union.
type FailedEnvelopeKindShim = string;

export const financeCategory = {
  latest: financeCategoryLatest,
  run: financeCategoryRun,
  ensure: financeCategoryEnsure,
};

export const SLUG_BY_KIND = SLUGS;
