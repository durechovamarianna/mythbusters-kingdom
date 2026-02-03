import { test, expect, Page } from "@playwright/test";

/**
 * REGRESSION – Rozprávkové formuláre
 * ==================================
 * SK: Hraničné prípady, validácie, stabilita selektorov a funkčné detaily.
 * EN: Edge cases, validations, selector stability, and detailed behavior checks.
 */

function tid(page: Page, id: string) {
  return page.getByTestId(id);
}

async function gotoForms(page: Page) {
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

async function trySave(page: Page) {
  await tid(page, "btn-save").click();
}

test.describe("REGRESSION – Forms validations & behaviors", () => {
  test.beforeEach(async ({ page }) => {
    await gotoForms(page);
  });

  test("Invalid email must block save and highlight email field", async ({ page }) => {
    // SK: Vyplníme všetko OK okrem e-mailu.
    // EN: Fill everything OK except email.
    await tid(page, "input-fullname").fill("Maroš");
    await tid(page, "input-age").fill("25");
    await tid(page, "input-food").fill("pirohy");
    await tid(page, "select-kingdom").selectOption("mistwood");
    await tid(page, "input-zip").fill("02354");
    await tid(page, "input-phone").fill("+421901123456");

    // invalid email
    await tid(page, "input-email").fill("tento@");

    await trySave(page);

    await expect(tid(page, "form-error")).toBeVisible();
    await expect(tid(page, "input-email")).toHaveClass(/is-invalid/);
    await expect(tid(page, "err-email")).toBeVisible();
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);
  });

  test("Age boundaries: 0 and 121 must fail; 1 and 120 must pass", async ({ page }) => {
    // SK/EN: Helper fill for required fields without age.
    const fillBase = async () => {
      await tid(page, "input-fullname").fill("Eva");
      await tid(page, "input-food").fill("halušky");
      await tid(page, "select-kingdom").selectOption("embervale");
      await tid(page, "input-zip").fill("02354");
      await tid(page, "input-email").fill("eva@kingdom.sk");
      await tid(page, "input-phone").fill("+421907123456");
    };

    await fillBase();

    // 0 -> fail
    await tid(page, "input-age").fill("0");
    await trySave(page);
    await expect(tid(page, "input-age")).toHaveClass(/is-invalid/);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // 1 -> pass
    await tid(page, "input-age").fill("1");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);

    // delete card to keep test independent
    await tid(page, "btn-delete-card").click();
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // 121 -> fail
    await tid(page, "input-age").fill("121");
    await trySave(page);
    await expect(tid(page, "input-age")).toHaveClass(/is-invalid/);

    // 120 -> pass
    await tid(page, "input-age").fill("120");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
  });

  test("ZIP must be 5 digits and must exist in map (unknown ZIP blocks save)", async ({ page }) => {
    await tid(page, "input-fullname").fill("Tibor");
    await tid(page, "input-age").fill("20");
    await tid(page, "input-food").fill("pirohy");
    await tid(page, "select-kingdom").selectOption("suncrest");
    await tid(page, "input-email").fill("tibor@kingdom.sk");
    await tid(page, "input-phone").fill("+421907000111");

    // not 5 digits -> fail
    await tid(page, "input-zip").fill("123");
    await trySave(page);
    await expect(tid(page, "input-zip")).toHaveClass(/is-invalid/);

    // 5 digits but unknown -> fail
    await tid(page, "input-zip").fill("99999");
    await trySave(page);
    await expect(tid(page, "input-zip")).toHaveClass(/is-invalid/);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // known -> pass
    await tid(page, "input-zip").fill("02354");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
  });

  test("Food must be text-only (digits should fail)", async ({ page }) => {
    await tid(page, "input-fullname").fill("Nina");
    await tid(page, "input-age").fill("19");
    await tid(page, "select-kingdom").selectOption("embervale");
    await tid(page, "input-zip").fill("02354");
    await tid(page, "input-email").fill("nina@kingdom.sk");
    await tid(page, "input-phone").fill("+421907555444");

    // contains digits -> fail
    await tid(page, "input-food").fill("pizza123");
    await trySave(page);

    await expect(tid(page, "input-food")).toHaveClass(/is-invalid/);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // fix -> pass
    await tid(page, "input-food").fill("pizza");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
  });

  test("Cauldron pills can be removed (x) and count updates", async ({ page }) => {
    const source = tid(page, "dnd-source");
    const target = tid(page, "dnd-target");

    await source.getByText("Vlások jednorožca").click();
    await source.getByText("Vlások jednorožca").dragTo(target);

    await expect(tid(page, "dnd-count")).toHaveText(/1 prísad/i);
    await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(1);

    // remove pill by x
    const pill = page.locator('[data-testid="cauldron-pill"]').first();
    await pill.getByRole("button", { name: "Odstrániť" }).click();

    await expect(tid(page, "dnd-count")).toHaveText(/0 prísad/i);
    await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(0);
  });
});
