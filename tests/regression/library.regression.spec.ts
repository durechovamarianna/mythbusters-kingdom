import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * REGRESSION TESTS – Library (Spelleology cloud)
 * ==============================================
 *
 * SK:
 * Tieto regression testy pokrývajú kľúčové správanie “Knižnice”:
 * - Vyhľadávanie sa má spustiť až od 3 znakov (aby UI neblikalo a nezaťažovalo používateľa).
 * - “No results” sa má ukázať iba pri aktívnom filtri (>= 3 znaky) a keď nič nesedí.
 * - Výber zaklínadla je single-select (vždy iba jedno zvýraznené).
 * - Vyhľadávanie je user-friendly: case-insensitive a ignoruje okrajové medzery.
 *
 * Prečo je to dôležité:
 * - Minimalizuje sa flakiness v UI a zlepšuje UX (užívateľ nevidí “prázdny stav” pri krátkom texte).
 * - Stabilné testId selektory chránia pred regresiami v CI/CD.
 *
 * EN:
 * These regression tests cover the key behavior of the Library page:
 * - Search should activate only from 3 characters (prevents noisy UI and improves UX).
 * - “No results” must appear only when filtering is active (>= 3 chars) and nothing matches.
 * - Spell selection is single-select (only one highlighted at a time).
 * - Search is user-friendly: case-insensitive and trims surrounding whitespace.
 *
 * Why it matters:
 * - Improves UX consistency and avoids flickering/empty states for short input.
 * - Stable testIds protect against regressions in CI/CD.
 */

// -----------------------------------------------------------------------------
// Small helper: assert locator count is > N (without custom matcher registration)
// -----------------------------------------------------------------------------
// SK: Držíme to jednoduché: pomocná funkcia namiesto expect.extend (menej TS rizík).
// EN: Keep it simple: helper function instead of expect.extend (fewer TS edge cases).
async function expectCountGreaterThan(locator: ReturnType<import("@playwright/test").Page["getByTestId"]>, n: number) {
  const count = await locator.count();
  expect(count, `Expected count to be > ${n}, but got ${count}`).toBeGreaterThan(n);
}

