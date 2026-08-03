import { test, expect } from "@playwright/test";

test.describe("Product detail page", () => {
  test("select variants and add to cart shows toast", async ({ page }) => {
    await page.goto("/products");

    const firstCard = page.locator(".products-results .product-card").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    await expect(page.locator(".product-detail")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".add-to-cart-btn")).toBeDisabled();

    await page.locator(".product-info .size-btn").first().click();
    await page.locator(".product-info .color-swatch").first().click();

    const addButton = page.locator(".add-to-cart-btn");
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await expect(page.locator(".toast")).toContainText("Added to cart");
  });

  test("unknown product slug shows not found message", async ({ page }) => {
    await page.goto("/products/unknown-product-slug-xyz");

    await expect(page.getByText("Product not found")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Back to Products" })).toBeVisible();
  });

  test("shows suggested products below the detail", async ({ page }) => {
    await page.goto("/products");

    const firstCard = page.locator(".products-results .product-card").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    await expect(page.locator(".product-detail")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "You may also like" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator(".related-products .product-card").first()).toBeVisible();
  });
});
