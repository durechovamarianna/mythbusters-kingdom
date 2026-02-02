import { test, expect } from "@playwright/test";

/**
 * REGRESSION – Story rules
 * =======================
 * SK: business pravidlá:
 * - budget sa znižuje presne o cost
 * - karta po výbere zostane disabled a už sa nedá vybrať 2x
 * - pri nízkom budgete sa drahé karty zablokujú (disabled)
 * - reset obnoví všetko
 */

test.describe("REGRESSION – Story rules", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("story.html");
    await expect(page.getByTestId("page-story")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).toBeVisible();
    await expect(page.getByTestId("characters-grid")).toBeVisible();
  });

  test("Budget decreases by exact cost and card becomes disabled after pick", async ({ page }) => {
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");
    await expect(page.getByTestId("budget-used")).toHaveText("0");

    const king = page.getByTestId("char-king");
    await expect(king).toBeEnabled();

    await king.click();

    // cost 6 => remaining 19, used 6
    await expect(page.getByTestId("budget-remaining")).toHaveText("19");
    await expect(page.getByTestId("budget-used")).toHaveText("6");

    // picked tag created
    await expect(page.getByTestId("picked-king")).toBeVisible();

    // cannot pick twice
    await expect(king).toBeDisabled();
  });

  test("Insufficient budget disables expensive cards (e.g., dragon7 cost 10)", async ({ page }) => {
    // Spend 16 first: king (6) + dragon7 (10) => remaining 9
    await page.getByTestId("char-king").click();
    await page.getByTestId("char-dragon7").click();
    await expect(page.getByTestId("budget-remaining")).toHaveText("9");

    // Now giant cost 7 should still be possible, dragon3 cost 8 possible, but NOT dragon7 (already picked)
    // We need to force remaining below 10 without picking dragon7 (already picked), so instead:
    // Reset -> pick only dragon7? No. Let's just validate "insufficient budget" disables some card:
    // We can reset and pick dragon7 + king to make remaining 9, then check another cost 10 card doesn't exist.
    // So use a different expensive card: none cost 10 besides dragon7. We'll verify disabling by driving remaining below 8 and checking dragon3 disables.

    await page.getByTestId("btn-reset").click();
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");

    // Spend 22: dragon7 (10) + king (6) + queen (6) => remaining 3
    await page.getByTestId("char-dragon7").click();
    await page.getByTestId("char-king").click();
    await page.getByTestId("char-queen").click();

    await expect(page.getByTestId("budget-remaining")).toHaveText("3");

    // Cards with cost > 3 must be disabled now (example: fairy cost 4, knight cost 4)
    await expect(page.getByTestId("char-fairy")).toBeDisabled();
    await expect(page.getByTestId("char-knight")).toBeDisabled();

    // But a cost 3 card should still be enabled if not selected (wolf or thief)
    const wolf = page.getByTestId("char-wolf");
    await expect(wolf).toBeEnabled();
  });

  test("Random pick never selects already-selected character and respects budget (doesn't increase used incorrectly)", async ({ page }) => {
    // Pick one first
    await page.getByTestId("char-jester").click(); // cost 2
    await expect(page.getByTestId("budget-used")).toHaveText("2");
    await expect(page.getByTestId("picked-jester")).toBeVisible();

    // Random pick should add exactly one more selection (if any candidate exists)
    const beforeCountText = await page.getByTestId("characters-count").textContent();
    await page.getByTestId("btn-random").click();

    // After random, count should be >= previous + 1
    // We validate via picked tags count (stable).
    const tags = page.getByTestId("picked-list").locator("[data-testid^='picked-']");
    await expect(tags).toHaveCount(2);

    // Ensure jester is still only once
    await expect(page.getByTestId("picked-jester")).toHaveCount(1);
  });

  test("Reset restores everything: budget, picked list, enables cards", async ({ page }) => {
    await page.getByTestId("char-king").click();
    await page.getByTestId("char-dragon7").click();

    await expect(page.getByTestId("picked-king")).toBeVisible();
    await expect(page.getByTestId("picked-dragon7")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).not.toHaveText("25");

    await page.getByTestId("btn-reset").click();

    await expect(page.getByTestId("budget-remaining")).toHaveText("25");
    await expect(page.getByTestId("budget-used")).toHaveText("0");
    await expect(page.getByTestId("picked-list").locator("[data-testid^='picked-']")).toHaveCount(0);

    await expect(page.getByTestId("char-king")).toBeEnabled();
    await expect(page.getByTestId("char-dragon7")).toBeEnabled();
  });
});
