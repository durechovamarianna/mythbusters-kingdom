import { test, expect } from "@playwright/test";

test.describe("REGRESSION - Dragon rules", () => {
  test("Limit is 77: add becomes disabled and banner is shown", async ({ page }) => {
    await page.goto("dragon.html");

    const add = page.getByTestId("add-dragon");
    const count = page.getByTestId("dragon-count");
    const banner = page.getByTestId("dragon-banner");

    // 1) pridaj 77 drakov bez "kliknutia myšou" (CI-safe)
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-dragon"]') as HTMLButtonElement | null;
      if (!btn) throw new Error("add-dragon button not found");
      for (let i = 0; i < 77; i++) btn.click();
    });

    // 2) asserty
    await expect(count).toHaveText("77", { timeout: 10_000 });
    await expect(add).toBeDisabled();
    await expect(banner).toBeVisible();
  });
});

