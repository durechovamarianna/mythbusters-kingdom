import { defineConfig } from "@playwright/test";

const PORT = 4173;
const LOCAL = `http://127.0.0.1:${PORT}`;

// SK: Ak je nastavený PW_BASE_URL, testovať proti “externému” prostrediu (napr. GitHub Pages).
// EN: If PW_BASE_URL is set, tests run against an external environment (e.g., GitHub Pages).
const RAW_BASE_URL = process.env.PW_BASE_URL;
const IS_EXTERNAL_BASE_URL = !!RAW_BASE_URL;

// SK: Normalizovať baseURL (odstrániť trailing slash), aby odkazy typu "dragon.html" fungovali rovnako.
// EN: Normalize baseURL (remove trailing slash) so "dragon.html" resolves consistently.
const NORMALIZED_BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : undefined;

export default defineConfig({
  testDir: "./tests",

  // SK: Bezpečnosť v CI – ak omylom necháš test.only, CI spadne.
  // EN: Safety in CI – prevents accidental test.only merges.
  forbidOnly: !!process.env.CI,

  // SK: V CI povoliť 1 retry (kvôli flakiness). Lokálne radšej 0 (aby si hneď videla chybu).
  // EN: In CI allow 1 retry (to reduce flakiness). Locally prefer 0 (fail fast).
  retries: process.env.CI ? 1 : 0,

  // SK: Stabilita: v CI radšej 1 worker. Lokálne môžeš zmeniť podľa potreby.
  // EN: Stability: use 1 worker in CI. Adjust locally if you want.
  fullyParallel: false,
  workers: process.env.CI ? 1 : 1,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    // SK: V CI proti GitHub Pages nastav PW_BASE_URL.
    // EN: In CI against GitHub Pages set PW_BASE_URL.
    baseURL: NORMALIZED_BASE_URL || LOCAL,

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

  // SK: V CI zobrazovať "github" output + vygenerovať HTML report do artifactu.
  // EN: In CI use "github" reporter + generate HTML report to artifacts.
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],

  projects: [
    { name: "smoke", testMatch: /.*\.smoke\.spec\.ts/ },
    { name: "regression", testMatch: /.*\.regression\.spec\.ts/ },
    { name: "e2e", testMatch: /.*\.e2e\.spec\.ts/ },
  ],
});