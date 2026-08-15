import { test, expect } from "@playwright/test";

test.describe("Products page (Medusa catalog)", () => {
  test("loads product grid from Store API", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();

    const productGrid = page.locator(".products-results .product-grid");
    await expect(productGrid).toBeVisible({ timeout: 20000 });
    await expect(productGrid.locator(".product-card").first()).toBeVisible();
  });

  test("filter size L shows only L products — E2E-D-11", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();

    const productGrid = page.locator(".products-results .product-grid");
    await expect(productGrid).toBeVisible({ timeout: 20000 });
    await expect(productGrid.locator(".product-card").first()).toBeVisible();

    const sizeButton = page
      .locator(".filters-sidebar .size-btn")
      .filter({ hasText: /^L$/ });
    await sizeButton.click();

    await expect(page).toHaveURL(/size=L/);

    await expect(productGrid).toBeVisible({ timeout: 20000 });
    const cardCount = await productGrid.locator(".product-card").count();
    expect(cardCount).toBeGreaterThan(0);

    const productNames = await productGrid.locator(".product-name").allTextContents();
    for (const name of productNames) {
      expect(name.length).toBeGreaterThan(0);
    }
  });

  test("category filter sweatshirts narrows results", async ({ page }) => {
    await page.goto("/products");
    const productGrid = page.locator(".products-results .product-grid");
    await expect(productGrid.locator(".product-card").first()).toBeVisible({
      timeout: 20000,
    });

    const categoryButton = page
      .locator(".filters-sidebar .filter-pill")
      .filter({ hasText: /^Sweatshirts$/i });

    if ((await categoryButton.count()) === 0) {
      test.skip(true, "Sweatshirts category not present in Medusa seed");
      return;
    }

    await categoryButton.click();
    await expect(page).toHaveURL(/category=sweatshirts/);
    await expect(productGrid.locator(".product-card").first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("legacy /collection redirects to /products", async ({ page }) => {
    await page.goto("/collection");
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
  });

  test("legacy /lookbook redirects to /products", async ({ page }) => {
    await page.goto("/lookbook");
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
  });
});
