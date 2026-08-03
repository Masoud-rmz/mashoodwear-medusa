import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("shows header, hero, new arrivals, and footer", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("link", { name: "Mashoodwear home" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("STREETS");
    await expect(page.getByRole("link", { name: "View Products" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Order on Instagram" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "New Arrivals" })).toBeVisible();

    const productGrid = page.locator(".new-arrivals .product-grid");
    await expect(productGrid).toBeVisible({ timeout: 15000 });
    await expect(productGrid.locator(".product-card").first()).toBeVisible();

    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByText("Shop")).toBeVisible();
    await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible();
  });
});
