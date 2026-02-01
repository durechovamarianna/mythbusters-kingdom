import { test, expect } from "@playwright/test";

/**
 * SMOKE TESTS
 * ===========
 * 
 * Smoke testy overujú základnú funkčnosť aplikácie:
 * - či sa aplikácia načíta
 * - či funguje hlavná navigácia
 * - či kľúčové interakcie nepadnú hneď na začiatku
 *
 * Smoke tests verify basic application health:
 * - application loads
 * - main navigation works
 * - core functionality is not broken
 */

/**
 * Test: Home page loads correctly
 * --------------------------------
 * SK:
 * Overuje, že:
 * - úvodná stránka sa načíta
 * - hlavný titulok obsahuje text „Vitajte“
 *
 * EN:
 * Verifies that:
 * - home page loads successfully
 * - main page title contains “Vitajte”
 */
test("Home loads", async ({ page }) => {
  await page.goto("index.html");

  // Assertion: hlavný nadpis je zobrazený a má správny text
  // Assertion: main hero title is visible and contains expected text
  await expect(page.getByTestId("page-title")).toContainText("Vitajte");
});

/**
 * Test: Main navigation works across core pages
 * ----------------------------------------------
 * SK:
 * Overuje hlavný používateľský flow:
 * - Domov → Drak → Kúzla → Knižnica
 * - po každom kliknutí sa zmení stránka
 * - správny titulok potvrdzuje, že stránka je načítaná
 *
 * EN:
 * Verifies main user navigation flow:
 * - Home → Dragon → Spells → Library
 * - each navigation card opens the correct page
 * - page title confirms successful navigation
 */
test("Navigation works: Home -> Dragon -> Spells -> Library", async ({ page }) => {
  await page.goto("index.html");

  // Navigate to Dragon page
  await page.getByTestId("nav-dragon").click();
  await expect(page.getByTestId("page-title")).toContainText("Drak");

  // Navigate to Spells page
  await page.getByTestId("nav-spells").click();
  await expect(page.getByTestId("page-title")).toContainText("Kalkulačka");

  // Navigate to Library page
  await page.getByTestId("nav-library").click();
  await expect(page.getByTestId("page-title")).toContainText("Spelleology");
});

/**
 * Test: Dragon page – basic add / remove / reset functionality
 * ------------------------------------------------------------
 * SK:
 * Overuje základné správanie drakov:
 * - po načítaní je počet drakov 0
 * - pridanie draka zvýši počítadlo a DOM
 * - odstránenie draka zníži počítadlo a DOM
 * - reset vymaže všetkých drakov
 *
 * EN:
 * Verifies core Dragon page functionality:
 * - initial dragon count is 0
 * - adding a dragon increases counter and DOM elements
 * - removing a dragon decreases counter and DOM elements
 * - reset clears all dragons
 */
test("Dragon add/remove/reset basic", async ({ page }) => {
  await page.goto("dragon.html");

  // Stable locators (best practice)
  const add = page.getByTestId("add-dragon");
  const remove = page.getByTestId("remove-dragon");
  const reset = page.getByTestId("reset-dragon");
  const count = page.getByTestId("dragon-count");

  // Initial state: no dragons
  await expect(count).toHaveText("0");

  // Add one dragon
  await add.click();
  await expect(count).toHaveText("1");
  await expect(page.getByTestId("dragon")).toHaveCount(1);

  // Remove the dragon
  await remove.click();
  await expect(count).toHaveText("0");
  await expect(page.getByTestId("dragon")).toHaveCount(0);

  // Add two dragons
  await add.click();
  await add.click();
  await expect(count).toHaveText("2");

  // Reset all dragons
  await reset.click();
  await expect(count).toHaveText("0");
});
