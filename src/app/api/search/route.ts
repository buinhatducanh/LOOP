import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const locale = searchParams.get("locale") || "vi";

  if (!q || q.length < 2) {
    return NextResponse.json({ services: [], team: [], projects: [], total: 0 });
  }

  const [services, teamMembers, projects] = await Promise.all([
    // ── Services ───────────────────────────────────────────────────
    prisma.service.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
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
      take: 5,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Team Members ────────────────────────────────────────────
    prisma.teamMember.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { role: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
          { shortBio: { contains: q, mode: "insensitive" } },
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
        roleLevel: true,
        isFeatured: true,
      },
      take: 5,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    }),

    // ── Projects ────────────────────────────────────────────────
    prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { client: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
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
      take: 5,
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Map categories to localized labels
  const categoryMap = locale === "vi" ? SERVICE_CATEGORIES_VI : SERVICE_CATEGORIES_EN;

  const results = {
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.shortDescription,
      icon: s.icon,
      category: categoryMap[s.category] ?? s.category,
      price: s.startingPrice,
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
      href: `/team-list/${m.slug}`,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      client: p.client,
      image: p.image,
      category: p.category,
      href: `/portfolio/${p.slug}`,
    })),
    // Total for badge count
    total: services.length + teamMembers.length + projects.length,
  };

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
