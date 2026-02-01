import { test, expect } from "@playwright/test";

/**
 * SMOKE TESTS – DRAGON PAGE
 * ========================
 *
 * SK:
 * Smoke testy pre Dragon stránku overujú:
 * - že sa stránka načíta
 * - že počiatočný stav je správny (0 drakov)
 * - že základné akcie add / remove / reset fungujú
 *
 * EN:
 * Smoke tests for the Dragon page verify:
 * - page loads successfully
 * - initial state is correct (0 dragons)
 * - basic add / remove / reset actions work
 */

test.describe("SMOKE - Dragon", () => {

  /**
   * Test: Dragon page basic functionality
   * -------------------------------------
   *
   * SK:
   * Overuje základný happy-path:
   * - po načítaní stránky je počet drakov 0
   * - tlačidlá Remove a Reset sú zakázané
   * - pridanie draka zvýši počítadlo a DOM
   * - odstránenie draka zníži počítadlo a DOM
   * - reset odstráni všetkých drakov
   *
   * EN:
   * Verifies basic happy-path:
   * - initial dragon count is 0
   * - Remove and Reset buttons are disabled
   * - adding a dragon increases counter and DOM elements
   * - removing a dragon decreases counter and DOM elements
   * - reset clears all dragons
   */
  test("Dragon page loads and add/remove/reset works (basic)", async ({ page }) => {
    // Open Dragon page
    await page.goto("dragon.html");

    // Stable locators (best practice)
    const add = page.getByTestId("add-dragon");
    const remove = page.getByTestId("remove-dragon");
    const reset = page.getByTestId("reset-dragon");
    const count = page.getByTestId("dragon-count");

    // Initial state assertions
    await expect(count).toHaveText("0");
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();

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
    await expect(page.getByTestId("dragon")).toHaveCount(0);
  });

});

