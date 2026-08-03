import { test, expect } from "@playwright/test";



test.describe("Checkout", () => {

  test("E2E-D-04: empty cart checkout blocked", async ({ page }) => {

    await page.goto("/checkout");

    await expect(page.getByText(/سبد خرید خالی/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /ادامه به پرداخت/i })).toHaveCount(0);

  });



  test("E2E-D-01: cart to checkout shows Iran address step", async ({ page }) => {

    await page.goto("/products");

    const firstProduct = page.locator("a[href^='/products/']").first();

    await firstProduct.click();



    const sizeBtn = page.getByRole("button", { name: /^[A-Z0-9]+$/ }).first();

    if (await sizeBtn.isVisible().catch(() => false)) {

      await sizeBtn.click();

    }

    const addBtn = page.getByRole("button", { name: /add to cart/i });

    await addBtn.click();

    await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 15000 });



    await page.goto("/cart");

    await page.getByRole("link", { name: /checkout|تسویه|continue/i }).click();

    await expect(page).toHaveURL(/\/checkout$/);

    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    await expect(page.getByText(/آدرس ارسال/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /تأیید آدرس/i })).toBeVisible();

  });



  test("E2E-D-05: payment route exists after checkout path", async ({ page }) => {

    await page.goto("/checkout/payment");

    await expect(page.getByRole("heading", { name: /پرداخت/i })).toBeVisible();

  });



  test("E2E-D-06: order result pending without gateway params", async ({ page }) => {

    await page.goto("/order/result");

    await expect(page.getByText(/در انتظار|تأیید/i)).toBeVisible();

  });

});


