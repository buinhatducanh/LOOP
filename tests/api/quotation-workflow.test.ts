/**
 * Integration tests: Quotation Workflow
 * Tests QuoteRequest + Quote + SalesLead wiring (2026-04-08)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mock Prisma ────────────────────────────────────────────────────────────────

const mockPrisma = {
  siteSetting: { findUnique: vi.fn() },
  servicePackage: { findMany: vi.fn() },
  serviceAttribute: { findMany: vi.fn() },
  addonService: { findMany: vi.fn() },
  infrastructureTier: { findMany: vi.fn() },
  pricingHostingPlan: { findMany: vi.fn() },
  pricingDomainPrice: { findMany: vi.fn() },
  clientVipStatus: { findUnique: vi.fn(), create: vi.fn() },
  quoteRequest: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  salesLead: { findFirst: vi.fn(), create: vi.fn() },
  quote: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth/permissions", () => ({
  requirePermission: vi.fn().mockResolvedValue({ userId: "admin_1" }),
}));
vi.mock("@/lib/auth/audit", () => ({
  createAuditLog: vi.fn(),
}));
vi.mock("@/lib/pricing/calculate-order-price", () => ({
  calculateOrderPrice: vi.fn().mockResolvedValue({ totalXp: 0, rewardLevel: 1 }),
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.siteSetting.findUnique.mockResolvedValue(null);
  mockPrisma.servicePackage.findMany.mockResolvedValue([]);
  mockPrisma.serviceAttribute.findMany.mockResolvedValue([]);
  mockPrisma.addonService.findMany.mockResolvedValue([]);
  mockPrisma.infrastructureTier.findMany.mockResolvedValue([]);
  mockPrisma.pricingHostingPlan.findMany.mockResolvedValue([]);
  mockPrisma.pricingDomainPrice.findMany.mockResolvedValue([]);
  mockPrisma.clientVipStatus.findUnique.mockResolvedValue(null);
  mockPrisma.clientVipStatus.create.mockResolvedValue({ userEmail: "qa@example.com", tier: "regular" });
  mockPrisma.quoteRequest.findUnique.mockResolvedValue(null);
  mockPrisma.quoteRequest.create.mockResolvedValue(null);
  mockPrisma.quoteRequest.update.mockResolvedValue(null);
  mockPrisma.salesLead.findFirst.mockResolvedValue(null);
  mockPrisma.salesLead.create.mockResolvedValue(null);
  mockPrisma.quote.create.mockResolvedValue(null);
});

// ─── VAT Config ───────────────────────────────────────────────────────────────

describe("GET /api/pricing/config — vatRate", () => {

  it("defaults to vatRate 0.10 when SiteSetting has no vat_rate key", async () => {
    const { GET } = await import("@/app/api/pricing/config/route");
    const req = new NextRequest("http://localhost:3000/api/pricing/config?lang=vi");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(typeof json.data?.vatRate).toBe("number");
    expect(json.data?.vatRate).toBeCloseTo(0.10);
  });

  it("returns vatRate 0.08 when SiteSetting contains vat_rate=0.08", async () => {
    mockPrisma.siteSetting.findUnique.mockResolvedValue({
      key: "vat_rate",
      value: "0.08",
    });
    const { GET } = await import("@/app/api/pricing/config/route");
    const req = new NextRequest("http://localhost:3000/api/pricing/config?lang=vi");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data?.vatRate).toBeCloseTo(0.08);
  });
});

// ─── QuoteRequest creation ───────────────────────────────────────────────────

describe("POST /api/pricing/quote — QuoteRequest creation", () => {

  it("creates QuoteRequest with status=new", async () => {
    mockPrisma.quoteRequest.create.mockResolvedValue({
      id: "qr_test_001",
      customerName: "Nguyễn Văn QA",
      customerEmail: "qa@example.com",
      selectedItems: [
        { featureId: "web", featureName: "Website", variantId: "business", variantName: "Business", price: 15000000 },
      ],
      totalAmount: 16500000,
      lpUsed: 0,
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { POST } = await import("@/app/api/pricing/quote/route");
    const req = new NextRequest("http://localhost:3000/api/pricing/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Nguyễn Văn QA",
        customerEmail: "qa@example.com",
        selectedItems: [
          { featureId: "web", featureName: "Website", variantId: "business", variantName: "Business", price: 15000000 },
        ],
        totalAmount: 16500000,
        lpUsed: 0,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data?.id).toBe("qr_test_001");
    expect(json.data?.status).toBe("new");
  });
});

// ─── Quote creation from QuoteRequest ───────────────────────────────────────

describe("POST /api/admin/quotes — QuoteRequest wiring", () => {

  it("auto-creates SalesLead when quoteRequestId provided without salesLeadId", async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue({
      id: "qr_001",
      customerName: "Khách Auto Lead",
      customerEmail: "auto@example.com",
      customerPhone: "0909001001",
      companyName: "Công Ty Auto Lead",
      selectedItems: [
        { featureId: "app", featureName: "App SaaS", variantId: "enterprise", price: 80000000 },
      ],
    });
    mockPrisma.salesLead.findFirst.mockResolvedValue(null);
    mockPrisma.salesLead.create.mockResolvedValue({ id: "sl_new_001" });
    mockPrisma.quote.create.mockResolvedValue({
      id: "q_001",
      salesLeadId: "sl_new_001",
      quoteRequestId: "qr_001",
      quoteNumber: "QT-TEST-001",
      title: "Báo giá Auto",
      totalAmount: 88000000,
      selectedFeatureIds: ["app"],
      status: "draft",
      salesLead: { id: "sl_new_001", customerName: "Khách Auto Lead", customerEmail: "auto@example.com" },
    });

    const { POST } = await import("@/app/api/admin/quotes/route");
    const req = new NextRequest("http://localhost:3000/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteRequestId: "qr_001",
        quoteNumber: "QT-TEST-001",
        title: "Báo giá Auto",
        totalAmount: 88000000,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data?.salesLeadId).toBe("sl_new_001");
    expect(json.data?.quoteRequestId).toBe("qr_001");
    expect(mockPrisma.salesLead.create).toHaveBeenCalled();
    expect(mockPrisma.salesLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ customerName: "Khách Auto Lead" }),
    });
  });

  it("reuses existing SalesLead if found by customerEmail", async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue({
      id: "qr_002",
      customerName: "Khách Cũ",
      customerEmail: "existing@example.com",
      selectedItems: [],
    });
    mockPrisma.salesLead.findFirst.mockResolvedValue({ id: "sl_existing_001" });
    mockPrisma.quote.create.mockResolvedValue({
      id: "q_002",
      salesLeadId: "sl_existing_001",
      quoteRequestId: "qr_002",
      quoteNumber: "QT-TEST-002",
      title: "Báo giá Cũ",
      totalAmount: 15000000,
      status: "draft",
    });

    const { POST } = await import("@/app/api/admin/quotes/route");
    const req = new NextRequest("http://localhost:3000/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteRequestId: "qr_002",
        quoteNumber: "QT-TEST-002",
        title: "Báo giá Cũ",
        totalAmount: 15000000,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data?.salesLeadId).toBe("sl_existing_001");
    expect(mockPrisma.salesLead.create).not.toHaveBeenCalled();
  });

  it("updates QuoteRequest.status to quoted after creating Quote", async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue({
      id: "qr_003",
      customerName: "Khách Status",
      customerEmail: "status@example.com",
      selectedItems: [],
    });
    mockPrisma.salesLead.findFirst.mockResolvedValue({ id: "sl_003" });
    mockPrisma.salesLead.create.mockResolvedValue({ id: "sl_003" });
    mockPrisma.quote.create.mockResolvedValue({
      id: "q_003",
      salesLeadId: "sl_003",
      quoteRequestId: "qr_003",
      quoteNumber: "QT-TEST-003",
      title: "Báo giá Status",
      totalAmount: 15000000,
      status: "draft",
    });

    const { POST } = await import("@/app/api/admin/quotes/route");
    const req = new NextRequest("http://localhost:3000/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteRequestId: "qr_003",
        quoteNumber: "QT-TEST-003",
        title: "Báo giá Status",
        totalAmount: 15000000,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockPrisma.quoteRequest.update).toHaveBeenCalledWith({
      where: { id: "qr_003" },
      data: { status: "quoted" },
    });
  });

  it("extracts selectedFeatureIds from QuoteRequest.selectedItems JSON", async () => {
    mockPrisma.quoteRequest.findUnique.mockResolvedValue({
      id: "qr_004",
      customerName: "Khách Feature",
      customerEmail: "feature@example.com",
      selectedItems: [
        { featureId: "web", featureName: "Website", variantId: "business", price: 15000000 },
        { featureId: "feat_lang", featureName: "Đa ngôn ngữ", variantId: "", price: 500000 },
        { featureId: "feat_cart", featureName: "Giỏ hàng", variantId: "", price: 2000000 },
      ],
    });
    mockPrisma.salesLead.findFirst.mockResolvedValue({ id: "sl_004" });
    mockPrisma.salesLead.create.mockResolvedValue({ id: "sl_004" });
    mockPrisma.quote.create.mockResolvedValue({
      id: "q_004",
      salesLeadId: "sl_004",
      quoteRequestId: "qr_004",
      quoteNumber: "QT-TEST-004",
      title: "Báo giá Feature",
      totalAmount: 17500000,
      selectedFeatureIds: ["web", "feat_lang", "feat_cart"],
      status: "draft",
    });

    const { POST } = await import("@/app/api/admin/quotes/route");
    const req = new NextRequest("http://localhost:3000/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteRequestId: "qr_004",
        quoteNumber: "QT-TEST-004",
        title: "Báo giá Feature",
        totalAmount: 17500000,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data?.selectedFeatureIds).toBeDefined();
    expect(Array.isArray(json.data?.selectedFeatureIds)).toBe(true);
    expect(json.data?.selectedFeatureIds.sort()).toEqual(["feat_cart", "feat_lang", "web"].sort());
  });

  it("returns 400 when neither salesLeadId nor quoteRequestId provided", async () => {
    const { POST } = await import("@/app/api/admin/quotes/route");
    const req = new NextRequest("http://localhost:3000/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteNumber: "QT-TEST-005",
        title: "Test Fail",
        totalAmount: 1000000,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("salesLeadId");
  });

  it("LP allocation sum validation rejects 90% (must be 0 or 100)", async () => {
    mockPrisma.salesLead.findFirst.mockResolvedValue({ id: "sl_test" });

    const { POST } = await import("@/app/api/admin/quotes/route");
    const req = new NextRequest("http://localhost:3000/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salesLeadId: "sl_test",
        quoteNumber: "QT-TEST-006",
        title: "LP Test",
        totalAmount: 1000000,
        lpAllocation: { pm: 30, dev: 30, qa: 30 },
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("100%");
  });
});
