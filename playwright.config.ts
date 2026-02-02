import { defineConfig } from "@playwright/test";

const PORT = 4173;
const LOCAL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  retries: 1,
  fullyParallel: false,
  workers: 1,

  // ✅ defaultne testujeme lokálne
  use: {
    baseURL: process.env.PW_BASE_URL || LOCAL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // ✅ Playwright spustí statický server pred testami
  webServer: {
    command: `npx http-server . -p ${PORT} -c-1`,
    url: LOCAL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  reporter: [["html", { open: "never" }]],

  projects: [
    { name: "smoke", testMatch: /.*\.smoke\.spec\.ts/ },
    { name: "regression", testMatch: /.*\.regression\.spec\.ts/ },
    { name: "e2e", testMatch: /.*\.e2e\.spec\.ts/ },
  ],
});
