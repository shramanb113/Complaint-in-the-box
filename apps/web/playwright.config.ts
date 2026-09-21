import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:3458",
    viewport: { width: 360, height: 800 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 } } }],
  webServer: {
    command: "node scripts/serve-standalone.mjs",
    url: "http://127.0.0.1:3458/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
