import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  retries: 1,

  use: {
    baseURL: "https://durechovamarianna.github.io/mythbusters-kingdom/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  reporter: [["html", { open: "never" }]],
});