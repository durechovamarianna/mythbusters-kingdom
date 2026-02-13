import { test, expect, Page } from "@playwright/test";

/**
 * SMOKE – Rozprávkové formuláre
 * =============================
 *
 * SK:
 * Tento smoke balík overuje, že „Forms“ stránka je použiteľná ako základný používateľský flow.
 * Je to rýchla kontrola, či sa dá:
 * - stránka otvoriť a zobraziť hlavné bloky (formulár + uložené záznamy),
 * - overiť mapovanie PSČ → mesto (biznis pravidlo),
 * - zablokovať uloženie pri nevyplnených povinných poliach (kvalita dát),
 * - použiť drag & drop (UI interakcia) a vidieť výsledok v kotlíku (stav aplikácie).
 *
 * Biznis dopad pri páde:
 * - Používateľ nevie vyplniť alebo uložiť formulár → dáta sú nekompletné alebo nesprávne.
 * - Nejde drag & drop → kľúčová UX funkcionalita prestane fungovať.
 * - PSČ nezobrazuje mesto → zlyhá základná pomoc používateľovi pri vypĺňaní.
 *
 * EN:
 * This smoke suite verifies that the “Forms” page is usable for the basic end-user flow.
 * It quickly checks that users can:
 * - open the page and see the main blocks (form + saved records),
 * - verify ZIP → City mapping (business rule),
 * - prevent saving when required fields are missing (data quality),
 * - use drag & drop and see the cauldron state update (core UI interaction).
 *
 * Business impact if failing:
 * - Users cannot submit valid records → incomplete/invalid data.
 * - Drag & drop breaks → key UX functionality is unavailable.
 * - ZIP mapping fails → user guidance and validation logic degrade.
 */

function tid(page: Page, id: string) {
  // SK: Pomocná funkcia – stabilný spôsob ako vyhľadávať prvky cez data-testid.
  // EN: Helper – stable way to locate elements via data-testid.
  return page.getByTestId(id);
}

async function gotoForms(page: Page) {
  /**
   * SK: Jednotný vstup do Forms stránky pre všetky testy.
   *     Znižuje duplicitu a zároveň hneď overí, že stránka „naozaj žije“ (anchor prvok).
   * EN: Single entry point for all tests.
   *     Reduces duplication and verifies the page is actually rendered (anchor element).
   */
  await page.goto("forms.html");
  await expect(tid(page, "page-forms")).toBeVisible();
}

async function selectIngredientsAndDrop(page: Page, itemLabelsToSelect: string[]) {
  /**
   * SK: Simuluje reálny používateľský scenár:
   *     používateľ klikom vyberie viac položiek a následne pretiahne jednu z nich do cieľa.
   *     Očakávanie: prenesú sa všetky vybraté položky (multi-select behavior).
   *
   * EN: Simulates real user behavior:
   *     user multi-selects items by clicking and then drags one selected item to the target.
   *     Expectation: all selected items are transferred (multi-select behavior).
   */
  const source = tid(page, "dnd-source");
  const target = tid(page, "dnd-target");

  // SK: Multi-select prísad klikom.
  // EN: Multi-select ingredients via clicks.
  for (const label of itemLabelsToSelect) {
    await source.getByText(label).click();
  }

  // SK: Drag jednej z vybratých položiek do kotlíka.
  // EN: Drag one of the selected items into the cauldron.
  const first = source.getByText(itemLabelsToSelect[0]);
  await first.dragTo(target);
}

