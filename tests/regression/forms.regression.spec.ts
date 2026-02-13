import { test, expect, Page } from "@playwright/test";

/**
 * REGRESSION – Rozprávkové formuláre
 * ==================================
 *
 * SK:
 * Cieľ: Overiť kľúčové validácie a správanie formulára, aby sa pri zmenách v UI/JS
 * nezlomili business pravidlá (čo sa smie uložiť) ani stabilita selektorov (data-testid).
 *
 * Overovať najmä:
 * - zablokovať uloženie pri neplatnom e-maile a jasne označiť chybné pole (UX + pravidlá)
 * - overiť hraničné hodnoty veku (1–120 povoliť, mimo rozsahu zamietnuť)
 * - vynútiť pravidlo PSČ: presne 5 číslic + musí existovať v mape (ináč neuložiť)
 * - vynútiť pravidlo jedla: iba text (čísla zamietnuť)
 * - overiť, že drag&drop “kotlík” funguje aj s odstraňovaním a aktualizuje počítadlo
 *
 * EN:
 * Goal: Validate core form rules and behaviors to prevent regressions when UI/JS changes.
 * We protect both business rules (what can be saved) and selector stability (data-testid).
 *
 * We verify:
 * - invalid email blocks save and clearly marks the field (UX + rule)
 * - age boundary rules (allow 1–120, reject outside)
 * - ZIP rule: exactly 5 digits and must exist in the internal map (otherwise block save)
 * - food rule: text-only (digits must fail)
 * - drag & drop cauldron: adding/removing pills updates the count correctly
 */

/** Helper: short alias for data-testid. */
function tid(page: Page, id: string) {
  return page.getByTestId(id);
}

