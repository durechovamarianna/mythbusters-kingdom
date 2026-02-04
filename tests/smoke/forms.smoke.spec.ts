import { test, expect, Page } from "@playwright/test";

/**
 * SMOKE – Rozprávkové formuláre
 * =============================
 * SK: Overí, že stránka sa otvorí a kľúčové prvky fungujú.
 * EN: Verifies the page loads and key elements work (happy path basics).
 */

function tid(page: Page, id: string) {
  return page.getByTestId(id);
}

async function gotoForms(page: Page) {
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

async function selectIngredientsAndDrop(page: Page, itemLabelsToSelect: string[]) {
  const source = tid(page, "dnd-source");
  const target = tid(page, "dnd-target");

  for (const label of itemLabelsToSelect) {
    await source.getByText(label).click();
  }

  const first = source.getByText(itemLabelsToSelect[0]);
  await first.dragTo(target);
}

test.describe("SMOKE – Forms", () => {
  test.beforeEach(async ({ page }) => {
    await gotoForms(page);
  });

  test("Page loads and main blocks are visible", async ({ page }) => {
    await expect(tid(page, "page-title")).toHaveText(/rozprávkové formuláre/i);
    await expect(tid(page, "form-card")).toBeVisible();
    await expect(tid(page, "saved-card")).toBeVisible();
    await expect(tid(page, "btn-save")).toBeVisible();
    await expect(tid(page, "btn-reset")).toBeVisible();
  });

  test("ZIP shows city for known postal code (02354 -> Turzovka)", async ({ page }) => {
    const zip = tid(page, "input-zip");
    const chip = tid(page, "zip-city");

    await zip.fill("02354");
    await expect(chip).toHaveText(/turzovka/i);
  });

  test("Save blocked when required fields empty (shows error + highlights)", async ({ page }) => {
    await tid(page, "btn-save").click();

    await expect(tid(page, "form-error")).toBeVisible();

    const fullName = tid(page, "input-fullname");
    await expect(fullName).toHaveClass(/is-invalid/);
    await expect(tid(page, "err-fullname")).toBeVisible();
  });

  test("Drag & Drop moves selected ingredients into cauldron", async ({ page }) => {
    await selectIngredientsAndDrop(page, ["Vlások jednorožca", "Dračia šupina"]);

    await expect(tid(page, "dnd-count")).toHaveText(/2 prísad/i);

    const pills = page.locator('[data-testid="cauldron-pill"]');
    await expect(pills).toHaveCount(2);
  });
});
