import { test, expect, Page } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * E2E – Story 
 * ==========================================
 *
 * SK:
 * Cieľ: Overiť reálny používateľský tok naprieč stránkami a kľúčové business pravidlá Story:
 * - otvoriť Home stránku a prejsť na Story cez navigáciu
 * - overiť default rozpočet (total/remaining/used) a počítadlo vybraných postáv
 * - vybrať postavy a overiť, že sa rozpočet znížiť presne o cenu (cost)
 * - po výbere sa karta zablokovať (disabled), aby sa nedalo vybrať 2x
 * - spraviť reset a overiť návrat do default stavu (budget, výbery, enabled stavy)
 *
 * Prečo je to dôležité (biz/UX):
 * - Rozpočet je hlavná game mechanika (nesmie sa “rozísť”).
 * - Zákaz dvojitého výberu bráni duplicitným nákladom a nekonzistencii.
 * - Reset musí vedieť “zachrániť” používateľa a vrátiť stránku do čistého stavu.
 *
 * EN:
 * Goal: Validate a real cross-page user journey and the key Story business rules:
 * - open Home and navigate to Story via the top navigation
 * - verify default budget (total/remaining/used) and picked counter
 * - pick characters and verify budget decreases by exact cost
 * - after picking, the card becomes disabled (cannot pick twice)
 * - reset restores defaults (budget, picks, enabled states)
 *
 * Why this matters (biz/UX):
 * - Budget is the core mechanic; numbers must remain consistent.
 * - Preventing double-pick avoids duplicate spending and inconsistent state.
 * - Reset is a safety net to return to a clean baseline.
 */

/** Convenience: get element by data-testid. */
function tid(page: Page, id: string) {
  return page.getByTestId(id);
}

/** Navigate to Home and verify the page anchor. */
async function gotoHome(page: Page) {
  // SK: Otvoriť Home a overiť, že sa načítať korektne.
  // EN: Open Home and verify it loads correctly.
  await page.goto("index.html");
  await expect(tid(page, "page-home")).toBeVisible();
}

/** Navigate to Story via global navigation and verify anchor + active nav. */
async function gotoStoryViaNav(page: Page) {
  // SK: Prejsť na Story cez navigáciu (ako bežný používateľ).
  // EN: Go to Story via navigation (as a real user would).
  await tid(page, "nav-story").click();

  await expect(page).toHaveURL(/story\.html$/);
  await expect(tid(page, "page-story")).toBeVisible();

  // SK: Overiť správne zvýraznenie aktívnej položky navigácie.
  // EN: Verify the correct navigation tab is marked active.
  await expectNavActive(page, "nav-story");
}

/** Verify the initial budget UI baseline. */
async function expectInitialBudget(page: Page) {
  // SK: Overiť default hodnoty – toto je baseline pre všetky ďalšie výpočty.
  // EN: Verify default values – this is the baseline for all calculations.
  await expect(tid(page, "budget-total")).toHaveText("25");
  await expect(tid(page, "budget-remaining")).toHaveText("25");
  await expect(tid(page, "budget-used")).toHaveText("0");
  await expect(tid(page, "characters-count")).toContainText("0");
}

/** Pick a character card and verify expected deltas + picked tag + disabled. */
async function pickAndVerify(params: {
  page: Page;
  charTestId: string;
  pickedTagTestId: string;
  expectedRemaining: string;
  expectedUsed: string;
  expectedCount: string;
  scroll?: boolean;
}) {
  const { page, charTestId, pickedTagTestId, expectedRemaining, expectedUsed, expectedCount, scroll } = params;

  const card = tid(page, charTestId);

  // SK: Overiť, že karta existovať a byť interaktívna pred výberom.
  // EN: Verify the card exists and is interactive before picking.
  await expect(card).toBeVisible();
  await expect(card).toBeEnabled();

  if (scroll) {
    // SK: Zabezpečiť byť v zábere (pomáha stabilite v CI).
    // EN: Ensure the card is in view (helps CI stability).
    await card.scrollIntoViewIfNeeded();
  }

  // SK: Vybrať postavu (zmeniť stav aplikácie ako používateľ).
  // EN: Pick the character (change app state as a user).
  await card.click();

  // SK: Overiť, že sa zobraziť “picked” tag (potvrdenie výberu).
  // EN: Verify the “picked” tag appears (selection confirmation).
  await expect(tid(page, pickedTagTestId)).toBeVisible();

  // SK: Overiť, že sa rozpočet aktualizovať presne.
  // EN: Verify budget updates exactly.
  await expect(tid(page, "budget-remaining")).toHaveText(expectedRemaining);
  await expect(tid(page, "budget-used")).toHaveText(expectedUsed);

  // SK: Overiť, že sa aktualizovať počítadlo vybraných postáv.
  // EN: Verify the picked counter updates.
  await expect(tid(page, "characters-count")).toContainText(expectedCount);

  // SK: Overiť, že sa karta po výbere zablokovať (nedovoliť dvojitý výber).
  // EN: Verify the card becomes disabled after pick (prevents double-pick).
  await expect(card).toBeDisabled();
}