/** Navigate to Forms page and verify the page anchor. */
async function gotoForms(page: Page) {
  // SK: Prejsť na forms.html a overiť, že stránka je načítaná.
  // EN: Navigate to forms.html and verify the page is loaded.
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

/** Click save (centralized so behavior changes are edited once). */
async function trySave(page: Page) {
  // SK: Spustiť uloženie rovnako v každom teste.
  // EN: Trigger save consistently across tests.
  await tid(page, "btn-save").click();
}

test.describe("REGRESSION – Forms validations & behaviors", () => {
  test.beforeEach(async ({ page }) => {
    // SK: Začať každý test na čistej stránke bez zdieľaného stavu.
    // EN: Start each test from a clean page state with no shared state.
    await gotoForms(page);
  });

  test("Invalid email must block save and highlight email field", async ({ page }) => {
    // SK: Vyplniť všetky povinné polia správne okrem e-mailu.
    // EN: Fill all required fields correctly except the email.
    await tid(page, "input-fullname").fill("Maroš");
    await tid(page, "input-age").fill("25");
    await tid(page, "input-food").fill("pirohy");
    await tid(page, "select-kingdom").selectOption("mistwood");
    await tid(page, "input-zip").fill("02354");
    await tid(page, "input-phone").fill("+421901123456");

    // SK: Zadať neplatný e-mail (typický edge case).
    // EN: Enter an invalid email (typical edge case).
    await tid(page, "input-email").fill("tento@");

    // SK/EN: Pokus o uloženie musí zlyhať.
    await trySave(page);

    // SK: Zobraziť globálnu chybu (aby používateľ vedel, prečo sa neuložilo).
    // EN: Show global form error (so the user understands why save failed).
    await expect(tid(page, "form-error")).toBeVisible();

    // SK: Označiť e-mail ako invalid a zobraziť inline error.
    // EN: Mark email as invalid and show inline error.
    await expect(tid(page, "input-email")).toHaveClass(/is-invalid/);
    await expect(tid(page, "err-email")).toBeVisible();

    // SK: Nepridať žiadnu uloženú kartu.
    // EN: No saved card should be created.
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);
  });

  test("Age boundaries: 0 and 121 must fail; 1 and 120 must pass", async ({ page }) => {
    // SK: Pripraviť základné povinné polia a meniť iba vek, aby sa izolovalo pravidlo veku.
    // EN: Prepare all required fields and vary only age to isolate the age rule.
    const fillBase = async () => {
      await tid(page, "input-fullname").fill("Eva");
      await tid(page, "input-food").fill("halušky");
      await tid(page, "select-kingdom").selectOption("embervale");
      await tid(page, "input-zip").fill("02354");
      await tid(page, "input-email").fill("eva@kingdom.sk");
      await tid(page, "input-phone").fill("+421907123456");
    };

    await fillBase();

    // --- 0 => fail ---
    // SK: Zadať vek mimo rozsahu (0) a očakávať zamietnutie.
    // EN: Enter out-of-range age (0) and expect failure.
    await tid(page, "input-age").fill("0");
    await trySave(page);

    await expect(tid(page, "input-age")).toHaveClass(/is-invalid/);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // --- 1 => pass ---
    // SK: Zadať minimálnu povolenú hodnotu (1) a očakávať uloženie.
    // EN: Enter minimum allowed value (1) and expect save success.
    await tid(page, "input-age").fill("1");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);

    // SK: Odstrániť kartu, aby test zostal nezávislý.
    // EN: Delete the card to keep the test independent.
    await tid(page, "btn-delete-card").click();
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // --- 121 => fail ---
    // SK: Zadať hodnotu nad max (121) a očakávať zamietnutie.
    // EN: Enter a value above max (121) and expect failure.
    await tid(page, "input-age").fill("121");
    await trySave(page);
    await expect(tid(page, "input-age")).toHaveClass(/is-invalid/);

    // --- 120 => pass ---
    // SK: Zadať maximálnu povolenú hodnotu (120) a očakávať uloženie.
    // EN: Enter maximum allowed value (120) and expect save success.
    await tid(page, "input-age").fill("120");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
  });

  test("ZIP must be 5 digits and must exist in map (unknown ZIP blocks save)", async ({ page }) => {
    // SK: Otestovať 2 typy chýb PSČ:
    // 1) nesprávny formát (nie je 5 číslic)
    // 2) správny formát, ale neznáma hodnota (nie je v mape)
    // EN: Test two ZIP error classes:
    // 1) wrong format (not 5 digits)
    // 2) correct format but unknown value (not in map)
    await tid(page, "input-fullname").fill("Tibor");
    await tid(page, "input-age").fill("20");
    await tid(page, "input-food").fill("pirohy");
    await tid(page, "select-kingdom").selectOption("suncrest");
    await tid(page, "input-email").fill("tibor@kingdom.sk");
    await tid(page, "input-phone").fill("+421907000111");

    // --- not 5 digits => fail ---
    await tid(page, "input-zip").fill("123");
    await trySave(page);
    await expect(tid(page, "input-zip")).toHaveClass(/is-invalid/);

    // --- 5 digits but unknown => fail ---
    await tid(page, "input-zip").fill("99999");
    await trySave(page);
    await expect(tid(page, "input-zip")).toHaveClass(/is-invalid/);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // --- known ZIP => pass ---
    await tid(page, "input-zip").fill("02354");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
  });

  test("Food must be text-only (digits should fail)", async ({ page }) => {
    // SK: Overiť pravidlo: jedlo má byť iba text (bez čísiel) – typická business validácia.
    // EN: Verify rule: food must be text-only (no digits) – common business validation.
    await tid(page, "input-fullname").fill("Nina");
    await tid(page, "input-age").fill("19");
    await tid(page, "select-kingdom").selectOption("embervale");
    await tid(page, "input-zip").fill("02354");
    await tid(page, "input-email").fill("nina@kingdom.sk");
    await tid(page, "input-phone").fill("+421907555444");

    // --- contains digits => fail ---
    await tid(page, "input-food").fill("pizza123");
    await trySave(page);

    await expect(tid(page, "input-food")).toHaveClass(/is-invalid/);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);

    // --- fix => pass ---
    await tid(page, "input-food").fill("pizza");
    await trySave(page);
    await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
  });

  test("Cauldron pills can be removed (x) and count updates", async ({ page }) => {
    // SK: Overiť drag & drop “kotlíka” + odstránenie prísady:
    // - pridať 1 prísadu do kotlíka
    // - overiť počítadlo a počet pillov
    // - odstrániť pill cez tlačidlo “Odstrániť”
    // - overiť, že sa počítadlo aj DOM aktualizujú
    // EN: Verify cauldron drag & drop + removal:
    // - add 1 ingredient into cauldron
    // - validate counter and pill count
    // - remove pill via “Odstrániť” button
    // - validate UI updates (counter + DOM)

    const source = tid(page, "dnd-source");
    const target = tid(page, "dnd-target");

    // SK: Vybrať prísadu klikom (aby sa správal multi-select konzistentne).
    // EN: Click to select the ingredient (keeps multi-select behavior consistent).
    await source.getByText("Vlások jednorožca").click();

    // SK: Pretiahnuť do kotlíka (základný DnD flow).
    // EN: Drag to cauldron (basic DnD flow).
    await source.getByText("Vlások jednorožca").dragTo(target);

    // SK/EN: Overiť, že v kotlíku je 1 prísada.
    await expect(tid(page, "dnd-count")).toHaveText(/1 prísad/i);
    await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(1);

    // SK: Odstrániť prísadu cez “x” button (role button, name "Odstrániť").
    // EN: Remove ingredient via the “x” button (role button, name "Odstrániť").
    const pill = page.locator('[data-testid="cauldron-pill"]').first();
    await pill.getByRole("button", { name: "Odstrániť" }).click();

    // SK/EN: Po odstránení musí byť 0 prísad a 0 pillov.
    await expect(tid(page, "dnd-count")).toHaveText(/0 prísad/i);
    await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(0);
  });
});