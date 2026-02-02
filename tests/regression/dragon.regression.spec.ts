import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SK:
 * Regression testy overujú:
 * - business pravidlá (limit 77)
 * - disabled stavy tlačidiel
 * - banner pri dosiahnutí limitu
 * - "remove" odstráni naposledy pridaného draka (stack LIFO)
 * - reset vymaže všetko a vráti UI do defaultu
 * - klik na draka zvýrazní len jedného (is-selected)
 *
 * EN:
 * Regression tests verify:
 * - business rules (limit 77)
 * - disabled states of controls
 * - banner when limit is reached
 * - remove removes the last added dragon (LIFO stack)
 * - reset clears everything and restores default UI state
 * - clicking a dragon highlights only one at a time (is-selected)
 */

// ---------- CI-safe DOM helpers ----------
async function domClick(page: any, testId: string) {
  // SK: Klik cez DOM .click() (neblokujú ho overlay/pointer intercept v CI)
  // EN: DOM .click() (avoids overlay/pointer intercept issues in CI)
  await page.evaluate((tid: string) => {
    const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLElement | null;
    if (!el) throw new Error(`${tid} not found`);
    el.click();
  }, testId);
}

async function domAddMany(page: any, n: number) {
  await page.evaluate((count: number) => {
    const btn = document.querySelector('[data-testid="add-dragon"]') as HTMLButtonElement | null;
    if (!btn) throw new Error("add-dragon button not found");

    for (let i = 0; i < count; i++) {
      // once disabled, further clicks should be no-ops (stable in CI)
      if (btn.disabled) break;
      btn.click();
    }
  }, n);
}

async function domClickDragonByIndex(page: any, index: number) {
  await page.evaluate((i: number) => {
    const list = Array.from(document.querySelectorAll('[data-testid="dragon"]')) as HTMLElement[];
    const el = list[i];
    if (!el) throw new Error(`dragon[${i}] not found`);
    el.click();
  }, index);
}

test.describe("REGRESSION - Dragon rules", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("dragon.html");
    await expect(page).toHaveURL(/dragon\.html$/);
    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // New nav system: ensure active tab is correct
    await expectNavActive(page, "nav-dragon");
  });

  test("Limit is 77: add becomes disabled and banner is shown (CI-safe, no mouse clicks)", async ({ page }) => {
    const add = page.getByTestId("add-dragon");
    const count = page.getByTestId("dragon-count");
    const banner = page.getByTestId("dragon-banner");
    const dragons = page.getByTestId("dragon");

    await domAddMany(page, 77);

    // SK/EN: synchronizácia cez DOM count + counter
    await expect(dragons).toHaveCount(77);
    await expect(count).toHaveText("77", { timeout: 10_000 });

    await expect(add).toBeDisabled();
    await expect(banner).toBeVisible();
  });

  test("After reaching 77, additional click does not increase count (idempotent behavior)", async ({ page }) => {
    const add = page.getByTestId("add-dragon");
    const count = page.getByTestId("dragon-count");
    const dragons = page.getByTestId("dragon");

    await domAddMany(page, 80); // beyond limit

    await expect(dragons).toHaveCount(77);
    await expect(count).toHaveText("77");
    await expect(add).toBeDisabled();
  });

  test("Remove removes last added element (LIFO) and keeps count consistent (CI-safe)", async ({ page }) => {
    const count = page.getByTestId("dragon-count");
    const dragons = page.locator('[data-testid="dragon"]');

    await domAddMany(page, 3);

    await expect(dragons).toHaveCount(3);
    await expect(count).toHaveText("3");

    // SK/EN: zoberieme ID posledného draka (stabilné po toHaveCount)
    const last = dragons.last();
    await expect(last).toBeVisible();

    const lastId = await last.getAttribute("data-dragon-id");
    expect(lastId, "Last dragon should have data-dragon-id").toBeTruthy();

    const lastById = page.locator(`[data-testid="dragon"][data-dragon-id="${lastId}"]`);
    await expect(lastById).toHaveCount(1);

    // SK/EN: remove cez DOM click (CI-safe)
    await domClick(page, "remove-dragon");

    await expect(dragons).toHaveCount(2);
    await expect(count).toHaveText("2");

    // SK/EN: konkrétny posledný drak musí zmiznúť
    await expect(lastById).toHaveCount(0);
  });

  test("Reset clears all dragons, sets count to 0 and disables remove/reset", async ({ page }) => {
    const reset = page.getByTestId("reset-dragon");
    const remove = page.getByTestId("remove-dragon");
    const count = page.getByTestId("dragon-count");
    const dragons = page.getByTestId("dragon");

    await domAddMany(page, 5);

    await expect(dragons).toHaveCount(5);
    await expect(count).toHaveText("5");

    await domClick(page, "reset-dragon");

    await expect(dragons).toHaveCount(0);
    await expect(count).toHaveText("0");

    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();
  });

  test("Clicking a dragon highlights it (is-selected) and only one is selected (CI-safe)", async ({ page }) => {
    await domAddMany(page, 3);

    const dragons = page.locator('[data-testid="dragon"]');
    await expect(dragons).toHaveCount(3);

    // CI-safe clicks (dragons can overlap)
    await domClickDragonByIndex(page, 0);
    await expect(dragons.nth(0)).toHaveClass(/is-selected/);

    await domClickDragonByIndex(page, 1);
    await expect(dragons.nth(1)).toHaveClass(/is-selected/);
    await expect(dragons.nth(0)).not.toHaveClass(/is-selected/);

    await expect(page.locator('[data-testid="dragon"].is-selected')).toHaveCount(1);
  });
});
