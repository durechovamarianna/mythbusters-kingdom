import { test, expect, Page, Locator } from "@playwright/test";

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
  // SK: Používame relatívnu cestu – nech to funguje lokálne aj v CI (baseURL/webServer).
  // EN: Use relative path – works locally and in CI (baseURL/webServer).
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

async function selectIngredientsAndDrop(page: Page, itemLabelsToSelect: string[]) {
  const source = tid(page, "dnd-source");
  const target = tid(page, "dnd-target");

  // SK: Vyberieme viac prísad klikom.
  // EN: Multi-select items by click.
  for (const label of itemLabelsToSelect) {
    await source.getByText(label).click();
  }

  // SK: Potiahneme jednu z vybraných – očakávame, že sa prenesú všetky vybraté.
  // EN: Drag one of the selected – should transfer all selected.
  const first = source.getByText(itemLabelsToSelect[0]);
  await first.dragTo(target);
}

test.describe("SMOKE – Forms", () => {
  test.beforeEach(async ({ page }) => {
    await gotoForms(page);
  });

  test("Page loads and main blocks are visible", async ({ page }) => {
    // SK: Základné prvky UI existujú.
    // EN: Basic UI elements exist.
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

    // SK: Zobrazí sa globálna chyba a aspoň jedno pole bude označené.
    // EN: Global error appears and at least one field becomes highlighted as invalid.
    await expect(tid(page, "form-error")).toBeVisible();

    // Meno je povinné => musí mať invalid class
    const fullName = tid(page, "input-fullname");
    await expect(fullName).toHaveClass(/is-invalid/);
    await expect(tid(page, "err-fullname")).toBeVisible();
  });

  test("Drag & Drop moves selected ingredients into cauldron", async ({ page }) => {
    await selectIngredientsAndDrop(page, ["Vlások jednorožca", "Dračia šupina"]);

    // SK: Očakávame 2 prísady v kotlíku + 2 pill prvky.
    // EN: Expect 2 ingredients in cauldron + 2 pill items.
    await expect(tid(page, "dnd-count")).toHaveText(/2 prísad/i);

    const pills = page.locator('[data-testid="cauldron-pill"]');
    await expect(pills).toHaveCount(2);
  });
});
