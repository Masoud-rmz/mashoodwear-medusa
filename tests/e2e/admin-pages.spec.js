import { test, expect } from "@playwright/test";

test.describe("Admin pages", () => {
  test("E2E: edit How to Buy visible on public site", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Log in" }).click();

    await page.goto("/admin/pages");
    await page.getByRole("button", { name: "How to Buy" }).click();
    const marker = `E2E marker ${Date.now()}`;
    await page.locator(".admin-textarea").fill(`## Test\n\n${marker}`);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved")).toBeVisible();

    await page.goto("/how-to-buy");
    await expect(page.getByText(marker)).toBeVisible();
  });
});
