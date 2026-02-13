import { test, expect } from "@playwright/test";
import { expectNavActive } from "../_support/helpers";

/**
 * SMOKE TESTS – HOME PAGE
 * ========================
 *
 * SK:
 * Smoke testy pre Home stránku overujú kritickú vstupnú bránu aplikácie.
 * Home je prvý kontakt používateľa s produktom, preto musí:
 * - korektne načítať obsah
 * - zobrazovať hlavnú hodnotu aplikácie (hero sekcia)
 * - mať funkčnú navigáciu
 * - umožniť používateľovi pokračovať ďalej (CTA tlačidlo)
 *
 * Tento test chráni pred regresiami ako:
 * - rozbitý routing
 * - chýbajúce hlavné sekcie
 * - nefunkčné navigačné odkazy
 *
 * EN:
 * Smoke tests for the Home page verify the critical entry point of the application.
 * Home is the first user touchpoint and must:
 * - load correctly
 * - display the main value proposition (hero section)
 * - provide working navigation
 * - allow users to continue via CTA
 *
 * These tests protect against regressions such as:
 * - broken routing
 * - missing core sections
 * - non-functional navigation links
 */

test.describe("SMOKE - Home", () => {

  test("Home loads and has hero title", async ({ page }) => {
    /**
     * SK:
     * Účel testu:
     * Overiť, že Home stránka sa načíta bez chyby
     * a obsahuje všetky kľúčové vizuálne a funkčné prvky.
     *
     * Biznis hodnota:
     * Ak tento test zlyhá, aplikácia je pre používateľa
     * prakticky nepoužiteľná.
     *
     * EN:
     * Purpose:
     * Verify that the Home page loads successfully
     * and contains all key visual and functional elements.
     *
     * Business impact:
     * If this test fails, the application is effectively unusable
     * for end users.
     */

    await page.goto("index.html");

    // SK: Overenie správnej URL – kontrola routingu.
    // EN: Verify correct URL – routing validation.
    await expect(page).toHaveURL(/index\.html$/);

    // SK: Overenie HTML <title> – dôležité pre SEO a správne označenie stránky.
    // EN: Verify HTML <title> – important for SEO and page identity.
    await expect(page).toHaveTitle(/Vitajte/i);

    // SK: Hlavná kotva stránky – ak nie je viditeľná, stránka sa nenačítala správne.
    // EN: Page anchor – if not visible, page did not render properly.
    await expect(page.getByTestId("page-home")).toBeVisible();

    // SK: Hero nadpis musí obsahovať hlavnú výzvu používateľovi.
    // EN: Hero title must communicate the main user call-to-action.
    await expect(page.getByTestId("page-title"))
      .toHaveText(/Vitajte, začnite testovať/i);

    // SK: Navigačný panel musí byť prítomný (globálna navigácia).
    // EN: Navigation bar must be present (global navigation).
    await expect(page.getByTestId("nav")).toBeVisible();

    // SK: Overenie, že Home je správne označený ako aktívny v navigácii.
    // EN: Verify Home is correctly marked as active in navigation.
    await expectNavActive(page, "nav-home");

    // SK: Footer musí byť viditeľný – kontrola kompletného layoutu.
    // EN: Footer must be visible – layout completeness check.
    await expect(page.getByTestId("footer")).toBeVisible();
  });


  test("Home CTA -> Dragon works", async ({ page }) => {
    /**
     * SK:
     * Účel testu:
     * Overiť, že hlavné CTA tlačidlo presmeruje používateľa
     * na funkčnú podstránku (Dragon).
     *
     * Biznis význam:
     * CTA je konverzný prvok – ak nefunguje,
     * používateľ sa nedostane do jadra aplikácie.
     *
     * EN:
     * Purpose:
     * Verify that the main CTA button correctly redirects
     * the user to a functional subpage (Dragon).
     *
     * Business importance:
     * CTA is a conversion element – if it fails,
     * the user cannot proceed to core functionality.
     */

    await page.goto("index.html");

    // SK: Kontrola, že sme skutočne na Home.
    // EN: Ensure we are on the Home page.
    await expect(page).toHaveURL(/index\.html$/);

    // SK: Klik na hlavné CTA tlačidlo.
    // EN: Click main CTA button.
    await page.getByTestId("cta-dragon").click();

    // SK: Očakávame presmerovanie na Dragon stránku.
    // EN: Expect navigation to Dragon page.
    await expect(page).toHaveURL(/dragon\.html$/);

    // SK: Overenie, že cieľová stránka sa načítala.
    // EN: Verify target page loaded.
    await expect(page.getByTestId("page-dragon")).toBeVisible();

    // SK: Navigácia musí označiť Dragon ako aktívny.
    // EN: Navigation must highlight Dragon as active.
    await expectNavActive(page, "nav-dragon");

    // SK: Overenie nadpisu (robustné voči miernym textovým zmenám).
    // EN: Title verification (robust against minor text changes).
    await expect(page.getByTestId("page-title"))
      .toHaveText(/drak|drac/i);
  });

});

