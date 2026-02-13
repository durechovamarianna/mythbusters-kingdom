import { test, expect, Page } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * REGRESSION – Dragon rules (Business + UI integrity)
 * ==================================================
 *
 * SK:
 * Tento regression balík overuje hlavné biznis pravidlá "Dragon" stránky.
 * Cieľ je zachytiť chyby, ktoré by:
 * - umožnili prekročiť limit 77 (biznis pravidlo)
 * - rozbili disabled stavy tlačidiel (UI/UX pravidlo)
 * - nezobrazili banner pri limite (užívateľská spätná väzba)
 * - zmenili logiku odoberania (LIFO zásobník)
 * - nevyčistili UI pri resete (stabilita a nezávislosť testov)
 * - rozbili selekciu draka (iba jeden má byť zvýraznený)
 *
 * EN:
 * This regression suite validates the key business rules of the Dragon page.
 * It aims to catch bugs that could:
 * - allow exceeding the 77 limit (business rule)
 * - break disabled states of controls (UI/UX rule)
 * - not show the banner when limit is reached (user feedback)
 * - change removal logic (LIFO stack behavior)
 * - fail to reset the UI to default (test independence + stability)
 * - break selection logic (only one dragon should be highlighted)
 */

// -----------------------------------------------------------------------------
// CI-safe DOM helpers
// -----------------------------------------------------------------------------
// SK: Tieto helpery klikajú priamo cez DOM (evaluate + element.click()).
//     V CI býva problém s "pointer intercept" (prekrývanie prvkov, animácie).
// EN: These helpers click through DOM directly to avoid CI pointer-intercept issues
//     (overlapping elements, animations, flakiness).
// -----------------------------------------------------------------------------

async function domClick(page: Page, testId: string) {
  await page.evaluate((tid: string) => {
    const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLElement | null;
    if (!el) throw new Error(`${tid} not found`);
    el.click();
  }, testId);
}

async function domAddMany(page: Page, n: number) {
  await page.evaluate((count: number) => {
    const btn = document.querySelector('[data-testid="add-dragon"]') as HTMLButtonElement | null;
    if (!btn) throw new Error("add-dragon button not found");

    for (let i = 0; i < count; i++) {
      // SK: Keď je disabled, ďalšie kliky už nemajú nič zmeniť.
      // EN: Once disabled, further clicks should not change anything.
      if (btn.disabled) break;
      btn.click();
    }
  }, n);
}

async function domClickDragonByIndex(page: Page, index: number) {
  await page.evaluate((i: number) => {
    const list = Array.from(document.querySelectorAll('[data-testid="dragon"]')) as HTMLElement[];
    const el = list[i];
    if (!el) throw new Error(`dragon[${i}] not found`);
    el.click();
  }, index);
}

// -----------------------------------------------------------------------------
// Test suite
// -----------------------------------------------------------------------------

