import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE – Library
 * ===============
 * SK: Rýchle sanity testy: stránka sa načíta a základné selektory existujú.
 * EN: Fast sanity checks: page loads and core selectors exist.
 */

test.describe("SMOKE – Library", () => {
  test("Library loads and core elements are present", async ({ page }) => {
    await page.goto("library.html");
    await expect(page).toHaveURL(/library\.html$/);

    // Page anchor
    await expect(page.getByTestId("page-library")).toBeVisible();

    // Active nav
    await expectNavActive(page, "nav-library");

    // Title exists (avoid brittle exact text like 'Knihovník')
    await expect(page.getByTestId("page-title")).toBeVisible();

    // Core UI
    await expect(page.getByTestId("search")).toBeVisible();

    // Cloud existence is enough for smoke
    await expect(page.getByTestId("spell-cloud")).toHaveCount(1);
    await expect(page.getByTestId("spell-str").first()).toBeVisible();
  });

  test("Typing <3 chars does not show empty state", async ({ page }) => {
    await page.goto("library.html");
    await expect(page.getByTestId("page-library")).toBeVisible();

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");

    await search.fill("ab");

    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
  });
});
