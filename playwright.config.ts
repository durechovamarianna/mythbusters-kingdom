import { defineConfig } from "@playwright/test";

const PORT = 4173;
const LOCAL = `http://127.0.0.1:${PORT}`;

// SK: Ak je nastavený PW_BASE_URL, testovať proti “externému” prostrediu (napr. GitHub Pages).
// EN: If PW_BASE_URL is set, tests run against an external environment (e.g., GitHub Pages).
const IS_EXTERNAL_BASE_URL = !!process.env.PW_BASE_URL;

export default defineConfig({
  testDir: "./tests",

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 1 : 1,
  fullyParallel: false,
  workers: 1,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    // SK: V CI proti GitHub Pages nastav PW_BASE_URL.
    // EN: In CI against GitHub Pages set PW_BASE_URL.
    baseURL: process.env.PW_BASE_URL || LOCAL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // ✅ KĽÚČOVÉ: webServer zapnúť len keď testujeme lokálne
  // SK: Keď testovať proti GitHub Pages, webServer netreba a môže robiť problémy.
  // EN: When testing GitHub Pages, webServer is not needed and can cause issues.
  webServer: IS_EXTERNAL_BASE_URL
    ? undefined
    : {
        command: `npx http-server . -p ${PORT} -c-1`,
        url: LOCAL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],

  projects: [
    { name: "smoke", testMatch: /.*\.smoke\.spec\.ts/ },
    { name: "regression", testMatch: /.*\.regression\.spec\.ts/ },
    { name: "e2e", testMatch: /.*\.e2e\.spec\.ts/ },
  ],
});