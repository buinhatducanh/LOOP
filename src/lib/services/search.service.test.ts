import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalSearch } from "@/lib/services/content/search.service";

// ─── Mock Prisma ───────────────────────────────────────────────────────────────
// hoisted so mocks are created once, referenced by all tests
const { mockPrisma } = vi.hoisted(() => {
  const makeFindMany = () => vi.fn<() => Promise<unknown[]>>();
  return {
    mockPrisma: {
      service: { findMany: makeFindMany() },
      teamMember: { findMany: makeFindMany() },
      project: { findMany: makeFindMany() },
      blogPost: { findMany: makeFindMany() },
      course: { findMany: makeFindMany() },
      faq: { findMany: makeFindMany() },
      testimonial: { findMany: makeFindMany() },
      instructor: { findMany: makeFindMany() },
      expertise: { findMany: makeFindMany() },
      webTemplate: { findMany: makeFindMany() },
      landingPage: { findMany: makeFindMany() },
      pricingWebPackage: { findMany: makeFindMany() },
      addonService: { findMany: makeFindMany() },
      socialPost: { findMany: makeFindMany() },
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("search.service", () => {
  // Reset all mocks to empty arrays before each test
  beforeEach(() => {
    Object.values(mockPrisma).forEach((model) => {
      (model.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    });
  });

  // ── globalSearch ─────────────────────────────────────────────────────────────

  it("returns empty results for short queries (< 2 chars)", async () => {
    const result = await globalSearch("a", "vi");
    expect(result.services).toHaveLength(0);
    expect(result.team).toHaveLength(0);
    expect(result.projects).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("returns empty results for empty query", async () => {
    const result = await globalSearch("", "vi");
    expect(result.total).toBe(0);
  });

  it("searches services by title and description", async () => {
    mockPrisma.service.findMany.mockResolvedValue([
      {
        id: "1", slug: "web-design", title: "Web Design",
        shortDescription: "Professional web design", icon: null,
        category: "website", startingPrice: "5000000", deliveryTime: "2 weeks",
      },
    ]);

    const result = await globalSearch("web design", "vi", { maxPerCategory: 5 });
    expect(result.services).toHaveLength(1);
    expect(result.services[0].slug).toBe("web-design");
    expect(result.services[0].href).toBe("/services/web-design");
  });

  it("searches team members by name and role", async () => {
    mockPrisma.teamMember.findMany.mockResolvedValue([
      {
        id: "1", slug: "john-doe", name: "John Doe",
        role: "Frontend Developer", image: null,
        shortBio: "Expert in React", bio: null,
        isFeatured: true, roleLevel: 3,
      },
    ]);

    const result = await globalSearch("developer", "vi", { maxPerCategory: 5 });
    expect(result.team).toHaveLength(1);
    expect(result.team[0].name).toBe("John Doe");
  });

  it("searches projects by title and client", async () => {
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: "1", slug: "ecommerce-project", title: "E-Commerce Project",
        client: "Fashion Brand", image: null, category: "website",
      },
    ]);

    const result = await globalSearch("fashion", "vi", { maxPerCategory: 5 });
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].client).toBe("Fashion Brand");
  });

  it("limits results per category via maxPerCategory option", async () => {
    await globalSearch("test", "vi", { maxPerCategory: 3 });
    expect(mockPrisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });

  it("calculates total correctly across all categories", async () => {
    mockPrisma.service.findMany.mockResolvedValue([
      { id: "1", slug: "s1", title: "S1", shortDescription: "", icon: null, category: "web", startingPrice: null, deliveryTime: null },
    ]);
    mockPrisma.teamMember.findMany.mockResolvedValue([
      { id: "1", slug: "m1", name: "M1", role: "Dev", image: null, shortBio: null, bio: null, isFeatured: false, roleLevel: 5 },
    ]);
    mockPrisma.project.findMany.mockResolvedValue([
      { id: "1", slug: "p1", title: "P1", client: null, image: null, category: "web" },
    ]);

    const result = await globalSearch("test", "vi");
    expect(result.total).toBe(3);
  });

  it("maps category slugs to Vietnamese labels", async () => {
    mockPrisma.service.findMany.mockResolvedValue([
      { id: "1", slug: "s1", title: "Web Design", shortDescription: "", icon: null, category: "website", startingPrice: null, deliveryTime: null },
    ]);
    mockPrisma.project.findMany.mockResolvedValue([
      { id: "1", slug: "p1", title: "Project", client: null, image: null, category: "app" },
    ]);

    const result = await globalSearch("test", "vi");
    expect(result.services[0].category).toBe("Website");
    expect(result.projects[0].category).toBe("Ứng dụng");
  });

  it("maps category slugs to English labels for EN locale", async () => {
    mockPrisma.service.findMany.mockResolvedValue([
      { id: "1", slug: "s1", title: "Web Design", shortDescription: "", icon: null, category: "website", startingPrice: null, deliveryTime: null },
    ]);

    const result = await globalSearch("test", "en");
    expect(result.services[0].category).toBe("Website");
  });
});