/** Click reset and verify everything returns to baseline state. */
async function resetAndVerifyDefaults(page: Page) {
  // SK: Vykonať reset – vrátiť aplikáciu do “clean slate”.
  // EN: Execute reset – return the app to a clean slate.
  await tid(page, "btn-reset").click();

  // SK: Overiť reset rozpočtu a počítadla.
  // EN: Verify budget and counter reset.
  await expect(tid(page, "budget-remaining")).toHaveText("25");
  await expect(tid(page, "budget-used")).toHaveText("0");
  await expect(tid(page, "characters-count")).toContainText("0");

  // SK: Overiť, že sa odstrániť všetky picked tagy.
  // EN: Verify all picked tags are removed.
  await expect(tid(page, "picked-list").locator("[data-testid^='picked-']")).toHaveCount(0);

  // SK: Overiť, že sa karty znovu povoliť.
  // EN: Verify previously picked cards become enabled again.
  await expect(tid(page, "char-king")).toBeEnabled();
  await expect(tid(page, "char-dragon7")).toBeEnabled();
}

test.describe("E2E – Story user flow", () => {
  test("Home -> Story via nav, pick characters, budget updates, reset restores defaults", async ({ page }) => {
    // SK: Tento test pokrýva kritický “happy path” tok používateľa.
    // EN: This test covers the critical happy-path user journey.

    await test.step("Open Home / Otvoriť Home", async () => {
      await gotoHome(page);
    });

    await test.step("Navigate to Story via nav / Prejsť na Story cez navigáciu", async () => {
      await gotoStoryViaNav(page);
    });

    await test.step("Verify initial budget baseline / Overiť úvodný rozpočet", async () => {
      await expectInitialBudget(page);
    });

    await test.step("Pick King (cost 6) / Vybrať Kráľa (cena 6)", async () => {
      // cost 6 => remaining 19, used 6, count 1
      await pickAndVerify({
        page,
        charTestId: "char-king",
        pickedTagTestId: "picked-king",
        expectedRemaining: "19",
        expectedUsed: "6",
        expectedCount: "1",
      });
    });

    await test.step("Pick Dragon7 (cost 10) / Vybrať Dragon7 (cena 10)", async () => {
      // cost 10 => remaining 9, used 16, count 2
      await pickAndVerify({
        page,
        charTestId: "char-dragon7",
        pickedTagTestId: "picked-dragon7",
        expectedRemaining: "9",
        expectedUsed: "16",
        expectedCount: "2",
        scroll: true,
      });
    });

    await test.step("Reset and verify defaults / Resetovať a overiť default stav", async () => {
      await resetAndVerifyDefaults(page);
    });
  });

  test("Story -> Library via nav, active nav updates correctly", async ({ page }) => {
    // SK: Tento test je rýchly cross-page sanity – overiť navigáciu a active state.
    // EN: This is a quick cross-page sanity check – verify navigation and active state.

    await test.step("Open Story / Otvoriť Story", async () => {
      await page.goto("story.html");
      await expect(tid(page, "page-story")).toBeVisible();
      await expectNavActive(page, "nav-story");
    });

    await test.step("Navigate to Library / Prejsť do Knižnice", async () => {
      await tid(page, "nav-library").click();
      await expect(page).toHaveURL(/library\.html$/);
      await expect(tid(page, "page-library")).toBeVisible();

      // SK: Overiť správne zvýraznenie v navigácii aj po prechode.
      // EN: Verify the active nav state after navigation.
      await expectNavActive(page, "nav-library");
    });
  });
});