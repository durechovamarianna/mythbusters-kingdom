import { test, expect } from "@playwright/test";

/**
 * REGRESSION – Story rules
 * =======================
 *
 * SK:
 * Cieľ: Overiť “business pravidlá” obrazovky Story (výber postáv podľa rozpočtu).
 * Táto stránka simuluje typické produktové správanie: používateľ má budget, vyberá položky,
 * systém mu odpočítava náklady a blokuje akcie, ktoré už nie sú možné.
 *
 * Čo chránime pred regresiou:
 * - Budget sa znižuje presne o cenu (cost) vybratej postavy a “used” sa zvyšuje.
 * - Po výbere sa karta postavy zablokuje (disabled), aby sa nedala vybrať 2x.
 * - Pri nízkom budgete sa drahšie postavy automaticky zablokujú (disabled), aby UX bolo jasné.
 * - Random pick nesmie vybrať už vybranú postavu a musí rešpektovať budget.
 * - Reset obnoví default stav (budget, vybrané položky, enabled/disabled stavy).
 *
 * EN :
 * Goal: Validate the core business rules of the Story page (character picking with a budget).
 * This page models a common product flow: user has a budget, selects items, the system deducts costs,
 * and disables actions that are no longer allowed.
 *
 * What we protect from regressions:
 * - Budget decreases by the exact character cost and “used” increases accordingly.
 * - Once selected, the character card becomes disabled to prevent double-picking.
 * - With low remaining budget, more expensive characters are disabled (clear UX constraints).
 * - Random pick must not select an already-selected character and must respect budget.
 * - Reset restores the initial state (budget, selections, enabled/disabled states).
 */

