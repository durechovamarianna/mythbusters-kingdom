import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE – Library (Spelleology cloud)
 * ===================================
 *
 * Pre koho je tento súbor:
 * - SK: Pre kolegov z QA/DEV/PM: rýchla kontrola, že stránka „žije“ a kľúčové UI prvky sú dostupné.
 * - EN: For QA/DEV/PM: fast check that the page is alive and essential UI building blocks exist.
 *
 * Čo JE cieľ smoke testov:
 * - SK: Zachytiť „katastrofálne“ problémy po merge/deployi (napr. stránka sa nenačíta, chýba search input, rozbitá navigácia).
 * - EN: Catch “catastrophic” issues after merge/deploy (page doesn’t load, search is missing, navigation is broken).
 *
 * Čo NIE JE cieľ smoke testov:
 * - SK: Netestujeme kompletnú logiku filtrovania a všetky hraničné prípady (to patrí do regression).
 * - EN: We don’t cover full filtering logic and all edge cases here (belongs to regression tests).
 */

test.describe("SMOKE – Library", () => {
  test("Library loads and core elements are present", async ({ page }) => {
    await test.step(
      "Open Library page (SK: stránka sa musí načítať / EN: page must load)",
      async () => {
        // SK: Používame relatívnu cestu, aby to fungovalo lokálne aj v CI (baseURL/webServer).
        // EN: Use relative path so it works locally and in CI (baseURL/webServer).
        await page.goto("library.html");

        // SK: URL kontrola je rýchly signál, že navigácia prebehla na správnu stránku.
        // EN: URL check is a quick signal the navigation landed on the correct page.
        await expect(page).toHaveURL(/library\.html$/);
      }
    );

    await test.step(
      "Basic page anchor is visible (SK: page-library kotva / EN: main page anchor)",
      async () => {
        // SK: Tento element je „kotva“ – ak nie je, stránka sa pravdepodobne nenačítala správne.
        // EN: This is a “page anchor” – if it’s missing, the page likely didn’t render correctly.
        await expect(page.getByTestId("page-library")).toBeVisible();
      }
    );

    await test.step(
      "Navigation highlights current page (SK: active nav link / EN: active nav link)",
      async () => {
        // SK: Očakávame, že aktuálna stránka bude v navigácii označená triedou 'is-active'.
        // EN: We expect the current page to be marked as active via 'is-active' class.
        await expectNavActive(page, "nav-library");
      }
    );

    await test.step(
      "Page title exists (SK: nadpis existuje / EN: title exists)",
      async () => {
        // SK: Nechceme brittle test na presný text (napr. „Knihovník“), stačí že nadpis existuje.
        // EN: Avoid brittle exact-text assertion (e.g. “Knihovník”), we only need the title to exist.
        await expect(page.getByTestId("page-title")).toBeVisible();
      }
    );

    await test.step(
      "Core search UI is present (SK: input existuje / EN: input exists)",
      async () => {
        // SK: Bez search inputu používateľ nevie filtrovať zaklínadlá => kritická funkcia.
        // EN: Without search input, user cannot filter spells => critical functionality.
        await expect(page.getByTestId("search")).toBeVisible();

        // SK: Bonus: placeholder je UX detail, ale môže byť užitočný aj pre PM (napovedá pravidlo min. 3 znaky).
        // EN: Bonus: placeholder is a UX hint (min. 3 chars), useful for PM as well.
        await expect(page.getByTestId("search")).toHaveAttribute(
          "placeholder",
          /lum|acc|guard|invis/i
        );
      }
    );

    await test.step(
      "Spell cloud renders at least one spell (SK: cloud + prvý item / EN: cloud + first item)",
      async () => {
        // SK: Cloud kontajner musí existovať (1x).
        // EN: Cloud container must exist (exactly once).
        await expect(page.getByTestId("spell-cloud")).toHaveCount(1);

        // SK: Aspoň jeden prvok zaklínadla musí byť viditeľný – znamená to, že render prebehol.
        // EN: At least one spell chip visible – indicates rendering happened.
        await expect(page.getByTestId("spell-str").first()).toBeVisible();
      }
    );
  });

  test("Typing <3 chars does not show empty state", async ({ page }) => {
    await test.step(
      "Open Library page (SK: otvorenie / EN: open page)",
      async () => {
        await page.goto("library.html");
        await expect(page.getByTestId("page-library")).toBeVisible();
      }
    );

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");
    const noRes = page.getByTestId("no-results");

    await test.step(
      "Type 2 characters (SK: menej než 3 => nesmie filtrovať / EN: less than 3 => no filtering)",
      async () => {
        // SK: Biznis pravidlo: filter sa spustí až od 3 znakov.
        // EN: Business rule: filtering only starts at 3+ characters.
        await search.fill("ab");
      }
    );

    await test.step(
      "Verify UX messages (SK: min3 hint visible, no-results hidden / EN: min3 visible, no-results hidden)",
      async () => {
        // SK: Používateľ musí dostať jasnú informáciu „zadaj aspoň 3 znaky“.
        // EN: User should see clear guidance “type at least 3 characters”.
        await expect(min3).toBeVisible();

        // SK: 'No results' nesmie byť zobrazené, lebo sme ešte nezačali filtrovať.
        // EN: 'No results' must NOT be shown because filtering has not started yet.
        await expect(noRes).toBeHidden();
      }
    );
  });

  /**
   * (Voliteľné rozšírenie smoke)
   * SK: Toto je stále „smoke-friendly“ – overíme, že pri 3+ znakoch sa filter spustí a UI reaguje.
   * EN: Still smoke-friendly – verify filtering kicks in at 3+ chars and UI reacts.
   */
  test("Typing 3+ chars triggers filtering UI (min3 hint hides)", async ({ page }) => {
    await page.goto("library.html");
    await expect(page.getByTestId("page-library")).toBeVisible();

    const search = page.getByTestId("search");
    const min3 = page.getByTestId("min3-hint");

    await test.step("Type 3 characters (SK: spustí filter / EN: triggers filter)", async () => {
      await search.fill("lum");
    });

    await test.step(
      "Min-3 hint disappears (SK: hint sa skryje / EN: hint hides)",
      async () => {
        // SK: Ak je 3+ znakov, hint sa skryje (filter beží).
        // EN: With 3+ chars, hint should hide (filter is active).
        await expect(min3).toBeHidden();
      }
    );

    await test.step(
      "Results still render some spell chips (SK: stále existujú výsledky / EN: results still render)",
      async () => {
        // SK: Nechceme testovať presný počet ani presné texty (to je regression).
        // EN: We avoid exact counts/texts here (belongs to regression).
        await expect(page.getByTestId("spell-str").first()).toBeVisible();
      }
    );
  });
});
