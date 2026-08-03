import { test, expect } from "@playwright/test";

test.describe("Brand collections", () => {
  test("E2E-D-08: collections list shows cards with piece counts", async ({ page }) => {
    await page.goto("/collections");
    await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();

    // Medusa seed may have zero collections — CMS fallback keeps Drift when Express is up.
    const driftCard = page.locator(".collection-card").filter({ hasText: "Drift" });
    const anyCard = page.locator(".collection-card").first();

    if ((await driftCard.count()) > 0) {
      await expect(driftCard).toBeVisible();
      await expect(driftCard.getByText(/\d+ pieces?/)).toBeVisible();
    } else if ((await anyCard.count()) > 0) {
      await expect(anyCard).toBeVisible();
      await expect(anyCard.getByText(/\d+ pieces?/)).toBeVisible();
    } else {
      await expect(
        page.getByText(/No collections yet|new drops will appear/i)
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test("E2E-D-09: collection detail shows products with stock labels", async ({ page }) => {
    await page.goto("/collections");
    const driftCard = page.locator(".collection-card").filter({ hasText: "Drift" });
    const firstCard = page.locator(".collection-card").first();

    if ((await driftCard.count()) > 0) {
      await page.goto("/collections/drift");
      await expect(page.getByRole("heading", { name: "Drift" })).toBeVisible();
    } else if ((await firstCard.count()) > 0) {
      await firstCard.click();
      await expect(page.locator(".collection-detail-page")).toBeVisible();
    } else {
      test.skip(true, "No collections available from Medusa or CMS");
      return;
    }

    await expect(page.locator(".product-card").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".card-stock-label").first()).toBeVisible();
  });

  test("E2E-D-10: tap product in collection opens product detail", async ({ page }) => {
    await page.goto("/collections");
    const driftCard = page.locator(".collection-card").filter({ hasText: "Drift" });
    const firstCard = page.locator(".collection-card").first();

    if ((await driftCard.count()) > 0) {
      await page.goto("/collections/drift");
    } else if ((await firstCard.count()) > 0) {
      await firstCard.click();
    } else {
      test.skip(true, "No collections available from Medusa or CMS");
      return;
    }

    const firstProduct = page.locator(".product-card").first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\/.+/);
    await expect(page.locator(".product-detail-page")).toBeVisible();
  });
});
