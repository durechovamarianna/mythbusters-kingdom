import { test, expect } from "@playwright/test";

test("Home loads", async ({ page }) => {
  await page.goto("index.html");
  await expect(page.getByTestId("page-title")).toContainText("Vitajte");
});

test("Navigation works: Home -> Dragon -> Spells -> Library", async ({ page }) => {
  await page.goto("index.html");

  await page.getByTestId("nav-dragon").click();
  await expect(page.getByTestId("page-title")).toHaveText("Draci v testovacom poli");


  await page.getByTestId("nav-spells").click();
  await expect(page.getByTestId("page-title")).toContainText("Kalkulačka");

  await page.getByTestId("nav-library").click();
  await expect(page.getByTestId("page-title")).toContainText("Spelleology");
});

test("Dragon add/remove/reset basic", async ({ page }) => {
  await page.goto("dragon.html");

  const add = page.getByTestId("add-dragon");
  const remove = page.getByTestId("remove-dragon");
  const reset = page.getByTestId("reset-dragon");
  const count = page.getByTestId("dragon-count");

  await expect(count).toHaveText("0");

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
});