/**
 * Search Service — Business logic for global site search.
 *
 * Searches across services, team members, and projects
 * with proper type safety and consistent result shape.
 */

import { prisma } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SearchResult {
  services: ServiceResult[];
  team: TeamResult[];
  projects: ProjectResult[];
  total: number;
}

export interface ServiceResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon?: string | null;
  category: string;
  price?: string | null;
  deliveryTime?: string | null;
  href: string;
}

export interface TeamResult {
  id: string;
  slug: string;
  name: string;
  role: string;
  image?: string | null;
  description?: string | null;
  href: string;
}

export interface ProjectResult {
  id: string;
  slug: string;
  title: string;
  client?: string | null;
  image?: string | null;
  category: string;
  href: string;
}

// ─── Category label maps ───────────────────────────────────────────────────────

const SERVICE_CATEGORIES_VI: Record<string, string> = {
  website: "Website",
  app: "Ứng dụng",
  marketing: "Marketing",
  branding: "Thương hiệu",
};

const SERVICE_CATEGORIES_EN: Record<string, string> = {
  website: "Website",
  app: "App",
  marketing: "Marketing",
  branding: "Branding",
};

// ─── Main search function ─────────────────────────────────────────────────────

export async function globalSearch(
  query: string,
  locale: string = "vi",
  options: { maxPerCategory?: number } = {}
): Promise<SearchResult> {
  const { maxPerCategory = 5 } = options;

  if (!query || query.trim().length < 2) {
    return { services: [], team: [], projects: [], total: 0 };
  }

  const categoryMap = locale === "vi" ? SERVICE_CATEGORIES_VI : SERVICE_CATEGORIES_EN;

  const [services, teamMembers, projects] = await Promise.all([
    // ── Services ────────────────────────────────────────────────────
    prisma.service.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        icon: true,
        category: true,
        startingPrice: true,
        deliveryTime: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Team Members ──────────────────────────────────────────────
    prisma.teamMember.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { role: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { shortBio: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        role: true,
        image: true,
        shortBio: true,
        bio: true,
        isFeatured: true,
        roleLevel: true,
      },
      take: maxPerCategory,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    }),

    // ── Projects ──────────────────────────────────────────────────
    prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { client: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
        isPublished: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        client: true,
        image: true,
        category: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.shortDescription ?? "",
      icon: s.icon,
      category: categoryMap[s.category] ?? s.category,
      price: String(s.startingPrice),
      deliveryTime: s.deliveryTime,
      href: `/services/${s.slug}`,
    })),
    team: teamMembers.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      role: m.role,
      image: m.image,
      description: m.shortBio || m.bio,
      href: `/team/${m.slug}`,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      client: p.client,
      image: p.image,
      category: categoryMap[p.category] ?? p.category,
      href: `/portfolio/${p.slug}`,
    })),
    total: services.length + teamMembers.length + projects.length,
  };
}
