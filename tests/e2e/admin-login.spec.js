import { test, expect } from "@playwright/test";

test.describe("Admin auth", () => {
  test("E2E-D-05: failed login shows error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Wrong username or password")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
