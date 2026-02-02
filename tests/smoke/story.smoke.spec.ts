import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE – Story
 * =============
 * SK: Rýchly sanity test: stránka sa načíta a základné prvky existujú.
 * EN: Fast sanity checks: page loads and core selectors exist.
 */

test.describe("SMOKE – Story", () => {
  test("Story loads and core elements are visible", async ({ page }) => {
    await page.goto("story.html");

    await expect(page.getByTestId("page-story")).toBeVisible();
    await expect(page.getByTestId("nav")).toBeVisible();
    await expectNavActive(page, "nav-story");

    await expect(page.getByTestId("budget-card")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).toBeVisible();
    await expect(page.getByTestId("characters-panel")).toBeVisible();
    await expect(page.getByTestId("characters-grid")).toBeVisible();

    // At least one character exists
    await expect(page.getByTestId("char-king")).toBeVisible();
  });

  test("Basic pick works: selecting one character decreases budget", async ({ page }) => {
    await page.goto("story.html");

    await expect(page.getByTestId("budget-remaining")).toHaveText("25");

    await page.getByTestId("char-jester").click(); // cost 2
    await expect(page.getByTestId("budget-remaining")).toHaveText("23");
    await expect(page.getByTestId("picked-jester")).toBeVisible();
  });
});
