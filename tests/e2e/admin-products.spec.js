import { test, expect } from "@playwright/test";

async function adminLogin(page) {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("Admin products", () => {
  test("E2E-D-02: add product visible on site", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/products/new");
    const uniqueName = `E2E Tee ${Date.now()}`;
    await page.getByLabel("Name").fill(uniqueName);
    await page.getByLabel("Price (Toman)").fill("990000");
    await page.locator('select').first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    await page.goto("/products");
    await expect(page.getByText(uniqueName)).toBeVisible();
  });
});
