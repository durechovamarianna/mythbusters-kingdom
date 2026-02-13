import { test, expect, Page, Locator } from "@playwright/test";

/**
 * E2E – Rozprávkové formuláre 
 * ===========================================
 *
 * SK:
 * Cieľ: Overiť end-to-end “happy path” tok používateľa na stránke Forms:
 * - otvoriť stránku
 * - vyplniť povinné polia validnými hodnotami (tak, aby prejsť validácie)
 * - pridať prísady do kotlíka cez drag & drop (multi-select + multi-drop)
 * - uložiť záznam a overiť, že sa vytvoriť karta so správnymi údajmi
 * - zmazať kartu a overiť, že sa odstrániť z UI
 *
 * Best practice princípy v tomto súbore:
 * - Používať stabilné selektory (data-testid) a minimálne spoliehať sa na CSS/DOM štruktúru.
 * - Udržať testy nezávislé (nezdielať stav medzi testami; začať vždy fresh).
 * - Rozdeliť scenár do test.step krokov (report je čitateľný aj pre PM).
 * - Používať pomocné funkcie pre opakované kroky (jedno miesto úprav).
 * - Overovať “user-visible” výsledky (texty, počty, stav UI), nie implementačné detaily.
 *
 * EN:
 * Goal: Validate the end-to-end happy path user journey on the Forms page:
 * - open the page
 * - fill required fields with valid data (so validations pass)
 * - add ingredients via drag & drop (multi-select + multi-drop)
 * - save and verify a card is created with correct content
 * - delete the card and verify it is removed from the UI
 *
 * Best practice principles:
 * - Use stable selectors (data-testid), avoid brittle CSS/DOM coupling.
 * - Keep tests independent (no shared state; start fresh each test).
 * - Use test.step for readable reporting (including for PMs).
 * - Use helpers for repeated actions (single point of change).
 * - Assert user-visible outcomes (text/count/UI state), not implementation details.
 */

/** Convenience: get element by data-testid. */
function tid(page: Page, id: string) {
  return page.getByTestId(id);
}

