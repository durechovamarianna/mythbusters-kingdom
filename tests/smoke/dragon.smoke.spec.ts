import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE TESTS – DRAGON PAGE
 * ========================
 *
 * SK:
 * Smoke testy pre Dragon stránku overujú:
 * - že sa stránka načíta
 * - že počiatočný stav je správny (0 drakov)
 * - že základné akcie add / remove / reset fungujú
 * - že aktívna navigácia (nav-dragon) je zvýraznená
 *
 * EN:
 * Smoke tests for the Dragon page verify:
 * - page loads successfully
 * - initial state is correct (0 dragons)
 * - basic add / remove / reset actions work
 * - active navigation (nav-dragon) is highlighted
 */

test.describe("SMOKE - Dragon", () => {
  test("Dragon page loads and add/remove/reset works (basic)", async ({ page }) => {
    await page.goto("dragon.html");
    await expect(page).toHaveURL(/dragon\.html$/);

    // Page anchor
    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // Nav active
    await expectNavActive(page, "nav-dragon");

    // Stable locators
    const add = page.getByTestId("add-dragon");
    const remove = page.getByTestId("remove-dragon");
    const reset = page.getByTestId("reset-dragon");
    const count = page.getByTestId("dragon-count");
    const dragons = page.getByTestId("dragon");

    // Ensure controls are in view (helps CI)
    await add.scrollIntoViewIfNeeded();

    // Initial state
    await expect(count).toHaveText("0");
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();
    await expect(dragons).toHaveCount(0);

    // Add one dragon
    await add.click();
    await expect(count).toHaveText("1");
    await expect(dragons).toHaveCount(1);

    // Remove the dragon
    await remove.click();
    await expect(count).toHaveText("0");
    await expect(dragons).toHaveCount(0);

    // Add two dragons
    await add.click();
    await add.click();
    await expect(count).toHaveText("2");
    await expect(dragons).toHaveCount(2);

    // Reset all dragons
    await reset.click();
    await expect(count).toHaveText("0");
    await expect(dragons).toHaveCount(0);

    // After reset, buttons should be disabled again
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();
  });
});
