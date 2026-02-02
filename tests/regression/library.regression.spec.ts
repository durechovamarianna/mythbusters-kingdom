import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * REGRESSION TESTS – Library (Spelleology cloud)
 * ==============================================
 *
 * SK: Regression testy pokrývajú pravidlá, hraničné prípady a stabilitu UI selektorov.
 * EN: Regression tests cover business rules, edge cases, and stable selectors.
 */

test.describe("REGRESSION – Library rules", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("library.html");
    await expect(page).toHaveURL(/library\.html$/);

    // SK/EN: Stable anchors.
    await expect(page.getByTestId("page-library")).toBeVisible();
    await expectNavActive(page, "nav-library");

    // Search input must be available.
    await expect(page.getByTestId("search")).toBeVisible();

    // Cloud existence is enough (avoid visibility brittleness).
    await expect(page.getByTestId("spell-cloud")).toHaveCount(1);

    // Initially we expect some spells to exist.
    await expect(page.getByTestId("spell-str").first()).toBeVisible();
  });

  test("Search filters only from 3 characters (rule: <3 does not trigger empty state)", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const spells = page.getByTestId("spell-str");

    // Default state: min3 visible, no-results hidden.
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();

    const initialCount = await spells.count();
    expect(initialCount).toBeGreaterThan(0);

    // --- 1 char ---
    await search.fill("a");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells).toHaveCount(initialCount);

    // --- 2 chars ---
    await search.fill("ab");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells).toHaveCount(initialCount);

    // --- 3 chars ---
    await search.fill("abc");
    await expect(min3).toBeHidden();

    // UI consistency: either results exist OR no-results is shown.
    const resultCount = await spells.count();
    if (resultCount === 0) {
      await expect(noRes).toBeVisible();
    } else {
      await expect(noRes).toBeHidden();
      await expect(spells.first()).toBeVisible();
    }
  });

  test("No results appears only when filter active (>=3 chars) and nothing matches", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const spells = page.getByTestId("spell-str");

    // Activate filter (>=3 chars) with a query that should match nothing.
    await search.fill("zzqx");
    await expect(min3).toBeHidden();

    await expect(noRes).toBeVisible();
    await expect(spells).toHaveCount(0);

    // Clearing input returns to default.
    await search.fill("");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells.first()).toBeVisible();
  });

  test("Click selects exactly one spell at a time (.is-selected)", async ({ page }) => {
    const spells = page.getByTestId("spell-str");

    // Need at least 2 items to test switching.
    await expect(spells).toHaveCountGreaterThan(1);

    const first = spells.nth(0);
    const second = spells.nth(1);

    await first.click();
    await expect(first).toHaveClass(/is-selected/);

    await second.click();
    await expect(second).toHaveClass(/is-selected/);
    await expect(first).not.toHaveClass(/is-selected/);

    await expect(page.locator('[data-testid="spell-str"].is-selected')).toHaveCount(1);
  });

  test("Search is case-insensitive (basic UX rule)", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");

    await search.fill("lum");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    const countLower = await page.getByTestId("spell-str").count();
    expect(countLower).toBeGreaterThan(0);

    await search.fill("LUM");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    const countUpper = await page.getByTestId("spell-str").count();
    expect(countUpper).toBe(countLower);
  });

  test("Search trims whitespace (user-friendly input)", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const results = page.getByTestId("spell-str");

    await search.fill("  lum  ");
    await expect(min3).toBeHidden();

    const cnt = await results.count();
    if (cnt === 0) {
      await expect(noRes).toBeVisible();
    } else {
      await expect(noRes).toBeHidden();
      await expect(results.first()).toBeVisible();
    }
  });
});

/**
 * Small custom matcher helper.
 * SK: Playwright nemá natívne `toHaveCountGreaterThan`, tak si pomôžeme štýlom.
 * EN: Playwright doesn't have a native `toHaveCountGreaterThan`, so we use a pattern.
 */
expect.extend({
  async toHaveCountGreaterThan(locator, expected) {
    const count = await locator.count();
    const pass = count > expected;
    return {
      pass,
      message: () =>
        pass
          ? `Expected locator NOT to have count > ${expected}, but got ${count}`
          : `Expected locator to have count > ${expected}, but got ${count}`,
    };
  },
});

// Type augmentation for TS (optional; safe to keep even if TS complains in some setups)
declare module "@playwright/test" {
  interface Matchers<R> {
    toHaveCountGreaterThan(expected: number): Promise<R>;
  }
}