/** Navigate to Forms page and verify page anchor is present. */
async function gotoForms(page: Page) {
  // SK: Otvoriť stránku a overiť, že sa načítať korektne.
  // EN: Open the page and verify it loads correctly.
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

/** Fill the form with valid values (should pass all validations). */
async function fillValidForm(page: Page) {
  // SK: Vyplniť povinné polia validnými hodnotami.
  // EN: Fill required fields with valid values.
  await tid(page, "input-fullname").fill("Janko Hraško");
  await tid(page, "input-company").fill("Zlatý Grif s.r.o.");
  await tid(page, "input-age").fill("36");
  await tid(page, "input-food").fill("bryndzové halušky");
  await tid(page, "select-kingdom").selectOption("suncrest");
  await tid(page, "input-zip").fill("02354");
  await tid(page, "input-email").fill("janko.hrasko@kingdom.sk");
  await tid(page, "input-phone").fill("+421907098708");

  // SK: Overiť UX detail – PSČ má doplniť mesto.
  // EN: Verify UX detail – ZIP should resolve to a city.
  await expect(tid(page, "zip-city")).toHaveText(/turzovka/i);
}

/**
 * Best-practice DnD helper:
 * - Select multiple items by clicking labels (user behavior)
 * - Drag the first selected into the target (app should transfer all selected)
 */
async function dragMultiToCauldron(page: Page, labels: string[]) {
  // SK: Simulovať používateľský flow: vybrať viac prísad klikom, potom jednu pretiahnuť.
  // EN: Simulate user flow: multi-select by click, then drag one item.
  const source = tid(page, "dnd-source");
  const target = tid(page, "dnd-target");

  for (const label of labels) {
    await source.getByText(label).click();
  }

  await source.getByText(labels[0]).dragTo(target);

  // SK: Overiť výsledok viditeľný pre používateľa (počítadlo + pills).
  // EN: Verify user-visible outcome (counter + pills).
  await expect(tid(page, "dnd-count")).toHaveText(new RegExp(`${labels.length}\\s+prísad`, "i"));
  await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(labels.length);
}

/** Save the form (centralized to keep test code consistent). */
async function saveForm(page: Page) {
  // SK: Spustiť uloženie a očakávať, že sa nezobrazí globálna chyba.
  // EN: Trigger save and expect no global error to remain visible.
  await tid(page, "btn-save").click();

  // SK: Pri happy path nemá byť “form-error” viditeľný.
  // EN: In happy path, the global error should not be visible.
  await expect(tid(page, "form-error")).toBeHidden();
}

/** Get the first saved card (the newest card is prepended). */
function firstSavedCard(page: Page): Locator {
  return page.locator('[data-testid="saved-item"]').first();
}

test.describe("E2E – Forms (happy path)", () => {
  test.beforeEach(async ({ page }) => {
    // SK: Začať každý test fresh otvorením stránky.
    // EN: Start every test fresh by opening the page.
    await gotoForms(page);
  });

  test("Full flow: fill + DnD + save -> card appears -> delete removes card", async ({ page }) => {
    // SK: Tento test reprezentuje typický tok používateľa (happy path).
    // EN: This test represents the typical happy path user journey.

    await test.step("Fill form with valid data / Vyplniť formulár validnými údajmi", async () => {
      await fillValidForm(page);
    });

    await test.step("Drag & drop ingredients / Pridať prísady do kotlíka", async () => {
      await dragMultiToCauldron(page, ["Vlások jednorožca", "Dračia šupina", "Mesačný prach"]);
    });

    await test.step("Save / Uložiť záznam", async () => {
      await saveForm(page);

      // SK: Po uložení sa má vytvoriť presne 1 karta.
      // EN: After saving, exactly one card should exist.
      await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(1);
    });

    await test.step("Verify card content / Overiť obsah karty", async () => {
      const card = firstSavedCard(page);

      // SK: Overiť, že karta obsahuje zadané hodnoty (čo vidí používateľ).
      // EN: Verify the card contains the entered values (user-visible content).
      await expect(card).toContainText("Janko Hraško");
      await expect(card).toContainText("Zlatý Grif s.r.o.");
      await expect(card).toContainText("36");
      await expect(card).toContainText("bryndzové halušky");
      await expect(card).toContainText("suncrest");
      await expect(card).toContainText("02354");
      await expect(card).toContainText("Turzovka");
      await expect(card).toContainText("janko.hrasko@kingdom.sk");
      await expect(card).toContainText("+421907098708");

      // SK: Overiť, že sa ukladať “kľúče” prísad (stabilný business detail).
      // EN: Verify that ingredient “keys” are stored (stable business detail).
      await expect(card).toContainText("unicorn-hair");
      await expect(card).toContainText("dragon-scale");
      await expect(card).toContainText("moon-dust");
    });

    await test.step("Delete card / Zmazať kartu", async () => {
      // SK: Zmazať kartu cez tlačidlo na karte.
      // EN: Delete the card via its delete button.
      await tid(page, "btn-delete-card").click();

      // SK: Po zmazaní nemá zostať žiadna uložená karta.
      // EN: After deletion, no saved cards should remain.
      await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);
    });
  });

  test("Reset clears fields and cauldron", async ({ page }) => {
    // SK: Tento test overuje, že “Vyčistiť” vráti formulár do defaultu (UX + stabilita).
    // EN: This test verifies the “Reset/Clear” returns the form to default state (UX + stability).

    await test.step("Prepare filled state / Pripraviť vyplnený stav", async () => {
      await fillValidForm(page);
      await dragMultiToCauldron(page, ["Vlások jednorožca", "Dračia šupina", "Mesačný prach"]);
    });

    await test.step("Reset / Vyčistiť formulár", async () => {
      await tid(page, "btn-reset").click();
    });

    await test.step("Verify default state / Overiť default stav", async () => {
      // SK: Overiť, že sa vyčistiť textové polia a select.
      // EN: Verify text fields and select are cleared.
      await expect(tid(page, "input-fullname")).toHaveValue("");
      await expect(tid(page, "input-age")).toHaveValue("");
      await expect(tid(page, "select-kingdom")).toHaveValue("");
      await expect(tid(page, "input-zip")).toHaveValue("");

      // SK: Overiť, že sa vrátiť PSČ chip do “Mesto: —”.
      // EN: Verify ZIP chip returns to “Mesto: —”.
      await expect(tid(page, "zip-city")).toHaveText(/mesto:\s*—/i);

      // SK: Overiť, že sa vyčistiť kotlík (počítadlo aj pills).
      // EN: Verify cauldron is cleared (counter + pills).
      await expect(tid(page, "dnd-count")).toHaveText(/0 prísad/i);
      await expect(page.locator('[data-testid="cauldron-pill"]')).toHaveCount(0);
    });
  });
});