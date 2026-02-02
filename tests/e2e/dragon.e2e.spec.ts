import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SK:
 * E2E testy simulujú reálne použitie:
 * - používateľ príde na Home
 * - preklikne sa na Dragon cez CTA / nav
 * - pridá drakov, označí (highlight), odstráni, resetuje
 * - overí URL, titulky, aktívnu navigáciu a footer odkazy
 *
 * EN:
 * E2E tests simulate real user flows:
 * - user lands on Home
 * - navigates to Dragon via CTA / nav
 * - adds dragons, highlights one, removes, resets
 * - verifies URL, titles, active navigation and footer links
 */

test.describe("E2E - Dragon flows", () => {
  test("Home -> Dragon via CTA, then add/highlight/remove/reset", async ({ page }) => {
    await page.goto("index.html");

    // SK: overíme landing page / EN: assert landing page basics
    await expect(page.getByTestId("page-home")).toBeVisible();
    await expect(page.getByTestId("page-title")).toHaveText(/Vitajte, začnite testovať/i);
    await expectNavActive(page, "nav-home");

    // SK: CTA preklik na drakov / EN: CTA to Dragon page
    // CHANGED: cta-start -> cta-dragon (after index.html cleanup)
    await page.getByTestId("cta-dragon").click();
    await expect(page).toHaveURL(/dragon\.html$/);

    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // NOTE: keep this only if your dragon page title contains "Draci"
    await expect(page.getByTestId("page-title")).toContainText("Draci");

    await expectNavActive(page, "nav-dragon");

    const add = page.getByTestId("add-dragon");
    const remove = page.getByTestId("remove-dragon");
    const reset = page.getByTestId("reset-dragon");
    const count = page.getByTestId("dragon-count");

    // SK: bezpečne scrollni na controls / EN: ensure controls are in view
    await add.scrollIntoViewIfNeeded();

    // SK: pridáme 2 drakov / EN: add 2 dragons
    await add.click();
    await add.click();

    await expect(count).toHaveText("2");
    await expect(page.getByTestId("dragon")).toHaveCount(2);

    // SK: vyberieme 1. draka a skontrolujeme highlight / EN: select 1st dragon (highlight)
    const first = page.getByTestId("dragon").first();
    await first.click();
    await expect(first).toHaveClass(/is-selected/);
    await expect(page.locator('[data-testid="dragon"].is-selected')).toHaveCount(1);

    // SK: remove odstráni posledného, count = 1 / EN: remove last -> count 1
    await remove.click();
    await expect(count).toHaveText("1");
    await expect(page.getByTestId("dragon")).toHaveCount(1);

    // SK: reset vynuluje / EN: reset clears all
    await reset.click();
    await expect(count).toHaveText("0");
    await expect(page.getByTestId("dragon")).toHaveCount(0);
  });

  test("Home -> Dragon via nav card, then back to Home via footer", async ({ page }) => {
    await page.goto("index.html");

    // SK: preklik cez nav kartičku / EN: navigate via nav card
    await page.getByTestId("nav-dragon").click();
    await expect(page).toHaveURL(/dragon\.html$/);
    await expectNavActive(page, "nav-dragon");

    // SK: cez footer späť na Home / EN: back to Home via footer link
    await page.getByTestId("footer-home").click();
    await expect(page).toHaveURL(/index\.html$/);
    await expectNavActive(page, "nav-home");
    await expect(page.getByTestId("page-home")).toBeVisible();
  });
});
