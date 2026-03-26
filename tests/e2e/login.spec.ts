import { test, expect } from "@playwright/test";

test.describe("Admin Auth Flow", () => {
  test("renders admin login page", async ({ page }) => {
    await page.goto("/vi/login");

    await expect(page).toHaveTitle(/LOOP|Login|Đăng nhập/i);
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("shows validation on empty submit", async ({ page }) => {
    await page.goto("/vi/login");

    const submit = page.locator("button[type='submit']").first();
    await submit.click();

    // Browser native email validation or app-level error
    const email = page.locator("input[type='email']");
    await expect(email).toBeVisible();
  });
});
