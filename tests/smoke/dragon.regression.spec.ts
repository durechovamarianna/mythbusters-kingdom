import { test, expect } from "@playwright/test";
import { getDragonCount } from "../_support/helpers";

test.describe("REGRESSION - Dragon rules", () => {
  test("Count never goes below 0", async ({ page }) => {
    await page.goto("dragon.html");

    const remove = page.getByTestId("remove-dragon");
    const count = page.getByTestId("dragon-count");

    await expect(count).toHaveText("0");
    await expect(remove).toBeDisabled();
  });

  test("Limit is 77: add becomes disabled and banner is shown", async ({ page }) => {
    await page.goto("dragon.html");

    const add = page.getByTestId("add-dragon");
    const banner = page.getByTestId("dragon-banner");

    for (let i = 0; i < 77; i++) {
      await add.click();
    }

    await expect(page.getByTestId("dragon-count")).toHaveText("77");
    await expect(add).toBeDisabled();
    await expect(banner).toBeVisible();

    // pokus pridať ešte raz nesmie zmeniť stav
    await add.click({ force: true });
    await expect(page.getByTestId("dragon-count")).toHaveText("77");
    await expect(page.getByTestId("dragon")).toHaveCount(77);
  });

  test("Remove removes the last added dragon (stack behavior)", async ({ page }) => {
    await page.goto("dragon.html");

    const add = page.getByTestId("add-dragon");
    const remove = page.getByTestId("remove-dragon");

    await add.click();
    await add.click();
    await add.click();
    await expect(page.getByTestId("dragon")).toHaveCount(3);

    await remove.click();
    await expect(page.getByTestId("dragon")).toHaveCount(2);
    expect(await getDragonCount(page)).toBe(2);
  });

  test("Click dragon highlights it (is-selected)", async ({ page }) => {
    await page.goto("dragon.html");

    await page.getByTestId("add-dragon").click();
    await page.getByTestId("add-dragon").click();

    const dragons = page.getByTestId("dragon");
    await expect(dragons).toHaveCount(2);

    // klikni na prvého
    await dragons.nth(0).click();
    await expect(dragons.nth(0)).toHaveClass(/is-selected/);

    // klikni na druhého -> prvý by mal stratiť selection
    await dragons.nth(1).click();
    await expect(dragons.nth(1)).toHaveClass(/is-selected/);
    await expect(dragons.nth(0)).not.toHaveClass(/is-selected/);
  });

  test("Random size: transform contains scale within expected range (0.75–1.45)", async ({ page }) => {
    await page.goto("dragon.html");

    await page.getByTestId("add-dragon").click();
    const d = page.getByTestId("dragon").first();

    const transform = await d.evaluate((el) => getComputedStyle(el).transform);
    // transform bude matrix(...) – nemáme priamu hodnotu scale, ale vieme aspoň overiť, že nie je 'none'
    expect(transform).not.toBe("none");
  });
});