test.describe("SMOKE – Forms", () => {
  test.beforeEach(async ({ page }) => {
    // SK: Pred každým testom otvoríme Forms stránku v čistom stave.
    // EN: Before each test we open the Forms page in a clean state.
    await gotoForms(page);
  });

  test("Page loads and main blocks are visible", async ({ page }) => {
    /**
     * SK:
     * Účel: Overiť, že stránka sa načíta a základná štruktúra UI existuje.
     * Toto je „najlacnejší“ test, ktorý hneď zachytí:
     * - rozbitý import app.js / styles,
     * - zmenené alebo chýbajúce testId selektory,
     * - rozbitý layout (formulár/uložené záznamy/chýbajú tlačidlá).
     *
     * EN:
     * Purpose: Verify the page loads and the basic UI structure is present.
     * This is the cheapest test that catches:
     * - broken app.js / styles import,
     * - missing/renamed testId selectors,
     * - broken layout (form/saved records/buttons missing).
     */

    // SK: Nadpis stránky – signalizuje správny obsah a že sa načítala správna stránka.
    // EN: Page title – confirms correct content and that we opened the right page.
    await expect(tid(page, "page-title")).toHaveText(/rozprávkové formuláre/i);

    // SK: Formulár musí byť viditeľný.
    // EN: Form card must be visible.
    await expect(tid(page, "form-card")).toBeVisible();

    // SK: Panel uložených záznamov musí byť viditeľný.
    // EN: Saved records panel must be visible.
    await expect(tid(page, "saved-card")).toBeVisible();

    // SK: Primárne akcie musia byť dostupné.
    // EN: Primary actions must be available.
    await expect(tid(page, "btn-save")).toBeVisible();
    await expect(tid(page, "btn-reset")).toBeVisible();
  });

  test("ZIP shows city for known postal code (02354 -> Turzovka)", async ({ page }) => {
    /**
     * SK:
     * Účel: Overiť biznis pravidlo mapovania PSČ → mesto.
     * Toto je funkcia, ktorá používateľovi pomáha vyplniť adresu správne
     * a zároveň naznačuje, že validácie pracujú s „mapou“ hodnôt.
     *
     * EN:
     * Purpose: Verify the business rule ZIP → City mapping.
     * This helps users fill the address correctly and confirms
     * the validations use a known mapping dataset.
     */

    const zip = tid(page, "input-zip");
    const chip = tid(page, "zip-city");

    // SK: Zadáme známe PSČ (testovacia hodnota).
    // EN: Enter a known ZIP code (test value).
    await zip.fill("02354");

    // SK: Očakávame, že UI doplní mesto „Turzovka“.
    // EN: Expect UI to show the city “Turzovka”.
    await expect(chip).toHaveText(/turzovka/i);
  });

  test("Save blocked when required fields empty (shows error + highlights)", async ({ page }) => {
    /**
     * SK:
     * Účel: Overiť minimálnu ochranu kvality dát.
     * Používateľ nesmie vedieť uložiť záznam bez povinných údajov.
     *
     * Čo je dôležité pre biznis:
     * - zabránime nekompletným záznamom,
     * - používateľ dostane jasnú spätnú väzbu (globálna chyba + zvýraznené pole),
     * - prvé povinné pole (meno) je validované a chyby sú viditeľné.
     *
     * EN:
     * Purpose: Verify minimal data-quality protection.
     * Users must not be able to save a record without required fields.
     *
     * Business relevance:
     * - prevents incomplete records,
     * - provides clear feedback (global error + field highlight),
     * - ensures required “name” field validation and visible error messaging.
     */

    // SK: Klik na Uložiť bez vyplnenia – simulácia bežnej chyby používateľa.
    // EN: Click Save without filling anything – simulate a common user mistake.
    await tid(page, "btn-save").click();

    // SK: Globálny error box musí byť viditeľný (vysvetľuje, prečo sa nedá uložiť).
    // EN: Global error box must be visible (explains why saving is blocked).
    await expect(tid(page, "form-error")).toBeVisible();

    // SK: Minimálne prvé povinné pole musí byť označené ako invalid.
    // EN: At least the first required field must be marked invalid.
    const fullName = tid(page, "input-fullname");
    await expect(fullName).toHaveClass(/is-invalid/);

    // SK: Text chyby pri konkrétnom poli musí byť viditeľný (field-level feedback).
    // EN: Field-level error message must be visible (actionable feedback).
    await expect(tid(page, "err-fullname")).toBeVisible();
  });

  test("Drag & Drop moves selected ingredients into cauldron", async ({ page }) => {
    /**
     * SK:
     * Účel: Overiť, že drag & drop je funkčný a podporuje multi-select scenár.
     * Je to UX funkcia – používateľ očakáva, že môže naraz „presunúť viac vecí“.
     *
     * Overujeme 2 veci:
     * 1) textový indikátor počtu (dnd-count) – stav aplikácie je správny,
     * 2) počet vizuálnych „pill“ prvkov – UI reprezentácia obsahu kotlíka.
     *
     * EN:
     * Purpose: Verify drag & drop works and supports the multi-select scenario.
     * This is a UX feature – users expect to move multiple items at once.
     *
     * We validate two things:
     * 1) count indicator (dnd-count) – correct application state,
     * 2) number of pill items – UI representation of cauldron content.
     */

    // SK: Vyberieme 2 prísady a presunieme ich do kotlíka jedným ťahom.
    // EN: Select 2 ingredients and move them into the cauldron in one drag action.
    await selectIngredientsAndDrop(page, ["Vlások jednorožca", "Dračia šupina"]);

    // SK: Počet v kotlíku sa musí aktualizovať na 2.
    // EN: Cauldron count must update to 2.
    await expect(tid(page, "dnd-count")).toHaveText(/2 prísad/i);

    // SK: UI musí zobraziť 2 „pill“ elementy (každá prísada = 1 pill).
    // EN: UI must show 2 pill elements (one per ingredient).
    const pills = page.locator('[data-testid="cauldron-pill"]');
    await expect(pills).toHaveCount(2);
  });
});
