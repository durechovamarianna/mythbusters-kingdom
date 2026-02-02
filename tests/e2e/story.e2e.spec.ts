import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * E2E – Story (budget + pick)
 * ==========================
 * SK: user flow naprieč stránkami + výber postáv + reset
 * EN: cross-page flow + picking characters + reset
 */

test.describe("E2E – Story user flow", () => {
  test("Home -> Story via nav, pick characters, budget updates, reset restores defaults", async ({ page }) => {
    await page.goto("index.html");
    await expect(page.getByTestId("page-home")).toBeVisible();

    // Go to story
    await page.getByTestId("nav-story").click();
    await expect(page).toHaveURL(/story\.html$/);
    await expect(page.getByTestId("page-story")).toBeVisible();
    await expectNavActive(page, "nav-story");

    // Initial budget
    await expect(page.getByTestId("budget-total")).toHaveText("25");
    await expect(page.getByTestId("budget-remaining")).toHaveText("25");
    await expect(page.getByTestId("budget-used")).toHaveText("0");
    await expect(page.getByTestId("characters-count")).toContainText("0");

    // Pick King (cost 6) => remaining 19, used 6
    const king = page.getByTestId("char-king");
    await expect(king).toBeVisible();
    await king.click();

    await expect(page.getByTestId("picked-king")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).toHaveText("19");
    await expect(page.getByTestId("budget-used")).toHaveText("6");
    await expect(page.getByTestId("characters-count")).toContainText("1");

    // Card becomes disabled (cannot be clicked again)
    await expect(king).toBeDisabled();

    // Pick Dragon7 (cost 10) => remaining 9, used 16
    const dragon7 = page.getByTestId("char-dragon7");
    await dragon7.scrollIntoViewIfNeeded();
    await dragon7.click();

    await expect(page.getByTestId("picked-dragon7")).toBeVisible();
    await expect(page.getByTestId("budget-remaining")).toHaveText("9");
    await expect(page.getByTestId("budget-used")).toHaveText("16");
    await expect(page.getByTestId("characters-count")).toContainText("2");
    await expect(dragon7).toBeDisabled();

    // Reset brings back defaults
    await page.getByTestId("btn-reset").click();

    await expect(page.getByTestId("budget-remaining")).toHaveText("25");
    await expect(page.getByTestId("budget-used")).toHaveText("0");
    await expect(page.getByTestId("characters-count")).toContainText("0");

    // picked tags should be gone
    await expect(page.getByTestId("picked-list").locator("[data-testid^='picked-']")).toHaveCount(0);

    // previously selected cards are enabled again
    await expect(page.getByTestId("char-king")).toBeEnabled();
    await expect(page.getByTestId("char-dragon7")).toBeEnabled();
  });

  test("Story -> Library via nav, active nav updates correctly", async ({ page }) => {
    await page.goto("story.html");
    await expect(page.getByTestId("page-story")).toBeVisible();
    await expectNavActive(page, "nav-story");

    await page.getByTestId("nav-library").click();
    await expect(page).toHaveURL(/library\.html$/);
    await expect(page.getByTestId("page-library")).toBeVisible();
    await expectNavActive(page, "nav-library");
  });
});
