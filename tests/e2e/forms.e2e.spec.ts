import { test, expect, Page } from "@playwright/test";

/**
 * E2E – Rozprávkové formuláre
 * ===========================
 * SK: End-to-end scenár – vyplnenie formulára, DnD, uloženie, kontrola karty, zmazanie.
 * EN: End-to-end flow – fill form, DnD, save, verify card content, delete.
 */

function tid(page: Page, id: string) {
  return page.getByTestId(id);
}

async function gotoForms(page: Page) {
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

async function fillValidForm(page: Page) {
  // SK: Použijeme hodnoty, ktoré prejdú validáciami.
  // EN: Use values that pass validations.
  await tid(page, "input-fullname").fill("Janko Hraško");
  await tid(page, "input-company").fill("Zlatý Grif s.r.o.");
  await tid(page, "input-age").fill("36");
  await tid(page, "input-food").fill("bryndzové halušky");
  await tid(page, "select-kingdom").selectOption("suncrest");
  await tid(page, "input-zip").fill("02354");
  await tid(page, "input-email").fill("janko.hrasko@kingdom.sk");
  await tid(page, "input-phone").fill("+421907098708");

  await expect(tid(page, "zip-city")).toHaveText(/turzovka/i);
}

async function dragMultiToCauldron(page: Page) {
  const source = tid(page, "dnd-source");
  const target = tid(page, "dnd-target");

  await source.getByText("Vlások jednorožca").click();
  await source.getByText("Dračia šupina").click();
  await source.getByText("Mesačný prach").click();

  await source.getByText("Vlások jednorožca").dragTo(target);

  await expect(tid(page, "dnd-count")).toHaveText(/3 prísad/i);
  await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(3);
}

test.describe("E2E – Forms", () => {
  test.beforeEach(async ({ page }) => {
    await gotoForms(page);
  });

  test("Full flow: fill + DnD + save -> card appears -> delete removes card", async ({ page }) => {
    await test.step("Fill form with valid data", async () => {
      await fillValidForm(page);
    });

    await test.step("Drag & drop ingredients", async () => {
      await dragMultiToCauldron(page);
    });

    await test.step("Save and verify card content", async () => {
      await tid(page, "btn-save").click();

      const savedItems = page.locator('[data-testid="saved-item"]');
      await expect(savedItems).toHaveCount(1);

      const card = savedItems.first();
      await expect(card).toContainText("Janko Hraško");
      await expect(card).toContainText("Zlatý Grif s.r.o.");
      await expect(card).toContainText("36");
      await expect(card).toContainText("bryndzové halušky");
      await expect(card).toContainText("suncrest");
      await expect(card).toContainText("02354");
      await expect(card).toContainText("Turzovka");
      await expect(card).toContainText("janko.hrasko@kingdom.sk");
      await expect(card).toContainText("+421907098708");

      // SK: prísady uložené (kľúče)
      // EN: ingredients keys are stored
      await expect(card).toContainText("unicorn-hair");
      await expect(card).toContainText("dragon-scale");
      await expect(card).toContainText("moon-dust");
    });

    await test.step("Delete card", async () => {
      await tid(page, "btn-delete-card").click();
      await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);
    });
  });

  test("Reset clears fields and cauldron", async ({ page }) => {
    await fillValidForm(page);
    await dragMultiToCauldron(page);

    await tid(page, "btn-reset").click();

    // SK: Po resete sa všetko vyčistí.
    // EN: After reset, everything should be cleared.
    await expect(tid(page, "input-fullname")).toHaveValue("");
    await expect(tid(page, "input-age")).toHaveValue("");
    await expect(tid(page, "select-kingdom")).toHaveValue("");
    await expect(tid(page, "input-zip")).toHaveValue("");
    await expect(tid(page, "zip-city")).toHaveText(/mesto: —/i);
    await expect(tid(page, "dnd-count")).toHaveText(/0 prísad/i);
    await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(0);
  });
});
