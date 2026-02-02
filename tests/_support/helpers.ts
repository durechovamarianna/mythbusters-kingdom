import { expect, type Page } from "@playwright/test";

export async function expectNavActive(page: Page, testId: string) {
  const el = page.getByTestId(testId);
  await expect(el).toBeVisible();
  await expect(el).toHaveClass(/is-active/);
}

export async function getDragonCount(page: Page) {
  const txt = await page.getByTestId("dragon-count").textContent();
  return Number((txt ?? "0").trim());
}

export async function addDragons(page: Page, n: number) {
  await page.evaluate((count) => {
    const btn = document.querySelector('button[data-testid="add-dragon"]') as HTMLButtonElement | null;
    if (!btn) throw new Error("add-dragon button not found");
    if (btn.disabled) throw new Error("add-dragon is disabled before adding");

    for (let i = 0; i < count; i++) btn.click();
  }, n);
}

export async function getSpellCount(page: Page) {
  return await page.getByTestId("spell-str").count();
}

export async function selectSpellByIndex(page: Page, i: number) {
  const spell = page.getByTestId("spell-str").nth(i);
  await spell.click();
  await expect(spell).toHaveClass(/is-selected/);
}


