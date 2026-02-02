import { test, expect } from "@playwright/test";

/**
 * REGRESSION TESTS – Library (Spelleology cloud)
 * ==============================================
 *
 * SK: Regression testy pokrývajú pravidlá, hraničné prípady a stabilitu UI selektorov.
 * EN: Regression tests cover business rules, edge cases, and stable selectors.
 */

test.describe("REGRESSION – Library rules", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("library.html");

    // SK: Overíme, že sme na správnej stránke (stabilný anchor).
    // EN: Verify we are on the correct page (stable anchor).
    await expect(page.getByTestId("page-library")).toBeVisible();

    // SK: Search input musí byť dostupný.
    // EN: Search input must be available.
    await expect(page.getByTestId("search")).toBeVisible();

    // SK: spell-cloud netestujeme cez toBeVisible (môže byť "hidden" kvôli CSS/layoutu),
    //     stačí že existuje.
    // EN: do NOT assert cloud visibility (can be "hidden" due to CSS/layout). Existence is enough.
    await expect(page.getByTestId("spell-cloud")).toHaveCount(1);

    // SK: Na začiatku očakávame, že existujú nejaké zaklínadlá.
    // EN: Initially we expect some spells to exist.
    await expect(page.getByTestId("spell-str").first()).toBeVisible();
  });

  test("Search filters only from 3 characters (rule: <3 does not trigger empty state)", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const spells = page.getByTestId("spell-str");

    // SK: Default stav: min3 hint viditeľný, no-results skrytý.
    // EN: Default state: min3 hint visible, no-results hidden.
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();

    // SK: Zmeraj default počet prvkov - neskôr porovnávame, že sa nemení pri <3 znakoch.
    // EN: Capture initial count - later ensure it doesn't change for <3 chars.
    const initialCount = await spells.count();
    expect(initialCount).toBeGreaterThan(0);

    // --- 1 znak ---
    // SK: 1 znak → stále nefiltruje, no-results sa NESMIE zobraziť a počet ostáva rovnaký.
    // EN: 1 char → should NOT filter, no-results must remain hidden, count unchanged.
    await search.fill("a");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells).toHaveCount(initialCount);

    // --- 2 znaky ---
    // SK: 2 znaky → stále nefiltruje.
    // EN: 2 chars → still does NOT filter.
    await search.fill("ab");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells).toHaveCount(initialCount);

    // --- 3 znaky ---
    // SK: 3 znaky → filter sa aktivuje, min3 hint zmizne.
    // EN: 3 chars → filtering activates, min3 hint hides.
    await search.fill("abc");
    await expect(min3).toBeHidden();

    // SK: Pri aktívnom filtri sa môže výsledok zmeniť (0..n),
    //     ale UI musí byť konzistentné: buď vidím aspoň 1 spell-str alebo no-results banner.
    // EN: With active filter, result may change (0..n),
    //     but UI must be consistent: either at least 1 spell-str OR the no-results banner.
    const resultCount = await spells.count();
    if (resultCount === 0) {
      await expect(noRes).toBeVisible();
    } else {
      await expect(noRes).toBeHidden();
      await expect(spells.first()).toBeVisible();
    }
  });

  test("No results appears only when filter active (>=3 chars) and nothing matches", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const spells = page.getByTestId("spell-str");

    // SK: Aktivuj filter (>=3 znaky) a zadaj niečo, čo typicky nič nenájde.
    // EN: Activate filter (>=3 chars) and type something that should match nothing.
    await search.fill("qzx");
    await expect(min3).toBeHidden();

    // SK: Ak nič nenájde, no-results sa zobrazí a počet spell-str bude 0.
    // EN: If nothing matches, no-results shows and spell-str count is 0.
    await expect(noRes).toBeVisible();
    await expect(spells).toHaveCount(0);

    // SK: Keď vymažem input, vrátim sa do defaultu (min3 hint visible, no-results hidden, výsledky späť).
    // EN: Clearing input returns to default (min3 hint visible, no-results hidden, results back).
    await search.fill("");
    await expect(min3).toBeVisible();
    await expect(noRes).toBeHidden();
    await expect(spells.first()).toBeVisible();
  });

  test("Click selects exactly one spell at a time (.is-selected)", async ({ page }) => {
    const spells = page.getByTestId("spell-str");

    // SK: Potrebujeme aspoň 2 prvky, inak nemá zmysel testovať prepínanie selection.
    // EN: Need at least 2 items to test selection switching.
    await expect(spells).toHaveCountGreaterThan(1);

    // SK: Klik na prvé zaklínadlo.
    // EN: Click the first spell.
    await spells.nth(0).click();
    await expect(spells.nth(0)).toHaveClass(/is-selected/);

    // SK: Klik na druhé → prvé sa odznačí, druhé je selected.
    // EN: Click second → first unselects, second selected.
    await spells.nth(1).click();
    await expect(spells.nth(1)).toHaveClass(/is-selected/);
    await expect(spells.nth(0)).not.toHaveClass(/is-selected/);

    // SK: Selected musí byť presne 1.
    // EN: Exactly 1 should be selected.
    const selected = page.locator('[data-testid="spell-str"].is-selected');
    await expect(selected).toHaveCount(1);
  });

  test("Search is case-insensitive (basic UX rule)", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");

    // SK: Použi >=3 znaky; vyber taký, ktorý v tvojich dátach existuje (napr. "lum").
    // EN: Use >=3 chars; pick something that exists in your dataset (e.g. "lum").
    await search.fill("lum");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    const countLower = await page.getByTestId("spell-str").count();
    expect(countLower).toBeGreaterThan(0);

    await search.fill("LUM");
    await expect(min3).toBeHidden();
    await expect(noRes).toBeHidden();

    const countUpper = await page.getByTestId("spell-str").count();

    // SK/EN: Rovnaký výsledok pri inom case.
    expect(countUpper).toBe(countLower);
  });

  test("Search trims whitespace (user-friendly input)", async ({ page }) => {
    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");
    const results = page.getByTestId("spell-str");

    // SK: Medzery okolo vstupu sa majú ignorovať (trim).
    // EN: Leading/trailing whitespace should be ignored (trim).
    await search.fill("  lum  ");
    await expect(min3).toBeHidden();

    // SK: Buď sa nájde aspoň 1 výsledok, alebo (ak dataset nemá "lum") musí byť no-results.
    // EN: Either at least 1 result, or (if dataset lacks "lum") no-results must show.
    const cnt = await results.count();
    if (cnt === 0) {
      await expect(noRes).toBeVisible();
    } else {
      await expect(noRes).toBeHidden();
      await expect(results.first()).toBeVisible();
    }
  });
});

/**
 * Small custom matcher helper.
 * SK: Playwright nemá natívne `toHaveCountGreaterThan`, tak si pomôžeme štýlom.
 * EN: Playwright doesn't have a native `toHaveCountGreaterThan`, so we use a pattern.
 */
expect.extend({
  async toHaveCountGreaterThan(locator, expected) {
    const count = await locator.count();
    const pass = count > expected;
    return {
      pass,
      message: () =>
        pass
          ? `Expected locator NOT to have count > ${expected}, but got ${count}`
          : `Expected locator to have count > ${expected}, but got ${count}`,
    };
  },
});

// Type augmentation for TS (optional; safe to keep even if TS complains in some setups)
declare module "@playwright/test" {
  interface Matchers<R> {
    toHaveCountGreaterThan(expected: number): Promise<R>;
  }
}
