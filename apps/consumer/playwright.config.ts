import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30 * 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    headless: true,
    baseURL: process.env.E2E_BASE || "http://localhost:3000",
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
  },
});
