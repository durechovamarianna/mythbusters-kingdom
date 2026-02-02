import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * E2E TESTS – Library (Spelleology cloud)
 * ======================================
 *
 * SK: E2E testy simulujú reálny user-flow naprieč stránkami.
 * EN: E2E tests simulate real user flow across pages.
 */

test.describe("E2E – Library user flow", () => {
  test("User navigates to Library, searches from 3 chars, selects spell, clears search", async ({ page }) => {
    // SK/EN: Start on home page.
    await page.goto("index.html");
    await expect(page.getByTestId("page-home")).toBeVisible();
    await expect(page.getByTestId("page-title")).toBeVisible();
    await expectNavActive(page, "nav-home");

    // SK/EN: Navigate to Library via nav card.
    await page.getByTestId("nav-library").click();
    await expect(page).toHaveURL(/library\.html$/);
    await expect(page.getByTestId("page-library")).toBeVisible();

    // SK/EN: Active nav item highlighted.
    await expectNavActive(page, "nav-library");

    // SK/EN: Page title should exist (avoid brittle exact text).
    await expect(page.getByTestId("page-title")).toBeVisible();

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");

    // SK: 2 znaky → filter ešte nebeží, hint viditeľný.
    // EN: 2 chars → filter not active, hint visible.
    await search.fill("lu");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();

    // SK: 3 znaky → filter aktívny (hint zmizne).
    // EN: 3 chars → filter active (hint hides).
    await search.fill("lum");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    // SK/EN: Results should exist (at least 1).
    const results = page.getByTestId("spell-str");
    const first = results.first();
    await expect(first).toBeVisible();

    // SK/EN: Select first result and assert highlight.
    await first.click();
    await expect(first).toHaveClass(/is-selected/);

    // SK/EN: Clear search → back to default.
    await search.fill("");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();

    // SK/EN: Cloud still present with items.
    await expect(page.getByTestId("spell-cloud")).toBeVisible();
    await expect(page.getByTestId("spell-str").first()).toBeVisible();
  });

  test("Theme toggle does not break Library UI (smoke-like E2E check)", async ({ page }) => {
    await page.goto("library.html");
    await expect(page.getByTestId("page-library")).toBeVisible();
    await expectNavActive(page, "nav-library");

    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();

    await toggle.click();

    // SK/EN: After switching, page should still work.
    await expect(page.getByTestId("search")).toBeVisible();
    await expect(page.getByTestId("spell-cloud")).toBeVisible();
  });
});
