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
    // SK: Začíname na domovskej stránke.
    // EN: Start on home page.
    await page.goto("index.html");
    await expect(page.getByTestId("page-title")).toBeVisible();

    // SK: Navigácia do knižnice.
    // EN: Navigate to library.
    await page.getByTestId("nav-library").click();
    await expect(page.getByTestId("page-library")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Knihovník");

    // SK/EN: Active nav item is highlighted.
    await expectNavActive(page, "nav-library");

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

    // SK: Výsledky musia existovať (aspoň 1).
    // EN: Results should exist (at least 1).
    const results = page.getByTestId("spell-str");
    await expect(results.first()).toBeVisible();

    // SK: Vyberiem prvý výsledok a overím highlight.
    // EN: Select first result and assert highlight.
    await results.first().click();
    await expect(results.first()).toHaveClass(/is-selected/);

    // SK: Vyčistím vyhľadávanie → späť default.
    // EN: Clear search → back to default.
    await search.fill("");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();

    // SK: Stále existuje cloud s položkami.
    // EN: Cloud still present with items.
    await expect(page.getByTestId("spell-cloud")).toBeVisible();
    await expect(page.getByTestId("spell-str").first()).toBeVisible();
  });

  test("Theme toggle does not break Library UI (smoke-like E2E check)", async ({ page }) => {
    await page.goto("library.html");

    // SK: Toggle témy je často zdroj flaky vizuálnych bugov (kontrast, hidden prvky).
    // EN: Theme toggle often causes flaky visual issues (contrast/hidden elements).
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();

    await toggle.click();

    // SK: Po prepnutí musí stránka stále fungovať.
    // EN: After switching, page should still work.
    await expect(page.getByTestId("search")).toBeVisible();
    await expect(page.getByTestId("spell-cloud")).toBeVisible();
  });
});
