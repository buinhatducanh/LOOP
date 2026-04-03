/**
 * i18n Smoke Tests — LOOP Solutions
 * Tests locale routing and translation infrastructure.
 *
 * Run: npx vitest run tests/i18n/smoke.test.ts
 */

import { describe, it, expect } from "vitest";
import { routing } from "../../src/i18n/routing";

describe("i18n routing config", () => {
  it("should have all 5 locales", () => {
    expect(routing.locales).toContain("vi");
    expect(routing.locales).toContain("en");
    expect(routing.locales).toContain("ja");
    expect(routing.locales).toContain("ko");
    expect(routing.locales).toContain("zh");
    expect(routing.locales.length).toBe(5);
  });

  it("should have VI as default locale", () => {
    expect(routing.defaultLocale).toBe("vi");
  });

  it("should require locale prefix always", () => {
    expect(routing.localePrefix).toBe("always");
  });

  it("should export Locale type", () => {
    type Locale = (typeof routing.locales)[number];
    const loc: Locale = "vi";
    expect(loc).toBe("vi");
  });
});

describe("message file structure", () => {
  it("should have matching key namespaces in VI and EN", async () => {
    const [vi, en] = await Promise.all([
      import("../../src/i18n/messages/vi.json"),
      import("../../src/i18n/messages/en.json"),
    ]);

    const viKeys = Object.keys(vi.default).sort();
    const enKeys = Object.keys(en.default).sort();

    expect(viKeys).toEqual(enKeys);
  });

  it("should have all required namespace keys", async () => {
    const vi = await import("../../src/i18n/messages/vi.json");
    const namespaces = Object.keys(vi.default);

    const required = ["nav", "home", "services", "portfolio", "blog", "team", "about", "contact", "common", "errors", "footer"];
    for (const ns of required) {
      expect(namespaces).toContain(ns);
    }
  });

  it("should have seo, auth, and localeSwitcher namespaces", async () => {
    const vi = await import("../../src/i18n/messages/vi.json");
    const namespaces = Object.keys(vi.default);

    expect(namespaces).toContain("seo");
    expect(namespaces).toContain("auth");
    expect(namespaces).toContain("localeSwitcher");
  });
});

describe("middleware routing logic", () => {
  const LOCALE_PREFIXES = routing.locales as unknown as string[];

  it("should recognize valid locale prefixes", () => {
    expect(LOCALE_PREFIXES.includes("vi")).toBe(true);
    expect(LOCALE_PREFIXES.includes("en")).toBe(true);
  });

  it("should reject invalid locale prefixes", () => {
    expect(LOCALE_PREFIXES.includes("fr")).toBe(false);
    expect(LOCALE_PREFIXES.includes("de")).toBe(false);
    expect(LOCALE_PREFIXES.includes("zh")).toBe(false);
  });

  it("should have default locale as VI", () => {
    expect(routing.defaultLocale).toBe("vi");
  });
});
