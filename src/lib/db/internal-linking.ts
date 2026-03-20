import { prisma } from "@/lib/prisma";
import { cache } from "react";

/* ──────────────────────────────────────────────────────────────────────
   Internal linking — content recommendation engine
   Used by service detail and project detail pages to display related
   content via contextual cross-links (SEO best practice).
   ────────────────────────────────────────────────────────────────────── */

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
  techStack?: string[];
}

/* ─── Related Projects for a Service page ────────────────────────────── */

export const getRelatedProjectsForService = cache(async (serviceId: string): Promise<RelatedProject[]> => {
  const [current, allProjects] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId }, select: { category: true } }),
    prisma.project.findMany({
      where: { isPublished: true },
      select: {
        id: true, slug: true, title: true, client: true,
        image: true, results: true, category: true,
        serviceId: true, techStack: true,
      },
    }),
  ]);

  if (!current) return [];

  return allProjects
    .filter((p) => p.serviceId === serviceId || p.category === current.category)
    .slice(0, 6);
});

/* ─── Related Services for a Project page ────────────────────────────── */

export const getRelatedServicesForProject = cache(async (projectId: string): Promise<RelatedService[]> => {
  const [current, allServices] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { serviceId: true, category: true, techStack: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, title: true, category: true,
        icon: true, shortDescription: true, startingPrice: true,
        deliveryTime: true,
      },
    }),
  ]);

  if (!current) return [];

  const scored = allServices
    .map((s) => {
      let score = 0;
      if (s.id === current.serviceId) score += 5;
      if (s.category === current.category) score += 3;
      // shared tech keywords bonus
      const projectTech = new Set(current.techStack.map((t) => t.toLowerCase()));
      // services use `technologies` (singular in schema)
      // no direct tech match for services, but category match is the primary signal
      return { ...s, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 4) as RelatedService[];
});

/* ─── Related Services for a Service page (cross-sell) ────────────────── */

export const getRelatedServicesForService = cache(async (serviceId: string): Promise<RelatedService[]> => {
  const [current, allServices] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId }, select: { category: true } }),
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, title: true, category: true,
        icon: true, shortDescription: true, startingPrice: true,
        deliveryTime: true,
      },
    }),
  ]);

  if (!current) return [];

  return allServices
    .filter((s) => s.id !== serviceId && s.category === current.category)
    .slice(0, 3) as RelatedService[];
});

/* ─── Related content (generic pool for homepage widgets) ─────────────── */

export const getRelatedContentPool = cache(async (): Promise<{
  projects: RelatedProject[];
  services: RelatedService[];
}> => {
  const [projects, services] = await Promise.all([
    prisma.project.findMany({
      where: { isPublished: true },
      select: {
        id: true, slug: true, title: true, client: true,
        image: true, results: true, category: true,
        serviceId: true, techStack: true,
      },
      take: 8,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, title: true, category: true,
        icon: true, shortDescription: true, startingPrice: true,
        deliveryTime: true,
      },
      take: 6,
    }),
  ]);

  return { projects, services };
});
