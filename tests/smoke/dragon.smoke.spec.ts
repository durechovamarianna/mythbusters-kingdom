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
    // SK: Otvoríme stránku draka.
    // EN: Navigate to dragon page.
    await page.goto("dragon.html");

    // SK: Overíme, že URL je správna (základná navigačná kontrola).
    // EN: Verify correct URL.
    await expect(page).toHaveURL(/dragon\.html$/);

    // Page anchor
    // SK: Skontrolujeme, že hlavná kotva stránky je viditeľná (stránka sa načítala).
    // EN: Page anchor must be visible (page successfully loaded).
    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // Nav active
    // SK: Navigačná karta "Drak" musí byť označená ako aktívna.
    // EN: Dragon nav card must be marked as active.
    await expectNavActive(page, "nav-dragon");

    // Stable locators
    // SK: Používame stabilné data-testid selektory (best practice).
    // EN: Use stable data-testid locators (best practice).
    const add = page.getByTestId("add-dragon");
    const remove = page.getByTestId("remove-dragon");
    const reset = page.getByTestId("reset-dragon");
    const count = page.getByTestId("dragon-count");
    const dragons = page.getByTestId("dragon");

    // Ensure controls are in view (helps CI)
    // SK: Scroll pre istotu – zvyšuje stabilitu testu v CI/headless režime.
    // EN: Scroll to ensure visibility in CI/headless.
    await add.scrollIntoViewIfNeeded();

    // Initial state
    // SK: Overíme počiatočný stav aplikácie.
    // EN: Verify initial application state.
    await expect(count).toHaveText("0");
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();
    await expect(dragons).toHaveCount(0);

    // Add one dragon
    // SK: Pridáme jedného draka a očakávame inkrementáciu počtu.
    // EN: Add one dragon and expect count increment.
    await add.click();
    await expect(count).toHaveText("1");
    await expect(dragons).toHaveCount(1);

    // Remove the dragon
    // SK: Odstránime posledného draka a overíme dekrementáciu.
    // EN: Remove the dragon and verify decrement.
    await remove.click();
    await expect(count).toHaveText("0");
    await expect(dragons).toHaveCount(0);

    // Add two dragons
    // SK: Pridáme dvoch drakov po sebe – testujeme správne navyšovanie.
    // EN: Add two dragons sequentially.
    await add.click();
    await add.click();
    await expect(count).toHaveText("2");
    await expect(dragons).toHaveCount(2);

    // Reset all dragons
    // SK: Reset musí odstrániť všetkých drakov a vrátiť stav na 0.
    // EN: Reset must remove all dragons and reset state.
    await reset.click();
    await expect(count).toHaveText("0");
    await expect(dragons).toHaveCount(0);

    // After reset, buttons should be disabled again
    // SK: Po resete majú byť remove a reset opäť zakázané (ako v initial state).
    // EN: After reset, remove and reset should be disabled again.
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();
  });
});

