import { test, expect } from "@playwright/test";

test.describe("SMOKE - Dragon", () => {
  test("Dragon page loads and add/remove/reset works (basic)", async ({ page }) => {
    await page.goto("dragon.html");

    const add = page.getByTestId("add-dragon");
    const remove = page.getByTestId("remove-dragon");
    const reset = page.getByTestId("reset-dragon");
    const count = page.getByTestId("dragon-count");

    await expect(count).toHaveText("0");
    await expect(remove).toBeDisabled();
    await expect(reset).toBeDisabled();

    await add.click();
    await expect(count).toHaveText("1");
    await expect(page.getByTestId("dragon")).toHaveCount(1);

    await remove.click();
    await expect(count).toHaveText("0");
    await expect(page.getByTestId("dragon")).toHaveCount(0);

    await add.click();
    await add.click();
    await expect(count).toHaveText("2");

    await reset.click();
    await expect(count).toHaveText("0");
    await expect(page.getByTestId("dragon")).toHaveCount(0);
  });
});