test.describe("REGRESSION – Dragon rules", () => {
  test.beforeEach(async ({ page }) => {
    // SK: Otvoríme Dragon stránku pred každým testom, aby boli testy izolované.
    // EN: Open Dragon page before each test to keep tests isolated and independent.
    await page.goto("dragon.html");

    // SK: Overíme, že sme na správnej URL (stabilita v CI).
    // EN: Verify correct URL (stability in CI).
    await expect(page).toHaveURL(/dragon\.html$/);

    // SK: "Page anchor" – stabilný prvok, že stránka je načítaná.
    // EN: Page anchor – stable element confirming the page is loaded.
    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // SK: Overíme aktívnu položku v navigácii (správna stránka).
    // EN: Ensure navigation highlights the correct active tab.
    await expectNavActive(page, "nav-dragon");
  });

  test("Limit is 77: add becomes disabled and banner is shown (CI-safe, no mouse clicks)", async ({ page }) => {
    // SK: Biznis pravidlo: maximálne 77 drakov.
    // EN: Business rule: maximum of 77 dragons.

    const add = page.getByTestId("add-dragon");
    const count = page.getByTestId("dragon-count");
    const banner = page.getByTestId("dragon-banner");
    const dragons = page.getByTestId("dragon");

    // SK: Pridáme presne 77 drakov cez DOM click.
    // EN: Add exactly 77 dragons using DOM clicks.
    await domAddMany(page, 77);

    // SK: Očakávame 77 prvkov + počítadlo 77.
    // EN: Expect 77 dragon elements and counter = 77.
    await expect(dragons).toHaveCount(77);
    await expect(count).toHaveText("77", { timeout: 10_000 });

    // SK: Po dosiahnutí limitu sa "Add" vypne a zobrazí sa banner.
    // EN: After reaching the limit, Add is disabled and banner is displayed.
    await expect(add).toBeDisabled();
    await expect(banner).toBeVisible();
  });

  test("After reaching 77, additional click does not increase count (idempotent behavior)", async ({ page }) => {
    // SK: Negatívny scenár: aj keď sa skúsi pridať viac, nesmie sa prekročiť limit.
    // EN: Negative scenario: even if user tries to add more, limit must not be exceeded.

    const add = page.getByTestId("add-dragon");
    const count = page.getByTestId("dragon-count");
    const dragons = page.getByTestId("dragon");

    // SK: Skúsime pridať viac než limit (80).
    // EN: Attempt to add beyond the limit (80).
    await domAddMany(page, 80);

    // SK: Stále musí byť 77.
    // EN: Must remain at 77.
    await expect(dragons).toHaveCount(77);
    await expect(count).toHaveText("77");
    await expect(add).toBeDisabled();
  });

  test("Remove removes last added element (LIFO) and keeps count consistent (CI-safe)", async ({ page }) => {
    // SK: Overujeme LIFO správanie – posledný pridaný drak musí byť prvý odstránený.
    // EN: Validate LIFO behavior – last added dragon must be removed first.

    const count = page.getByTestId("dragon-count");
    const dragons = page.locator('[data-testid="dragon"]');

    // SK: Pridáme 3 drakov.
    // EN: Add 3 dragons.
    await domAddMany(page, 3);

    await expect(dragons).toHaveCount(3);
    await expect(count).toHaveText("3");

    // SK: Zoberieme ID posledného draka (stabilný identifikátor).
    // EN: Capture the last dragon's ID (stable identifier).
    const last = dragons.last();
    await expect(last).toBeVisible();

    const lastId = await last.getAttribute("data-dragon-id");
    expect(lastId, "Last dragon should have data-dragon-id").toBeTruthy();

    const lastById = page.locator(
      `[data-testid="dragon"][data-dragon-id="${lastId}"]`
    );
    await expect(lastById).toHaveCount(1);

    // SK: Klikneme Remove cez DOM (CI-safe).
    // EN: Click Remove via DOM (CI-safe).
    await domClick(page, "remove-dragon");

    // SK: Po remove má byť count 2 a posledný drak (podľa ID) musí zmiznúť.
    // EN: After remove, count must be 2 and the captured last dragon must disappear.
    await expect(dragons).toHaveCount(2);
    await expect(count).toHaveText("2");
    await expect(lastById).toHaveCount(0);
  });

  test("Reset clears all dragons, sets count to 0 and disables remove/reset", async ({ page }) => {
    // SK: Reset je "návrat do defaultu" – kritické pre UX aj pre nezávislosť testov.
    // EN: Reset should restore default state – critical for UX and test independence.

    const reset = page.getByTestId("reset-dragon");
    const remove = page.getByTestId("remove-dragon");
    const count = page.getByTestId("dragon-count");
    const dragons = page.getByTestId("dragon");

    await domAddMany(page, 5);

    await expect(dragons).toHaveCount(5);
    await expect(count).toHaveText("5");

    // SK: Reset cez DOM click (CI-safe).
    // EN: Reset via DOM click (CI-safe).
    await domClick(page, "reset-dragon");

    // SK: Všetko musí byť vymazané a tlačidlá opäť disabled.
    // EN: Everything should be cleared and controls disabled again.
    await expect(dragons).toHaveCount(0);
    await expect(count).toHaveText("0");
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();
  });

  test("Clicking a dragon highlights it (is-selected) and only one is selected (CI-safe)", async ({ page }) => {
    // SK: UX pravidlo: vybraný môže byť len jeden drak naraz.
    // EN: UX rule: only one dragon can be selected at a time.

    await domAddMany(page, 3);

    const dragons = page.locator('[data-testid="dragon"]');
    await expect(dragons).toHaveCount(3);

    // SK: Kliky cez DOM, lebo draci sa môžu prekrývať.
    // EN: DOM clicks because dragons can overlap visually.
    await domClickDragonByIndex(page, 0);
    await expect(dragons.nth(0)).toHaveClass(/is-selected/);

    await domClickDragonByIndex(page, 1);
    await expect(dragons.nth(1)).toHaveClass(/is-selected/);
    await expect(dragons.nth(0)).not.toHaveClass(/is-selected/);

    // SK: Nakoniec musí existovať presne 1 vybraný drak.
    // EN: Finally, there must be exactly 1 selected dragon.
    await expect(page.locator('[data-testid="dragon"].is-selected')).toHaveCount(1);
  });
});
