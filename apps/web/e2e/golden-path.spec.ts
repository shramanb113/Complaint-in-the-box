import { test, expect } from "@playwright/test";

/**
 * One path, run for both languages (spec §8): pick a situation, fill the form, submit, land on the
 * packet page, and see the letter. English uses the picker; Hindi sets the cookie directly (the picker
 * itself is exercised by the English run, keeping this file to one interaction path per spec).
 *
 * Field labels are read from apps/web/src/lib/i18n/messages/intake.ts (not guessed): the ecommerce
 * platform is a chip radiogroup ("Flipkart", untranslated per ruling R13 — same text in both
 * languages), the order field is labelled "Order ID" / "ऑर्डर आईडी" (not "order number"), and a
 * "Date you paid" / "भुगतान की तारीख़" field is required. ecom_wrong_item also shows an optional
 * "Date it arrived" field, so date selectors must be specific enough not to match both.
 */
test.describe("golden path: complaint to packet", () => {
  test("English: e-commerce wrong item", async ({ page }) => {
    await page.goto("/new/ecommerce?template=ecom_wrong_item");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByText("Flipkart", { exact: true }).click();
    await page.getByLabel(/order id/i).fill("TEST-12345");
    await page.getByLabel(/amount you paid/i).fill("999");
    await page.getByLabel(/date you paid/i).fill("2025-01-15");
    await page.getByLabel(/what happened/i).fill("The item delivered does not match what I ordered.");
    await page.getByRole("button", { name: /make my letter/i }).click();
    await expect(page).toHaveURL(/\/packet\/[0-9A-HJKMNP-TV-Z]{26}/);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await expect(page.getByRole("tab", { name: "WhatsApp" })).toBeVisible();
    await expect(page.getByText(/TEST-12345/).first()).toBeVisible();
  });

  test("Hindi: e-commerce wrong item", async ({ page, context }) => {
    await context.addCookies([{ name: "np_lang", value: "hi", url: "http://127.0.0.1:3458" }]);
    await page.goto("/new/ecommerce?template=ecom_wrong_item");
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await page.getByText("Flipkart", { exact: true }).click();
    await page.getByLabel("ऑर्डर आईडी").fill("TEST-67890");
    await page.getByLabel(/राशि/).fill("999");
    await page.getByLabel("भुगतान की तारीख़").fill("2025-01-15");
    await page.getByLabel(/क्या हुआ/).fill("जो सामान आया वह ऑर्डर से मेल नहीं खाता।");
    await page.getByRole("button", { name: /मेरा पत्र बनाएँ/ }).click();
    await expect(page).toHaveURL(/\/packet\/[0-9A-HJKMNP-TV-Z]{26}/);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await expect(page.getByText(/TEST-67890/).first()).toBeVisible();
  });
});
