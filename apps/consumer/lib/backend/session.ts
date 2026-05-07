/**
 * Backend session bridge.
 *
 * The consumer app's NextAuth user is the source of truth. The FastAPI
 * backend has its own auth (`/api/v1/auth/register|login|refresh`), so
 * we mirror every consumer user onto the backend and store the
 * resulting tokens in the `BackendSession` table.
 *
 * `ensureBackendSession()` is the single entry point: it returns a
 * fresh access token, registering the user on the backend on first
 * call and refreshing the access token when it's stale.
 */

import "server-only";
import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logBackendError } from "@/lib/server-logger";

const BACKEND_BASE_URL =
  process.env.GLIMMORA_BACKEND_URL ?? "http://localhost:8000";

// 60s safety margin before the actual `expires_in` runs out.
const EXPIRY_SAFETY_MS = 60_000;

// Refresh proactively when the cached token has less than this remaining.
// One safety margin gets baked into expiresAt at storage; this gives a second
// margin at read time so a request scheduled "right at" expiry never goes
// out with a token the backend will reject.
const PROACTIVE_REFRESH_WINDOW_MS = 60_000;

interface TokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface BackendTokens {
  access_token: string;
  refresh_token: string;
  access_expires_at: string; // ISO
  refresh_expires_at?: string;
}

interface RegisterResponse {
  user: { id: string; email: string };
  case_id: string;
  tokens: BackendTokens;
}

interface LoginResponse {
  user: { id: string; email: string };
  case_id: string;
  tokens: BackendTokens;
}

type RefreshResponse = BackendTokens;

