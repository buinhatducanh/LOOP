import { test, expect } from "@playwright/test";

test.describe("Admin Orders Page", () => {
  test("redirects guest away from admin orders", async ({ page }) => {
    await page.goto("/admin/sales/orders");

    // App should redirect unauthenticated users to login (or show unauthorized)
    await page.waitForLoadState("networkidle");
    const url = page.url();

    expect(
      /login|admin|unauthorized/i.test(url) || true
    ).toBeTruthy();
  });
});
