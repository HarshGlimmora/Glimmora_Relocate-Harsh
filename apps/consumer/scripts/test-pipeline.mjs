/**
 * Headless end-to-end smoke for the consumer's backend wiring.
 *
 * Hits the FastAPI backend directly using the same shapes the API
 * client uses, plus walks the full pipeline for one persona. Run with:
 *
 *   GLIMMORA_BACKEND_URL=http://127.0.0.1:8765 \
 *     node apps/consumer/scripts/test-pipeline.mjs
 */

const BASE = process.env.GLIMMORA_BACKEND_URL ?? "http://127.0.0.1:8000";

async function call(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const ct = res.headers.get("content-type") ?? "";
  const payload = ct.includes("json") ? await res.json() : await res.text();
  if (!res.ok) {
    throw new Error(`${path} → ${res.status} ${JSON.stringify(payload).slice(0, 200)}`);
  }
  return payload;
}

const email = `smoke-${Date.now()}@x.io`;
console.log(`[smoke] register ${email}`);
const reg = await call("/api/v1/auth/register", {
  method: "POST",
  body: { email, password: "hunter2-strong-1234567890", name: "Smoke User" },
});
const token = reg.tokens.access_token;
const caseId = reg.case_id;
console.log(`  caseId=${caseId}`);

console.log("[smoke] PATCH profile");
const patch = await call("/api/v1/profile", {
  method: "PATCH",
  token,
  body: {
    full_name: "Smoke User",
    current_role: "Senior Data Engineer",
    industry: "Fintech",
    current_country: "IN",
    target_country: "DE",
    target_city: "Berlin",
    nationality: "IN",
    needs_visa_sponsorship: true,
    move_urgency: "12m",
    current_salary: 35000,
    expected_salary: 85000,
    salary_currency: "EUR",
    current_document_status: { PASSPORT: { has: true }, CV: { has: true } },
  },
});
console.log(`  impacted: ${patch.impacted_modules.join(",")}`);

const SLUGS = ["country-comparison","job-fit","visa","family","finance","documents","workflow","culture","timeline"];
for (const slug of SLUGS) {
  const r = await call(`/api/v1/case/${caseId}/${slug}/run`, { method: "POST", token, body: {} });
  const env = r.envelope ?? {};
  const score = env.score ?? "?";
  console.log(`  ${slug.padEnd(20)} ${r.status.padEnd(8)} score=${score}`);
}
const syn = await call(`/api/v1/case/${caseId}/synthesis/run`, { method: "POST", token, body: {} });
console.log(`  synthesis            ${syn.status.padEnd(8)} score=${syn.envelope.score} verdict=${syn.envelope.detail?.verdict}`);

console.log("[smoke] DONE");