test.describe("REGRESSION – Story rules", () => {
  test.beforeEach(async ({ page }) => {
    // SK: Každý test začína na čistej stránke (žiadne zdieľané stavy medzi testami).
    // EN: Each test starts from a clean page state (no shared state across tests).
    await page.goto("story.html");

    // SK: “Anchors” – keď tieto prvky neexistujú, stránka nie je správne načítaná a zvyšok testu nemá zmysel.
    // EN: “Anchors” – if these are missing, the page didn’t load correctly, so the rest of the test is not meaningful.
    await expect(page.getByTestId("page-story")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).toBeVisible();
    await expect(page.getByTestId("characters-grid")).toBeVisible();
  });

  test("Budget decreases by exact cost and card becomes disabled after pick", async ({ page }) => {
    // SK: Happy-path kontrola výpočtu budgetu pri jednom výbere.
    // EN: Happy-path check for budget math when selecting a single character.

    // SK: Overíme, že default budget začína na 25 a nič nie je minuté.
    // EN: Confirm default state: remaining 25 and used 0.
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");
    await expect(page.getByTestId("budget-used")).toHaveText("0");

    // SK: “King” musí byť na začiatku dostupný (enabled).
    // EN: “King” should be available initially (enabled).
    const king = page.getByTestId("char-king");
    await expect(king).toBeEnabled();

    // SK: Vyberieme King (očakávame cost 6).
    // EN: Pick King (expected cost 6).
    await king.click();

    // SK: cost 6 => remaining 19, used 6.
    // EN: cost 6 => remaining 19, used 6.
    await expect(page.getByTestId("budget-remaining")).toHaveText("19");
    await expect(page.getByTestId("budget-used")).toHaveText("6");

    // SK: Po výbere sa musí zobraziť “picked tag” – vizuálna stopa výberu.
    // EN: After selecting, a “picked tag” must appear – visible proof of selection.
    await expect(page.getByTestId("picked-king")).toBeVisible();

    // SK: Dôležitá ochrana proti dvojitému výberu: karta sa zablokuje.
    // EN: Prevent double-picking: card becomes disabled.
    await expect(king).toBeDisabled();
  });

  test("Insufficient budget disables expensive cards (example: remaining 3 disables cost>3)", async ({ page }) => {
    // SK: Overíme pravidlo: keď budget nestačí, drahšie postavy musia byť disabled.
    // EN: Verifies rule: when budget is insufficient, more expensive characters must be disabled.

    // SK: Najprv resetujeme (pre istotu) a prejdeme na známy scenár.
    // EN: Reset first (defensive) and drive the UI into a known state.
    await page.getByTestId("btn-reset").click();
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");

    // SK: “Spálime” budget tak, aby ostali len 3:
    // dragon7 (10) + king (6) + queen (6) = 22 -> remaining 3
    // EN: Spend budget down to 3:
    // dragon7 (10) + king (6) + queen (6) = 22 -> remaining 3
    await page.getByTestId("char-dragon7").click();
    await page.getByTestId("char-king").click();
    await page.getByTestId("char-queen").click();

    await expect(page.getByTestId("budget-remaining")).toHaveText("3");

    // SK: Pri remaining 3 musia byť disabled všetky karty s cost > 3.
    // EN: With remaining 3, all cards with cost > 3 must be disabled.
    await expect(page.getByTestId("char-fairy")).toBeDisabled();
    await expect(page.getByTestId("char-knight")).toBeDisabled();

    // SK: A naopak, karta s cost == 3 má zostať enabled, pokiaľ ešte nebola vybraná.
    // EN: Conversely, a cost==3 card should remain enabled if not selected yet.
    const wolf = page.getByTestId("char-wolf");
    await expect(wolf).toBeEnabled();
  });

  test("Random pick never selects already-selected character and respects budget (adds exactly one new pick)", async ({ page }) => {
    // SK: Random je typicky flaky oblasť. Tu overujeme minimálne garantované pravidlá:
    // - nepridá duplikát
    // - pridá presne 1 novú položku (ak existuje kandidát v budgete)
    // EN: Random selection is often a flaky area. We validate minimum guarantees:
    // - no duplicates
    // - adds exactly 1 new pick (if any candidate exists within budget)

    // SK: Najprv vyberieme jednu postavu manuálne (jester, cost 2).
    // EN: First, manually pick one character (jester, cost 2).
    await page.getByTestId("char-jester").click();
    await expect(page.getByTestId("budget-used")).toHaveText("2");
    await expect(page.getByTestId("picked-jester")).toBeVisible();

    // SK: Pred randomom si pozrieme počet vybraných tagov.
    // EN: Before random, capture the count of picked tags.
    const pickedList = page.getByTestId("picked-list");
    const pickedTags = pickedList.locator("[data-testid^='picked-']");
    await expect(pickedTags).toHaveCount(1);

    // SK: Spustíme random pick (má pridať jednu ďalšiu postavu).
    // EN: Trigger random pick (should add one more character).
    await page.getByTestId("btn-random").click();

    // SK: Po random pick očakávame 2 tagy (1 pôvodný + 1 nový).
    // EN: After random pick, expect 2 tags (1 original + 1 new).
    await expect(pickedTags).toHaveCount(2);

    // SK: Jester musí byť len raz (žiadny duplikát).
    // EN: Jester must still exist only once (no duplicates).
    await expect(page.getByTestId("picked-jester")).toHaveCount(1);
  });

  test("Reset restores everything: budget, picked list, enables cards", async ({ page }) => {
    // SK: Reset je kritická “záchranná” akcia v UI – musí vrátiť aplikáciu do defaultu.
    // EN: Reset is a critical recovery action – it must restore the default state.

    // SK: Vytvoríme zmenený stav (vyberieme 2 postavy).
    // EN: Create a changed state (select 2 characters).
    await page.getByTestId("char-king").click();
    await page.getByTestId("char-dragon7").click();

    // SK: Overíme, že sa tagy objavili a budget už nie je default.
    // EN: Verify tags are present and budget is no longer default.
    await expect(page.getByTestId("picked-king")).toBeVisible();
    await expect(page.getByTestId("picked-dragon7")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).not.toHaveText("25");

    // SK: Reset.
    // EN: Reset.
    await page.getByTestId("btn-reset").click();

    // SK: Default budget späť.
    // EN: Default budget restored.
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");
    await expect(page.getByTestId("budget-used")).toHaveText("0");

    // SK: Žiadne vybrané tagy.
    // EN: No picked tags remain.
    await expect(page.getByTestId("picked-list").locator("[data-testid^='picked-']")).toHaveCount(0);

    // SK: Karty sú opäť dostupné (enabled).
    // EN: Cards are available again (enabled).
    await expect(page.getByTestId("char-king")).toBeEnabled();
    await expect(page.getByTestId("char-dragon7")).toBeEnabled();
  });
});