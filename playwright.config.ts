import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  retries: 1,
  fullyParallel: false,
  workers: 1,

  use: {
    baseURL: "https://durechovamarianna.github.io/mythbusters-kingdom/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  reporter: [["html", { open: "never" }]],

  projects: [
    {
      name: "smoke",
      testMatch: /.*\.smoke\.spec\.ts/,
    },
    {
      name: "regression",
      testMatch: /.*\.regression\.spec\.ts/,
    },
    {
      name: "e2e",
      testMatch: /.*\.e2e\.spec\.ts/,
    },
  ],
});
