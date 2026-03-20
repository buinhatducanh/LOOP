import { prisma } from "@/lib/prisma";

/* ──────────────────────────────────────────────────────────────────────
   Internal linking — content recommendation engine
   Used by service detail and project detail pages to display related
   content via contextual cross-links (SEO best practice).

   Note: React.cache() is intentionally NOT used here.
   - In API routes, cache() does not deduplicate across requests.
   - In Server Components, Next.js handles caching via its own mechanisms.
   - Use React `cache()` only when the same function is called multiple
     times within a single React render tree (component-level deduplication).
   - For request-level memoization, use next's unstable_cache instead.
   ────────────────────────────────────────────────────────────────────── */

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface RelatedProject {
  id: string;
  slug: string;
  title: string;
  client: string;
  image: string;
  results: string;
  category: string;
  serviceId: string | null;
  techStack: string[];
}

export interface RelatedService {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string;
  shortDescription: string;
  startingPrice: number;
  deliveryTime: string;
  /** Optional tech stack for relevance scoring (populated from server query) */
  techStack?: string[];
}

/* ─── Related Projects for a Service page ────────────────────────────── */

export async function getRelatedProjectsForService(
  serviceId: string
): Promise<RelatedProject[]> {
  const current = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { category: true },
  });

  if (!current) return [];

  // Filter in DB — avoid loading all published projects into memory
  const projects = await prisma.project.findMany({
    where: {
      isPublished: true,
      OR: [
        { serviceId: serviceId },
        { category: current.category },
      ],
    },
    select: {
      id: true, slug: true, title: true, client: true,
      image: true, results: true, category: true,
      serviceId: true, techStack: true,
    },
    take: 6,
    orderBy: { sortOrder: "asc" },
  });

  return projects;
}

/* ─── Related Services for a Project page ────────────────────────────── */

export async function getRelatedServicesForProject(
  projectId: string
): Promise<RelatedService[]> {
  const current = await prisma.project.findUnique({
    where: { id: projectId },
    select: { serviceId: true, category: true, techStack: true },
  });

  if (!current) return [];

  // Score in JS: serviceId match > category match.
  // Primary filter by category in DB, score/sort in JS.
  const services = await prisma.service.findMany({
    where: { isActive: true, category: current.category },
    select: {
      id: true, slug: true, title: true, category: true,
      icon: true, shortDescription: true, startingPrice: true,
      deliveryTime: true,
    },
    take: 10,
  });

  if (services.length === 0) return [];

  // Score: direct service match (from parent serviceId on project) gets highest priority
  const scored = services.map((s) => ({
    ...s,
    score: s.id === current.serviceId ? 5 : 3,
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

/* ─── Related Services for a Service page (cross-sell) ───────────────── */

export async function getRelatedServicesForService(
  serviceId: string
): Promise<RelatedService[]> {
  const current = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { category: true },
  });

  if (!current) return [];

  return prisma.service.findMany({
    where: { isActive: true, category: current.category, id: { not: serviceId } },
    select: {
      id: true, slug: true, title: true, category: true,
      icon: true, shortDescription: true, startingPrice: true,
      deliveryTime: true,
    },
    take: 3,
  });
}

/* ─── Related content pool (generic — homepage widgets) ────────────────── */

export async function getRelatedContentPool(): Promise<{
  projects: RelatedProject[];
  services: RelatedService[];
}> {
  const [projects, services] = await Promise.all([
    prisma.project.findMany({
      where: { isPublished: true },
      select: {
        id: true, slug: true, title: true, client: true,
        image: true, results: true, category: true,
        serviceId: true, techStack: true,
      },
      take: 8,
      orderBy: { sortOrder: "asc" },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, title: true, category: true,
        icon: true, shortDescription: true, startingPrice: true,
        deliveryTime: true,
      },
      take: 6,
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return { projects, services };
}