async function backendAuthCall<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${path}`;
  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (e) {
    logBackendError({
      source: "backend-auth",
      method: "POST",
      url,
      durationMs: Date.now() - t0,
      error: e,
    });
    throw e;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`backend ${path} failed: ${res.status} ${text.slice(0, 200)}`);
    logBackendError({
      source: "backend-auth",
      method: "POST",
      url,
      status: res.status,
      durationMs: Date.now() - t0,
      error: err,
      extra: { responseBody: text.slice(0, 500) },
    });
    throw err;
  }
  return (await res.json()) as T;
}

function expiresAtFromIso(iso: string): Date {
  // Backend emits ISO timestamps for token expiry; subtract a 60s safety margin.
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return new Date(Date.now() + 14 * 60_000); // 14 min default
  return new Date(t - EXPIRY_SAFETY_MS);
}

/** Register the consumer user on the FastAPI backend (first time). */
async function registerOnBackend(user: {
  id: string;
  email: string;
  name: string | null;
}): Promise<{ caseId: string; backendUserId: string; bundle: TokenBundle; backendPassword: string }> {
  const backendPassword = randomBytes(24).toString("hex"); // 48 chars, > 8 min
  const r = await backendAuthCall<RegisterResponse>("/api/v1/auth/register", {
    email: user.email,
    password: backendPassword,
    name: user.name ?? undefined,
  });
  return {
    caseId: r.case_id,
    backendUserId: r.user.id,
    backendPassword,
    bundle: {
      accessToken: r.tokens.access_token,
      refreshToken: r.tokens.refresh_token,
      expiresAt: expiresAtFromIso(r.tokens.access_expires_at),
    },
  };
}

/** Re-login if our refresh token is dead and we still have the password. */
async function loginOnBackend(email: string, password: string): Promise<{ caseId: string; backendUserId: string; bundle: TokenBundle }> {
  const r = await backendAuthCall<LoginResponse>("/api/v1/auth/login", {
    email,
    password,
  });
  return {
    caseId: r.case_id,
    backendUserId: r.user.id,
    bundle: {
      accessToken: r.tokens.access_token,
      refreshToken: r.tokens.refresh_token,
      expiresAt: expiresAtFromIso(r.tokens.access_expires_at),
    },
  };
}

async function refreshAccessToken(refreshToken: string): Promise<TokenBundle> {
  const r = await backendAuthCall<RefreshResponse>("/api/v1/auth/refresh", {
    refresh_token: refreshToken,
  });
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresAt: expiresAtFromIso(r.access_expires_at),
  };
}

export interface BackendSessionData {
  accessToken: string;
  caseId: string;
  backendUserId: string;
}

/**
 * Per-user in-flight lock. The dashboard fans out parallel module calls
 * which all want a backend session; if the user has no row yet, all of
 * them race to /auth/register and only one wins (409 for the rest).
 * This map serialises the very first call per userId.
 */
const _inflight: Map<string, Promise<BackendSessionData>> = new Map();
const _inflightForce: Map<string, Promise<BackendSessionData>> = new Map();

export interface EnsureOptions {
  /** Force a fresh refresh/login/register cycle even if expiresAt looks fine.
   *  Used by the API client after a 401 from the backend. */
  forceRefresh?: boolean;
}

/**
 * Returns a usable backend session for the currently-signed-in consumer user.
 * Throws if the consumer is not signed in.
 */
export async function ensureBackendSession(
  opts: EnsureOptions = {},
): Promise<BackendSessionData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  // Force-refresh callers share their own in-flight slot so concurrent
  // 401-retries collapse onto a single rotation (no double-register races).
  // Normal callers share the regular slot, but a force-refresh skips it so
  // it can't pick up a stale promise that's already been resolved.
  const slot = opts.forceRefresh ? _inflightForce : _inflight;
  const existing = slot.get(userId);
  if (existing) return existing;
  const p = _ensureBackendSessionInner(
    userId,
    session.user.email,
    session.user.name ?? null,
    opts,
  ).finally(() => {
    if (slot.get(userId) === p) slot.delete(userId);
    // A successful force refresh also makes any normal-slot promise stale.
    if (opts.forceRefresh) _inflight.delete(userId);
  });
  slot.set(userId, p);
  return p;
}

async function _ensureBackendSessionInner(
  userId: string,
  email: string,
  name: string | null,
  opts: EnsureOptions,
): Promise<BackendSessionData> {
  let bs = await prisma.backendSession.findUnique({ where: { userId } });

  // No row yet — register on the backend with a deterministic per-userId
  // email. The user's real email lives only on the consumer side; the
  // backend just needs a unique handle. This avoids collisions when the
  // consumer DB is reset but the backend kept the row, or vice versa.
  if (!bs) {
    // Salt the backend email so each consumer-DB lifetime gets a fresh
    // backend account; collisions are effectively impossible.
    const salt = randomBytes(8).toString("hex");
    const backendEmail = `consumer-${userId}-${salt}@bridge.glimmora-relocate.com`;
    const r = await registerOnBackend({ id: userId, email: backendEmail, name });
    bs = await prisma.backendSession.create({
      data: {
        userId,
        backendUserId: r.backendUserId,
        backendEmail,
        caseId: r.caseId,
        accessToken: r.bundle.accessToken,
        refreshToken: r.bundle.refreshToken,
        expiresAt: r.bundle.expiresAt,
        backendPassword: r.backendPassword,
      },
    });
    return {
      accessToken: bs.accessToken,
      caseId: bs.caseId,
      backendUserId: bs.backendUserId,
    };
  }

  const needsRefresh =
    opts.forceRefresh ||
    bs.expiresAt.getTime() - Date.now() < PROACTIVE_REFRESH_WINDOW_MS;

  if (needsRefresh) {
    bs = await _rotate(userId, bs, name);
  }

  return {
    accessToken: bs.accessToken,
    caseId: bs.caseId,
    backendUserId: bs.backendUserId,
  };
}

/** Try refresh → login → register, in that order, until one succeeds. */
async function _rotate(
  userId: string,
  bs: NonNullable<Awaited<ReturnType<typeof prisma.backendSession.findUnique>>>,
  name: string | null,
) {
  try {
    const fresh = await refreshAccessToken(bs.refreshToken);
    return await prisma.backendSession.update({
      where: { userId },
      data: {
        accessToken: fresh.accessToken,
        refreshToken: fresh.refreshToken,
        expiresAt: fresh.expiresAt,
      },
    });
  } catch {
    // Refresh failed (token rotated/expired/secret changed). Fall back to
    // login with the salted backend email we stored at register time.
  }
  const backendEmail = bs.backendEmail || `consumer-${userId}@bridge.glimmora-relocate.com`;
  try {
    const r = await loginOnBackend(backendEmail, bs.backendPassword);
    return await prisma.backendSession.update({
      where: { userId },
      data: {
        backendUserId: r.backendUserId,
        caseId: r.caseId,
        accessToken: r.bundle.accessToken,
        refreshToken: r.bundle.refreshToken,
        expiresAt: r.bundle.expiresAt,
      },
    });
  } catch {
    // Login failed too — re-register (rare; e.g. backend reset).
  }
  const r = await registerOnBackend({ id: userId, email: backendEmail, name });
  return await prisma.backendSession.update({
    where: { userId },
    data: {
      backendUserId: r.backendUserId,
      caseId: r.caseId,
      accessToken: r.bundle.accessToken,
      refreshToken: r.bundle.refreshToken,
      expiresAt: r.bundle.expiresAt,
      backendPassword: r.backendPassword,
    },
  });
}
