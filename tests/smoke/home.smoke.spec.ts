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

  /**
   * Test: Home loads and displays hero section correctly
   * ----------------------------------------------------
   *
   * SK:
   * Overuje, že:
   * - stránka index.html sa načíta
   * - title stránky obsahuje text „Vitajte“
   * - hero sekcia je viditeľná
   * - hlavný nadpis má očakávaný text
   * - navigácia a footer sú zobrazené
   * - položka „Domov“ je aktívna v navigácii
   *
   * EN:
   * Verifies that:
   * - index.html page loads
   * - page title contains “Vitajte”
   * - hero section is visible
   * - main hero title has expected text
   * - navigation and footer are visible
   * - “Home” navigation item is marked as active
   */
  test("Home loads and has hero title", async ({ page }) => {
    // Open Home page
    await page.goto("index.html");

    // Assert page <title>
    await expect(page).toHaveTitle(/Vitajte/);

    // Assert hero section visibility
    await expect(page.getByTestId("page-home")).toBeVisible();

    // Assert main hero title text
    await expect(page.getByTestId("page-title"))
      .toHaveText(/Vitajte, začnite testovať/i);

    // Assert navigation bar is visible
    await expect(page.getByTestId("nav")).toBeVisible();

    // Assert correct nav item is active (helper function)
    await expectNavActive(page, "nav-home");

    // Assert footer is visible
    await expect(page.getByTestId("footer")).toBeVisible();
  });

  /**
   * Test: Home CTA navigates to Dragon page
   * --------------------------------------
   *
   * SK:
   * Overuje, že:
   * - CTA tlačidlo „Začať na drakovi“ funguje
   * - klik presmeruje používateľa na dragon.html
   * - Dragon stránka sa úspešne načíta
   *
   * EN:
   * Verifies that:
   * - “Start with Dragon” CTA button works
   * - clicking the CTA navigates to dragon.html
   * - Dragon page loads successfully
   */
  test("Home CTA -> Dragon works", async ({ page }) => {
    // Open Home page
    await page.goto("index.html");

    // Click primary CTA button
    await page.getByTestId("cta-start").click();

    // Assert URL navigation
    await expect(page).toHaveURL(/dragon\.html$/);

    // Assert Dragon page is visible
    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // Assert Dragon page title
    await expect(page.getByTestId("page-title"))
      .toContainText("Draci");
  });

});

