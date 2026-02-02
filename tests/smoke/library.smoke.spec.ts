import { test, expect } from "@playwright/test";

/**
 * SMOKE – Library
 * ===============
 * SK: Rýchle sanity testy: stránka sa načíta a základné selektory existujú.
 * EN: Fast sanity checks: page loads and core selectors exist.
 */

test.describe("SMOKE – Library", () => {
  test("Library loads and core elements are visible", async ({ page }) => {
    await page.goto("library.html");

    await expect(page.getByTestId("page-library")).toBeVisible();
    await expect(page.getByTestId("page-title")).toContainText("Knihovník");
    await expect(page.getByTestId("search")).toBeVisible();
    await expect(page.getByTestId("spell-cloud")).toBeVisible();
  });

  test("Typing <3 chars does not show empty state", async ({ page }) => {
    await page.goto("library.html");

    const search = page.getByTestId("search");
    await search.fill("ab");

    await expect(page.getByTestId("min3-hint")).toBeVisible();
    await expect(page.getByTestId("no-results")).toBeHidden();
  });
});
