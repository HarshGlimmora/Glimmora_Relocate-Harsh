import { test, expect, Page } from "@playwright/test";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const RESUME_PATH = process.env.E2E_RESUME ||
  "/home/harsh/Documents/Resumes/Resume___Extended.pdf";

const MODULE_ROUTES = [
  "/app/country",
  "/app/jobs",
  "/app/visa",
  "/app/family",
  "/app/finance",
  "/app/documents",
  "/app/workflow",
  "/app/culture",
  "/app/timeline",
  "/app/synthesis",
];

async function expectNoNextRuntimeError(page: Page, label: string) {
  const errorOverlay = page.locator("nextjs-portal").first();
  if (await errorOverlay.count()) {
    const text = await errorOverlay.innerText().catch(() => "");
    if (/Unhandled Runtime Error|Application error/i.test(text)) {
      throw new Error(`${label}: Next.js runtime error: ${text.slice(0, 500)}`);
    }
  }
  // Also catch the standard Next dev error overlay attribute
  const overlayCount = await page.locator("[data-nextjs-dialog]").count();
  if (overlayCount > 0) {
    const t = await page.locator("[data-nextjs-dialog]").first().innerText().catch(() => "");
    throw new Error(`${label}: Next.js dialog overlay: ${t.slice(0, 500)}`);
  }
}

test("full pipeline: signup → resume → profile → 10 modules", async ({ page, context }) => {
  // 10 modules x up to ~60s vertex per module + signup/resume/profile overhead.
  test.setTimeout(30 * 60_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`console.error: ${m.text()}`);
  });

  const stamp = Date.now();
  const email = `e2e+${stamp}@example.com`;
  const password = "abcdef1234";

  // ---- Sign up ----
  await page.goto(`${BASE}/sign-up`);
  await page.fill('input[name="name"]', "E2E Tester");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  // accept terms checkbox (sr-only input — click the label that wraps it)
  await page.locator('label:has(input[type="checkbox"])').first().click();
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "after-signup");

  // ---- Resume upload ----
  await page.goto(`${BASE}/app/onboarding/resume`);
  await expectNoNextRuntimeError(page, "resume-page-load");
  await page.setInputFiles('input[type="file"]', RESUME_PATH);
  await page.click('button[type="submit"]:has-text("Upload")');
  // Wait for either success "Apply" button OR the failure callout
  await page.waitForSelector(
    'button:has-text("Apply to my profile"), button:has-text("Try another file")',
    { timeout: 180_000 },
  );
  await expectNoNextRuntimeError(page, "resume-after-upload");
  // If the apply button is there, click it
  const applyBtn = page.locator('button:has-text("Apply to my profile")');
  if (await applyBtn.count()) {
    await applyBtn.click();
    await page.waitForURL(/\/app\/onboarding\/profile/, { timeout: 30_000 });
  } else {
    // Skip path
    await page.click('button:has-text("Skip — fill manually"), a:has-text("Skip")');
    await page.waitForURL(/\/app\/onboarding\/profile/, { timeout: 30_000 });
  }
  await expectNoNextRuntimeError(page, "profile-page-load");

  // ---- Profile review ----
  // Fill required fields. Inputs sit inside <label> wrappers containing a
  // <span> with the label text. We match by the label text.
  const fillByLabel = async (labelText: string | RegExp, value: string) => {
    const input = page.getByLabel(labelText).first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill(value);
  };
  await fillByLabel(/Current country/i, "IN");
  await fillByLabel(/Target country/i, "DE");
  await fillByLabel(/Nationality/i, "IN");
  await fillByLabel(/Current salary/i, "1500000");
  await fillByLabel(/Expected salary/i, "85000");
  await fillByLabel(/Currency/i, "EUR");
  // Submit
  await page.locator('form button[type="submit"]').last().click();
  // Profile review redirects to /app/country, which runs the first
  // country-comparison analysis synchronously (Vertex ~30–50s).
  await page.waitForURL(/\/app\/country/, { timeout: 240_000 });
  await expectNoNextRuntimeError(page, "profile-after-save");

  // ---- Walk every module page ----
  // Each module is expected to render its `eyebrow` heading and either a
  // "Ready" envelope (with reasoning text) or a Failed-envelope view.
  const expected: Record<string, RegExp> = {
    "/app/country": /Country comparison|Origin vs destination/i,
    "/app/jobs": /Job fit|career lands/i,
    "/app/visa": /Visa|route to your destination/i,
    "/app/family": /Family|everyone moving/i,
    "/app/finance": /Finance|numbers, honestly/i,
    "/app/documents": /Documents|checklist/i,
    "/app/workflow": /Workflow|depends on what/i,
    "/app/culture": /Culture|Arrive ready/i,
    "/app/timeline": /Timeline|When and what/i,
    "/app/synthesis": /Synthesis|Should you move/i,
  };
  const moduleResults: Record<string, string> = {};
  for (const route of MODULE_ROUTES) {
    const resp = await page.goto(`${BASE}${route}`, { timeout: 300_000, waitUntil: "domcontentloaded" });
    const status = resp?.status() ?? 0;
    await page.waitForLoadState("networkidle", { timeout: 300_000 });
    await expectNoNextRuntimeError(page, `module-${route}`);
    if (status >= 400) throw new Error(`${route}: HTTP ${status}`);
    const main = await page.locator("main, [role='main'], body").first().innerText();
    const slice = main.replace(/\s+/g, " ").slice(0, 240);
    moduleResults[route] = slice;
    const want = expected[route];
    if (!want.test(main)) {
      throw new Error(`${route}: missing expected content. Got: ${slice}`);
    }
    if (/Failed analysis|extraction_error|Provider error|Internal Server Error/i.test(main)) {
      throw new Error(`${route}: page shows backend failure: ${slice}`);
    }
  }
  console.log("MODULE RESULTS", JSON.stringify(moduleResults, null, 2));

  // ---- Assertions on captured errors ----
  // Filter benign (font, devtools) noise
  const meaningfulConsole = consoleErrors.filter(
    (e) => !/Failed to load resource: net::ERR_/.test(e) && !/Manifest:/.test(e),
  );
  if (pageErrors.length || meaningfulConsole.length) {
    throw new Error(
      `Captured runtime errors:\n  pageerror: ${pageErrors.join(
        "\n  pageerror: ",
      )}\n  console: ${meaningfulConsole.join("\n  console: ")}`,
    );
  }
});
