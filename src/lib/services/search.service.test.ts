import { describe, it, expect, vi, beforeEach } from "vitest";
import { globalSearch } from "@/lib/services/content/search.service";

// ─── Mock Prisma ───────────────────────────────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    service: { findMany: vi.fn() },
    teamMember: { findMany: vi.fn() },
    project: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

describe("search.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("globalSearch", () => {
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
      const mockServices = [
        { id: "1", slug: "web-design", title: "Web Design", shortDescription: "Professional web design", icon: null, category: "website", startingPrice: "5000000", deliveryTime: "2 weeks" },
      ];
      mockPrisma.service.findMany.mockResolvedValue(mockServices);
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await globalSearch("web design", "vi", { maxPerCategory: 5 });

      expect(result.services).toHaveLength(1);
      expect(result.services[0].slug).toBe("web-design");
      expect(result.services[0].href).toBe("/services/web-design");
      expect(mockPrisma.service.findMany).toHaveBeenCalledTimes(1);
    });

    it("searches team members by name and role", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { id: "1", slug: "john-doe", name: "John Doe", role: "Frontend Developer", image: null, shortBio: "Expert in React", bio: null, isFeatured: true, roleLevel: 3 },
      ]);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await globalSearch("developer", "vi", { maxPerCategory: 5 });

      expect(result.team).toHaveLength(1);
      expect(result.team[0].name).toBe("John Doe");
      expect(result.team[0].href).toBe("/team/john-doe");
    });

    it("searches projects by title and client", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
      mockPrisma.project.findMany.mockResolvedValue([
        { id: "1", slug: "ecommerce-project", title: "E-Commerce Project", client: "Fashion Brand", image: null, category: "website" },
      ]);

      const result = await globalSearch("fashion", "vi", { maxPerCategory: 5 });

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].client).toBe("Fashion Brand");
      expect(result.projects[0].href).toBe("/portfolio/ecommerce-project");
    });

    it("returns correct href for team members in EN locale", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { id: "1", slug: "jane-doe", name: "Jane Doe", role: "Designer", image: null, shortBio: "UI/UX Expert", bio: null, isFeatured: false, roleLevel: 4 },
      ]);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await globalSearch("designer", "en", { maxPerCategory: 5 });

      expect(result.team[0].href).toBe("/team/jane-doe");
    });

    it("limits results per category via maxPerCategory option", async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
      mockPrisma.project.findMany.mockResolvedValue([]);

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
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
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
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await globalSearch("test", "en");

      expect(result.services[0].category).toBe("Website");
    });
  });
});
