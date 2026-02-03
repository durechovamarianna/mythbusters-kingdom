import { defineConfig } from "@playwright/test";

const PORT = 4173;
const LOCAL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",

  // SK: bezpečnosť v CI – ak omylom necháš test.only, CI spadne.
  // EN: safety in CI – prevents accidental test.only merges.
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 1 : 1,
  fullyParallel: false,
  workers: 1,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.PW_BASE_URL || LOCAL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: {
    command: `npx http-server . -p ${PORT} -c-1`,
    url: LOCAL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  // SK: HTML report nech sa negeneruje ako popup, v CI je aj tak v artifacts.
  // EN: HTML report without auto-open; in CI you can download artifacts.
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],

  projects: [
    { name: "smoke", testMatch: /.*\.smoke\.spec\.ts/ },
    { name: "regression", testMatch: /.*\.regression\.spec\.ts/ },
    { name: "e2e", testMatch: /.*\.e2e\.spec\.ts/ },
  ],
});
