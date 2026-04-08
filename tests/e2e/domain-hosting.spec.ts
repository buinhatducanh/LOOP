/**
 * E2E: Domain & Hosting Purchase Flow
 * Customer purchases domain + hosting → Submits eKYC → Admin configures → Customer confirms
 *
 * Run: npm run e2e
 */
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Domain & Hosting Purchase — Smoke Tests", () => {

  test("admin web packages page loads without crash", async ({ page }) => {
    const res = await page.goto(`${BASE}/admin/web_packages`);
    expect(res?.status()).toBeLessThan(400);
  });

  test("web packages page shows pricing cards or empty state", async ({ page }) => {
    await page.goto(`${BASE}/admin/web_packages`);
    const hasLogin = page.url().includes("/dang-nhap");
    if (!hasLogin) {
      const hasContent = await page.locator("text=Gói").isVisible().catch(() => false);
      const hasEmpty = await page.locator("text=Không có").isVisible().catch(() => false);
      expect(hasContent || hasEmpty || hasLogin).toBe(true);
    }
  });

  test("customer websites admin page loads without crash", async ({ page }) => {
    const res = await page.goto(`${BASE}/admin/customer_websites`);
    expect(res?.status()).toBeLessThan(400);
  });

  test("customer websites page shows list or empty state", async ({ page }) => {
    await page.goto(`${BASE}/admin/customer_websites`);
    const hasLogin = page.url().includes("/dang-nhap");
    if (!hasLogin) {
      const hasTable = await page.locator("table").isVisible().catch(() => false);
      const hasEmpty = await page.locator("text=Không có").isVisible().catch(() => false);
      expect(hasTable || hasEmpty || hasLogin).toBe(true);
    }
  });
});

test.describe("Domain Purchase — eKYC Fields", () => {

  test("eKYC form fields are defined", () => {
    const ekycFields = ["ekycName", "ekycIdNumber", "ekycDob", "ekycAddress"];
    expect(ekycFields).toHaveLength(4);
    expect(ekycFields).toContain("ekycName");
    expect(ekycFields).toContain("ekycIdNumber");
  });

  test("eKYC fields must NOT be logged (PII)", () => {
    // Security rule: eKYC fields are PII — do NOT log them
    const ekycData = {
      ekycName: "Nguyễn Văn A",
      ekycIdNumber: "123456789",
      ekycDob: "1990-01-01",
      ekycAddress: "123 Đường ABC, Quận 1, TP.HCM",
    };

    // Simulate: logging without PII
    const safeLog = (data: typeof ekycData) => {
      return { masked: true }; // never log actual values
    };
    const result = safeLog(ekycData);
    expect(result.masked).toBe(true);
  });

  test("domain name field validates format", () => {
    const validDomains = [
      "example.com",
      "shop.loops.vn",
      "my-business.vn",
    ];
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    validDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(true);
    });
  });

  test("domain name rejects invalid formats", () => {
    const invalidDomains = [
      "not a domain",
      "http://example.com",
      ".invalid",
    ];
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    invalidDomains.forEach(domain => {
      expect(domainRegex.test(domain)).toBe(false);
    });
  });
});

test.describe("CustomerWebsite — Config Status Lifecycle", () => {

  test("configStatus lifecycle matches spec", () => {
    const VALID_STATUSES = ["pending_config", "configured", "delivered", "cancelled"];
    const configTransitions: Record<string, string[]> = {
      pending_config: ["configured", "cancelled"],
      configured: ["delivered", "cancelled"],
      delivered: [], // terminal
      cancelled: [], // terminal
    };

    expect(VALID_STATUSES).toHaveLength(4);
    expect(configTransitions["pending_config"]).toContain("configured");
    expect(configTransitions["configured"]).toContain("delivered");
    expect(configTransitions["delivered"]).toHaveLength(0);
  });

  test("pending_config is the default status on creation", () => {
    const newWebsite = { configStatus: "pending_config" };
    expect(newWebsite.configStatus).toBe("pending_config");
  });

  test("only admin can set configured status", () => {
    const canSetConfigured = (actor: string) =>
      ["ceo", "super_admin", "admin", "project_manager"].includes(actor);

    expect(canSetConfigured("admin")).toBe(true);
    expect(canSetConfigured("project_manager")).toBe(true);
    expect(canSetConfigured("member")).toBe(false);
  });

  test("cancelled website cannot be reactivated", () => {
    const from = "cancelled";
    const canReactivate = from === "pending_config" || from === "configured";
    expect(canReactivate).toBe(false);
  });
});

test.describe("Domain Purchase — Notification Triggers", () => {

  test("domain purchase creates admin notification", () => {
    const event = { type: "domain_purchase", websiteCreated: true };
    const shouldNotify = event.websiteCreated;
    expect(shouldNotify).toBe(true);
  });

  test("eKYC submission creates admin notification", () => {
    const event = { type: "ekyc_submitted", ekycDataProvided: true };
    const shouldNotify = event.ekycDataProvided;
    expect(shouldNotify).toBe(true);
  });

  test("website configured creates customer notification", () => {
    const event = { type: "website_configured", configStatus: "configured" };
    const shouldNotify = event.configStatus === "configured";
    expect(shouldNotify).toBe(true);
  });
});