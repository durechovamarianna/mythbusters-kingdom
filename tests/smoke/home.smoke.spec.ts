import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE TESTS – HOME PAGE
 * ======================
 *
 * SK:
 * Smoke testy pre Home stránku overujú:
 * - že sa stránka korektne načíta
 * - že základné UI prvky sú viditeľné
 * - že navigácia a CTA fungujú
 *
 * EN:
 * Smoke tests for the Home page verify:
 * - page loads successfully
 * - core UI elements are visible
 * - navigation and CTA links work correctly
 */

test.describe("SMOKE - Home", () => {
  test("Home loads and has hero title", async ({ page }) => {
    await page.goto("index.html");
    await expect(page).toHaveURL(/index\.html$/);

    // Assert page <title>
    await expect(page).toHaveTitle(/Vitajte/i);

    // Assert hero section visibility
    await expect(page.getByTestId("page-home")).toBeVisible();

    // Assert main hero title text
    await expect(page.getByTestId("page-title")).toHaveText(/Vitajte, začnite testovať/i);

    // Assert navigation bar is visible
    await expect(page.getByTestId("nav")).toBeVisible();

    // Assert correct nav item is active
    await expectNavActive(page, "nav-home");

    // Assert footer is visible
    await expect(page.getByTestId("footer")).toBeVisible();
  });

  test("Home CTA -> Dragon works", async ({ page }) => {
    await page.goto("index.html");
    await expect(page).toHaveURL(/index\.html$/);

    // CHANGED: cta-start -> cta-dragon (after cleanup to 4 pages)
    await page.getByTestId("cta-dragon").click();

    await expect(page).toHaveURL(/dragon\.html$/);

    await expect(page.getByTestId("page-dragon")).toBeVisible();
    await expectNavActive(page, "nav-dragon");

    // Less brittle than exact "Draci"
    await expect(page.getByTestId("page-title")).toHaveText(/drak/i);
  });
});
