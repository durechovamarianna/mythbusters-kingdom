import { expect, Page } from "@playwright/test";

export async function expectNavActive(page: Page, testId: string) {
  const el = page.getByTestId(testId);
  await expect(el).toHaveClass(/is-active/);
}

export async function getDragonCount(page: Page) {
  return Number(await page.getByTestId("dragon-count").innerText());
}