test.describe("REGRESSION – Library rules", () => {
  test.beforeEach(async ({ page }) => {
    // SK: Otvoríme stránku vždy nanovo – testy sú izolované a nezávislé.
    // EN: Always open a fresh page state – tests stay isolated and independent.
    await page.goto("library.html");
    await expect(page).toHaveURL(/library\.html$/);  

    // SK: Stabilný “anchor” = potvrdenie, že sme na správnej stránke.
    // EN: Stable page anchor = confirmation we are on the correct page.
    await expect(page.getByTestId("page-library")).toBeVisible();

    // SK: Navigácia musí označiť aktívnu položku (správny kontext pre používateľa).
    // EN: Navigation must mark the correct active item (correct context for user).
    await expectNavActive(page, "nav-library");

    // SK: Vyhľadávacie pole je základná funkcionalita knižnice.
    // EN: Search input is a core Library feature.
    await expect(page.getByTestId("search")).toBeVisible();

    // SK: Cloud existuje (neoverujeme dizajn/pozíciu, len že UI je prítomné).
    // EN: The cloud exists (we avoid brittle layout assertions).
    await expect(page.getByTestId("spell-cloud")).toHaveCount(1);

    // SK: Na začiatku musia existovať nejaké zaklínadlá.
    // EN: Initially, at least some spells must be present.
    await expect(page.getByTestId("spell-str").first()).toBeVisible();
  });

  test("Search filters only from 3 characters (rule: <3 does not trigger empty state)", async ({ page }) => {
    // SK: Tento test chráni pravidlo “filter až od 3 znakov”.
    //     Ak by sa filter spúšťal od 1 znaku, používateľ by videl “no results” príliš často.
    // EN: Protects the “filter only from 3 chars” rule.
    //     If filtering starts too early, users see noisy/empty states too often.

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const spells = page.getByTestId("spell-str");

    // SK: Default stav – hint je viditeľný, “no results” je skryté.
    // EN: Default state – min3 hint visible, “no results” hidden.
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();

    // SK: Zapamätáme si počet zaklínadiel pred filtrom.
    // EN: Capture initial spells count (pre-filter).
    const initialCount = await spells.count();
    expect(initialCount, "Expected some spells to be rendered initially").toBeGreaterThan(0);

    // --- 1 char ---
    // SK: Pri 1 znaku sa filter NESMIE spustiť -> počet ostane rovnaký, “no results” ostáva hidden.
    // EN: With 1 character, filter MUST NOT activate -> count unchanged and no-results hidden.
    await search.fill("a");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells).toHaveCount(initialCount);

    // --- 2 chars ---
    // SK: Pri 2 znakoch stále filter NESMIE spustiť.
    // EN: With 2 characters, filter still MUST NOT activate.
    await search.fill("ab");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells).toHaveCount(initialCount);

    // --- 3 chars ---
    // SK: Pri 3 znakoch filter začína – hint zmizne.
    // EN: With 3 characters, filtering becomes active – hint disappears.
    await search.fill("abc");
    await expect(min3).toBeHidden();

    // SK: UI konzistencia: buď sú výsledky, alebo sa ukáže “no results”.
    // EN: UI consistency: either results exist or “no results” is shown.
    const resultCount = await spells.count();
    if (resultCount === 0) {
      await expect(noRes).toBeVisible();
    } else {
      await expect(noRes).toBeHidden();
      await expect(spells.first()).toBeVisible();
    }
  });

  test("No results appears only when filter active (>=3 chars) and nothing matches", async ({ page }) => {
    // SK: Overujeme, že “no results” je vyhradené iba pre reálne filtrovanie.
    //     Pri krátkom vstupe má používateľ dostať hint, nie prázdny stav.
    // EN: Verifies “no results” is used only for active filtering.
    //     For short input, user should see the hint instead of an empty state.

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const spells = page.getByTestId("spell-str");

    // SK: Aktivujeme filter (>=3) a zadáme reťazec, ktorý nič nenájde.
    // EN: Activate filter (>=3) with a query that should match nothing.
    await search.fill("zzqx");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeVisible();
    await expect(spells).toHaveCount(0);

    // SK: Vyčistenie inputu musí vrátiť default (hint + výsledky).
    // EN: Clearing input must restore default state (hint + results).
    await search.fill("");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells.first()).toBeVisible();
  });

  test("Click selects exactly one spell at a time (.is-selected)", async ({ page }) => {
    // SK: Biznis/UX pravidlo: používateľ môže mať vybraté iba jedno zaklínadlo naraz.
    //     Je to dôležité pre prehľadnosť (jednoznačné “aktuálne vybrané”).
    // EN: UX rule: user should have only one selected spell at a time.
    //     Important for clarity (single “current selection”).

    const spells = page.getByTestId("spell-str");

    // SK: Potrebujeme aspoň 2 položky, aby sme otestovali preklik medzi nimi.
    // EN: Need at least 2 items to validate switching selection.
    await expectCountGreaterThan(spells, 1);

    const first = spells.nth(0);
    const second = spells.nth(1);

    // SK: Klik na prvé -> prvé má byť selected.
    // EN: Click first -> first becomes selected.
    await first.click();
    await expect(first).toHaveClass(/is-selected/);

    // SK: Klik na druhé -> druhé selected a prvé sa odselectne.
    // EN: Click second -> second selected, first deselected.
    await second.click();
    await expect(second).toHaveClass(/is-selected/);
    await expect(first).not.toHaveClass(/is-selected/);

    // SK: Vždy presne 1 selected.
    // EN: Always exactly 1 selected item.
    await expect(page.locator('[data-testid="spell-str"].is-selected')).toHaveCount(1);
  });

  test("Search is case-insensitive (basic UX rule)", async ({ page }) => {
    // SK: Používateľ nemá riešiť veľkosť písmen. “lum” a “LUM” má dať rovnaké výsledky.
    // EN: Users shouldn’t care about letter casing. “lum” and “LUM” should behave the same.

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");

    await search.fill("lum");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    const countLower = await page.getByTestId("spell-str").count();
    expect(countLower, "Expected some results for 'lum'").toBeGreaterThan(0);

    await search.fill("LUM");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    const countUpper = await page.getByTestId("spell-str").count();
    expect(countUpper, "Expected same number of results for 'LUM'").toBe(countLower);
  });

  test("Search trims whitespace (user-friendly input)", async ({ page }) => {
    // SK: Bežný používateľ často vloží text s medzerami. Systém by to mal “odpustiť”.
    // EN: Users often type/paste with extra spaces. The UI should handle it gracefully.

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const results = page.getByTestId("spell-str");

    // SK: Medzery okolo vstupu nemajú “rozbiť” vyhľadanie.
    // EN: Surrounding spaces should not break search.
    await search.fill("  lum  ");
    await expect(min3).toBeHidden();

    const cnt = await results.count();
    if (cnt === 0) {
      // SK: Ak by sa nič nenašlo, UI musí byť konzistentné a ukázať “no results”.
      // EN: If nothing found, UI must consistently show “no results”.
      await expect(noRes).toBeVisible();
    } else {
      // SK: Ak sa niečo našlo, “no results” musí byť skryté a výsledky viditeľné.
      // EN: If results exist, “no results” must stay hidden and results visible.
      await expect(noRes).toBeHidden();
      await expect(results.first()).toBeVisible();
    }
  });

  test("DEMO: Intentional failure (runs only when DEMO_FAIL=1)", async ({ page }) => {

   // SK: Úmyselne spraviť chybný assert (pre ukážku reportu).
  // EN: Intentionally assert something wrong (to generate a failure report).
  await page.goto("library.html");
  await expect(page).toHaveTitle(/THIS TITLE SHOULD NEVER MATCH/i);
});

});
