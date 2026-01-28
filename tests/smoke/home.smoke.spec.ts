import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

test.describe("SMOKE - Home", () => {
  test("Home loads and has hero title", async ({ page }) => {
    await page.goto("index.html");
    await expect(page).toHaveTitle(/Vitajte/);

    await expect(page.getByTestId("page-home")).toBeVisible();
    await expect(page.getByTestId("page-title")).toHaveText(/Vitajte, začnite testovať/i);

    await expect(page.getByTestId("nav")).toBeVisible();
    await expectNavActive(page, "nav-home");
    await expect(page.getByTestId("footer")).toBeVisible();
  });

  test("Home CTA -> Dragon works", async ({ page }) => {
    await page.goto("index.html");
    await page.getByTestId("cta-start").click();

    await expect(page).toHaveURL(/dragon\.html$/);
    await expect(page.getByTestId("page-dragon")).toBeVisible();
    await expect(page.getByTestId("page-title")).toContainText("Draci");
  });
});
