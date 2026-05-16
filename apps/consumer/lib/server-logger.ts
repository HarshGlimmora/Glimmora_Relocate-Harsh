/**
 * Server-only logger for backend / fetch errors.
 *
 * Why this exists: when a server action's `fetch()` to the FastAPI backend
 * fails (ECONNREFUSED, DNS, TLS, etc.), Next.js swallows the cause chain and
 * the dev terminal only shows `TypeError: fetch failed`. That's useless for
 * debugging. This logger unwraps the `cause` chain and prints the actual
 * underlying error.
 *
 * On serverless platforms (Vercel) the working directory is read-only, so
 * the file-append fallback targets `/tmp` instead. On Vercel `/tmp` is
 * per-instance ephemeral — file logs are useful only for the lifetime of a
 * warm Lambda. Console output, written from `console.error`, is the
 * authoritative log sink and is captured by the platform.
 *
 * Use from server-only modules (server actions, route handlers, RSC). Do
 * NOT import from a client component.
 */

import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// Vercel and most serverless runtimes only allow writes under /tmp. Locally
// we keep behaviour identical by also using a /tmp path.
const LOG_DIR = "/tmp/glimmora-logs";
const LOG_FILE = join(LOG_DIR, "backend-errors.log");

let _dirEnsured = false;
async function ensureLogDir(): Promise<void> {
  if (_dirEnsured) return;
  await mkdir(LOG_DIR, { recursive: true });
  _dirEnsured = true;
}

interface BackendErrorContext {
  source: "backend-client" | "backend-auth" | string;
  method?: string;
  url?: string;
  status?: number;
  durationMs?: number;
  error: unknown;
  extra?: Record<string, unknown>;
}

/** Walk `.cause` until we hit something without one. Caps at 5 to avoid loops. */
function unwrapCauses(err: unknown): unknown[] {
  const chain: unknown[] = [];
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur; i++) {
    chain.push(cur);
    cur = (cur as { cause?: unknown })?.cause;
  }
  return chain;
}

function describeError(err: unknown): {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  causes: { name: string; message: string; code?: string }[];
  // For Node fetch ECONNREFUSED, the cause is an AggregateError whose
  // `.errors` array has the per-address attempt details (v4 vs v6).
  aggregate?: { code?: string; address?: string; port?: number }[];
} {
  const e = err as { name?: string; message?: string; code?: string; stack?: string; errors?: unknown[] };
  const chain = unwrapCauses(err).slice(1).map((c) => {
    const x = c as { name?: string; message?: string; code?: string };
    return {
      name: x?.name ?? "UnknownError",
      message: x?.message ?? String(c),
      code: x?.code,
    };
  });
  let aggregate: { code?: string; address?: string; port?: number }[] | undefined;
  // Pull out aggregate-error inner errors from anywhere in the cause chain.
  for (const link of unwrapCauses(err)) {
    const inner = (link as { errors?: unknown[] })?.errors;
    if (Array.isArray(inner) && inner.length > 0) {
      aggregate = inner.map((ie) => {
        const x = ie as { code?: string; address?: string; port?: number };
        return { code: x?.code, address: x?.address, port: x?.port };
      });
      break;
    }
  }
  return {
    name: e?.name ?? "UnknownError",
    message: e?.message ?? String(err),
    code: e?.code,
    stack: e?.stack,
    causes: chain,
    aggregate,
  };
}

/**
 * Log a backend / fetch error. Prints a multi-line, easy-to-read block to
 * the terminal AND appends one JSON line to `.logs/backend-errors.log`.
 */
export function logBackendError(ctx: BackendErrorContext): void {
  const detail = describeError(ctx.error);
  const ts = new Date().toISOString();

  const header = `[${ctx.source}] ${ctx.method ?? ""} ${ctx.url ?? ""}`.trim();
  const lines: string[] = [
    `\n=== backend error @ ${ts} ===`,
    header,
    ctx.status !== undefined ? `  status: ${ctx.status}` : "",
    ctx.durationMs !== undefined ? `  duration: ${ctx.durationMs}ms` : "",
    `  error: ${detail.name}: ${detail.message}` +
      (detail.code ? ` (code=${detail.code})` : ""),
    ...detail.causes.map(
      (c) => `  cause: ${c.name}: ${c.message}` + (c.code ? ` (code=${c.code})` : ""),
    ),
    ...(detail.aggregate ?? []).map(
      (a) =>
        `  attempt: ${a.address ?? "?"}:${a.port ?? "?"}` +
        (a.code ? ` ${a.code}` : ""),
    ),
    ctx.extra ? `  extra: ${JSON.stringify(ctx.extra)}` : "",
  ].filter(Boolean);

  for (const ln of lines) console.error(ln);

  const record = {
    ts,
    source: ctx.source,
    method: ctx.method,
    url: ctx.url,
    status: ctx.status,
    durationMs: ctx.durationMs,
    error: detail,
    extra: ctx.extra,
  };

  // Fire-and-forget. We don't await — we don't want logging to block the
  // request, and we don't want a logging failure to mask the original error.
  ensureLogDir()
    .then(() => appendFile(LOG_FILE, JSON.stringify(record) + "\n", "utf8"))
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[server-logger] failed to write log file:", e);
    });
}
