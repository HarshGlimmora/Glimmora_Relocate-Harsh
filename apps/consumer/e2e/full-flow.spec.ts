import { test, Page } from "@playwright/test";

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
  const overlayCount = await page.locator("[data-nextjs-dialog]").count();
  if (overlayCount > 0) {
    const t = await page.locator("[data-nextjs-dialog]").first().innerText().catch(() => "");
    throw new Error(`${label}: Next.js dialog overlay: ${t.slice(0, 500)}`);
  }
}

test("full intent-aware pipeline: signup → intent → resume → profile → 10 modules with value leads", async ({ page }) => {
  test.setTimeout(30 * 60_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(`pageerror: ${e.message}`));

  const stamp = Date.now();
  const email = `e2e+${stamp}@example.com`;
  const password = "abcdef1234";

  // ---- Sign up ----
  await page.goto(`${BASE}/sign-up`);
  await page.fill('input[name="name"]', "E2E Tester");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.locator('label:has(input[type="checkbox"])').first().click();
  await page.click('button[type="submit"]');

  // ---- Goal step (relocation_goal + reason_for_moving, replaces /intent) ----
  await page.waitForURL(/\/app\/onboarding\/goal/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "goal-page-load");
  const intentChosen = "find_job_abroad";
  await page.locator(`button[data-intent="${intentChosen}"]`).click();
  // Optional one-line reason; fill so reason_for_moving lands on the profile.
  await page
    .getByPlaceholder(/partner has family/i)
    .fill("targeting EU tech market");
  await page.locator('button[data-onboarding-next]').click();

  // ---- Resume upload ----
  await page.waitForURL(/\/app\/onboarding\/resume/, { timeout: 15_000 });
  await expectNoNextRuntimeError(page, "resume-page-load");
  await page.setInputFiles('input[type="file"]', RESUME_PATH);
  await page.click('button[type="submit"]:has-text("Upload")');
  await page.waitForSelector(
    'button:has-text("Apply to my profile"), button:has-text("Try another file")',
    { timeout: 180_000 },
  );
  await expectNoNextRuntimeError(page, "resume-after-upload");
  const applyBtn = page.locator('button:has-text("Apply to my profile")');
  if (await applyBtn.count()) {
    // Resume preview block must show extracted-vs-missing context.
    const previewCount = await page.locator("[data-resume-preview]").count();
    if (previewCount === 0) {
      throw new Error("resume preview block missing after upload");
    }
    await applyBtn.click();
  } else {
    await page.click('button:has-text("Skip")');
  }

  // ---- Profile review (identity only — destination etc. moved to later steps) ----
  await page.waitForURL(/\/app\/onboarding\/profile/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "profile-page-load");
  const completenessCount = await page.locator("[data-profile-completeness]").count();
  if (completenessCount === 0) {
    throw new Error("profile page missing completeness meter");
  }
  const fillByLabel = async (labelText: string | RegExp, value: string) => {
    const input = page.getByLabel(labelText).first();
    await input.waitFor({ state: "visible", timeout: 15_000 });
    await input.fill(value);
  };
  // Identity fields only. The previous gate (target_country here) moved
  // to the destination step.
  await fillByLabel(/Years of experience/i, "8");
  await fillByLabel(/Seniority/i, "senior");
  await page.locator('form button[type="submit"]').last().click();

  // ---- Destination step — full country names, no ISO codes in UI ----
  await page.waitForURL(/\/app\/onboarding\/destination/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "destination-page-load");
  await page
    .locator('select[data-country-select]')
    .first()
    .selectOption("DE");
  // Confirm the readable name appears under the picker.
  const targetNameText = await page
    .locator("[data-target-country-name]")
    .innerText()
    .catch(() => "");
  if (!/Germany/.test(targetNameText)) {
    throw new Error(
      `destination step did not render country name "Germany"; saw: "${targetNameText}"`,
    );
  }
  await page.locator('button[data-onboarding-next]').click();

  // ---- Jobs intake ----
  await page.waitForURL(/\/app\/onboarding\/jobs/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "jobs-intake-page-load");
  await page
    .getByPlaceholder(/Senior backend engineer/i)
    .fill("Senior Backend Engineer");
  await page.getByPlaceholder(/fintech/i).fill("fintech");
  await page.locator('button[data-focus="career"]').click();
  await page.locator('button[data-onboarding-next]').click();

  // ---- Family intake ----
  await page.waitForURL(/\/app\/onboarding\/family/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "family-intake-page-load");
  await page.locator('button[data-onboarding-next]').click();

  // ---- Visa intake (full country names again) ----
  await page.waitForURL(/\/app\/onboarding\/visa/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "visa-intake-page-load");
  await page
    .locator('select[data-country-select="nationality"]')
    .selectOption("IN");
  await page
    .locator('select[data-country-select="current_country"]')
    .selectOption("IN");
  const nationalityText = await page
    .locator("[data-nationality-name]")
    .innerText()
    .catch(() => "");
  if (!/India/.test(nationalityText)) {
    throw new Error(
      `visa step did not render nationality name "India"; saw: "${nationalityText}"`,
    );
  }
  await page.locator('button[data-onboarding-next]').click();

  // ---- Budget intake ----
  await page.waitForURL(/\/app\/onboarding\/budget/, { timeout: 30_000 });
  await expectNoNextRuntimeError(page, "budget-intake-page-load");
  await page.getByPlaceholder("1500000").fill("1500000");
  await page.getByPlaceholder("85000").fill("85000");
  await page.getByPlaceholder("20000").fill("20000");
  await page.locator('button[data-onboarding-next]').click();
  // Budget step kicks off the first analysis page; long wait for Vertex.
  await page.waitForURL(/\/app\/country/, { timeout: 240_000 });
  await expectNoNextRuntimeError(page, "country-after-onboarding");

  // ---- Country names visible: destination chips show "Germany", not "DE" ----
  const switcher = page.locator("[data-destination-switcher]");
  if (await switcher.count()) {
    const switcherText = await switcher.innerText();
    if (!/Germany|Netherlands|Ireland/.test(switcherText)) {
      throw new Error(
        `destination switcher should show full country names, got: ${switcherText.slice(0, 200)}`,
      );
    }
    // Active chip MUST not be just "DE" / "NL" — that would be an ISO leak.
    const isoOnly = await switcher.locator("button:text-matches(\"^[A-Z]{2}$\")").count();
    if (isoOnly > 0) {
      throw new Error("destination switcher leaked an ISO-only label");
    }
  }

  // ---- Each module must render: value lead + intent framing + interactive panel ----
  const expected: Record<string, RegExp> = {
    "/app/country": /Why this country/i,
    "/app/jobs": /career path/i,
    "/app/visa": /likely route/i,
    "/app/family": /everyone (with you|moving)/i,
    "/app/finance": /Affordable comfortably/i,
    "/app/documents": /missing/i,
    "/app/workflow": /critical path/i,
    "/app/culture": /first week/i,
    "/app/timeline": /earliest realistic/i,
    "/app/synthesis": /Should you move/i,
  };

  const expectedPanel: Record<string, string> = {
    "/app/country": "country",
    "/app/jobs": "jobs",
    "/app/visa": "visa",
    "/app/family": "family",
    "/app/finance": "finance",
    "/app/documents": "documents",
    "/app/workflow": "workflow",
    "/app/culture": "culture",
    "/app/timeline": "timeline",
    "/app/synthesis": "synthesis",
  };

  const failures: string[] = [];

  async function gotoWithRetry(url: string): Promise<number> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await page.goto(url, {
          timeout: 300_000,
          waitUntil: "domcontentloaded",
        });
        return resp?.status() ?? 0;
      } catch (e) {
        const msg = (e as Error).message ?? "";
        // Chromium can suspend IO under load; retry after a short cool-off.
        if (/ERR_NETWORK_IO_SUSPENDED|ERR_ABORTED|ERR_FAILED/.test(msg) && attempt < 2) {
          await page.waitForTimeout(2000);
          continue;
        }
        throw e;
      }
    }
    return 0;
  }

  for (const route of MODULE_ROUTES) {
    const status = await gotoWithRetry(`${BASE}${route}`);
    await expectNoNextRuntimeError(page, `module-${route}`);
    if (status >= 400) {
      failures.push(`${route}: HTTP ${status}`);
      continue;
    }

    // Required: a ValueLead at the top of the page.
    const valueLeadCount = await page.locator("[data-value-lead]").count();
    if (valueLeadCount === 0) {
      failures.push(`${route}: missing ValueLead (one unique insight)`);
      continue;
    }

    // Required: intent framing line shown (a non-canonical-flow signal).
    const framingCount = await page.locator("[data-intent-framing]").count();
    if (framingCount === 0) {
      failures.push(`${route}: missing intent framing line`);
      continue;
    }

    // Required: a module panel — the per-page interaction.
    const panelKey = expectedPanel[route];
    const panelCount = await page
      .locator(`[data-module-panel="${panelKey}"]`)
      .count();
    if (panelCount === 0) {
      failures.push(`${route}: missing interactive panel [data-module-panel="${panelKey}"]`);
      continue;
    }
    const applyBtnCount = await page
      .locator(`[data-module-panel="${panelKey}"] [data-panel-apply]`)
      .count();
    if (applyBtnCount === 0) {
      failures.push(`${route}: panel has no apply button`);
      continue;
    }

    // Required: the page heading text matches its purpose.
    const main = await page.locator("main").innerText();
    if (!expected[route].test(main)) {
      failures.push(
        `${route}: page heading didn't match "${expected[route]}" — got: ${main
          .replace(/\s+/g, " ")
          .slice(0, 120)}`,
      );
    }
  }

  // ---- Interactivity proof: change a setting and confirm it round-trips ----
  // We hit the jobs page and toggle a focus chip, then re-run.
  await gotoWithRetry(`${BASE}/app/jobs`);
  // Click the first focus chip (any) and submit.
  const firstChip = page
    .locator('[data-module-panel="jobs"] [data-chip]')
    .first();
  if (await firstChip.count()) {
    await firstChip.click();
  }
  const jobsApply = page
    .locator('[data-module-panel="jobs"] [data-panel-apply]')
    .first();
  await jobsApply.click();
  // The page either reaches "applied" status or shows the panel-error.
  const applied = page.locator('[data-module-panel="jobs"] [data-panel-status="applied"]');
  const panelErr = page.locator('[data-module-panel="jobs"] [data-panel-error]');
  await Promise.race([
    applied.waitFor({ state: "visible", timeout: 240_000 }).catch(() => null),
    panelErr.waitFor({ state: "visible", timeout: 240_000 }).catch(() => null),
  ]);
  if (!(await applied.count()) && !(await panelErr.count())) {
    failures.push("jobs panel: no applied/error feedback after submit");
  }

  // ---- Sidebar reordered by intent ----
  // For find_job_abroad emphasis, jobs should appear before country in the
  // Analysis section.
  const sidebar = await page.locator('aside ul:has(a[href="/app/country"])').first();
  const linkOrder = await sidebar.locator("a").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href")),
  );
  const jobsIdx = linkOrder.indexOf("/app/jobs");
  const countryIdx = linkOrder.indexOf("/app/country");
  if (jobsIdx < 0 || countryIdx < 0 || jobsIdx > countryIdx) {
    failures.push(
      `sidebar not reordered by intent: jobs=${jobsIdx}, country=${countryIdx}`,
    );
  }

  if (pageErrors.length) failures.push(...pageErrors);
  if (failures.length) throw new Error("Failures:\n  " + failures.join("\n  "));
});
