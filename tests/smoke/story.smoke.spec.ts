import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE – Story
 * =============
 *
 * SK:
 * Tento smoke test overuje základnú funkčnosť stránky „Príbeh“.
 * Cieľom je rýchlo zachytiť kritické chyby (page crash, chýbajúce sekcie,
 * nefunkčný výber postavy, nesprávny výpočet rozpočtu).
 *
 * EN:
 * This smoke test verifies the core functionality of the “Story” page.
 * The goal is to quickly detect critical issues (page crash, missing sections,
 * broken character selection, incorrect budget calculation).
 */

test.describe("SMOKE – Story", () => {

  test("Story loads and core elements are visible", async ({ page }) => {
    /**
     * SK:
     * Účel testu:
     * - Overiť, že stránka sa korektne načíta.
     * - Overiť, že hlavné funkčné bloky existujú.
     * - Overiť, že navigácia je správne označená ako aktívna.
     *
     * Tento test chráni pred regresiou typu:
     * - chýbajúci DOM element
     * - zlá konfigurácia routingu
     * - zlyhanie inicializácie JavaScriptu
     *
     * EN:
     * Purpose:
     * - Verify that the page loads successfully.
     * - Verify that all key functional blocks are present.
     * - Verify that navigation highlights the correct active page.
     *
     * This protects against regressions such as:
     * - missing DOM elements
     * - broken routing
     * - failed JS initialization
     */

    await page.goto("story.html");

    // SK: Hlavná kotva stránky – ak nie je viditeľná, stránka sa nenačítala správne.
    // EN: Page anchor – if not visible, the page did not load correctly.
    await expect(page.getByTestId("page-story")).toBeVisible();

    // SK: Navigácia musí byť dostupná.
    // EN: Navigation container must be visible.
    await expect(page.getByTestId("nav")).toBeVisible();

    // SK: Overenie, že položka „Story“ je aktívna (UX konzistentnosť).
    // EN: Verify that “Story” nav item is active (UX consistency).
    await expectNavActive(page, "nav-story");

    // SK: Rozpočtová karta musí existovať (kľúčová biznis funkcionalita).
    // EN: Budget card must be present (core business functionality).
    await expect(page.getByTestId("budget-card")).toBeVisible();

    // SK: Zostatok rozpočtu je základný údaj pre logiku výberu.
    // EN: Remaining budget is essential for selection logic.
    await expect(page.getByTestId("budget-remaining")).toBeVisible();

    // SK: Panel postáv a mriežka postáv musia byť vykreslené.
    // EN: Characters panel and grid must be rendered.
    await expect(page.getByTestId("characters-panel")).toBeVisible();
    await expect(page.getByTestId("characters-grid")).toBeVisible();

    // SK: Minimálne jedna postava musí existovať (sanity check dát).
    // EN: At least one character must exist (data sanity check).
    await expect(page.getByTestId("char-king")).toBeVisible();
  });


  test("Basic pick works: selecting one character decreases budget", async ({ page }) => {
    /**
     * SK:
     * Účel testu:
     * Overiť základný biznis scenár:
     * - Používateľ vyberie postavu.
     * - Rozpočet sa správne zníži.
     * - Vybraná postava sa zobrazí v sekcii vybraných.
     *
     * Tento test chráni najdôležitejšiu funkcionalitu stránky:
     * správny výpočet rozpočtu a správnu manipuláciu so stavom.
     *
     * EN:
     * Purpose:
     * Verify the core business scenario:
     * - User selects a character.
     * - Budget decreases correctly.
     * - Selected character appears in the picked section.
     *
     * This protects the most critical functionality:
     * correct budget calculation and state management.
     */

    await page.goto("story.html");

    // SK: Overenie počiatočného rozpočtu – baseline pre výpočty.
    // EN: Verify initial budget – baseline for calculations.
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");

    // SK: Vyberieme postavu „Jester“, ktorá má cenu 2.
    // EN: Select “Jester” character, cost = 2.
    await page.getByTestId("char-jester").click();

    // SK: Rozpočet sa musí znížiť presne o cenu postavy (25 → 23).
    // EN: Budget must decrease exactly by character cost (25 → 23).
    await expect(page.getByTestId("budget-remaining")).toHaveText("23");

    // SK: Vybraná postava musí byť vizuálne potvrdená v sekcii vybraných.
    // EN: Picked character must appear in the selected section.
    await expect(page.getByTestId("picked-jester")).toBeVisible();
  });

});

