/**
 * GET /api/v1/case-studies
 *
 * Returns all published case studies (Project where isCaseStudy=true, isPublished=true).
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 * Supports ?industry=&page=1&limit=12
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField, getLocalizedArray } from "@/lib/i18n/localization";
import { json, handleError, list, buildPagination } from "@/lib/api";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);
    const industry = searchParams.get("industry") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));

    const where = {
      isCaseStudy: true,
      isPublished: true,
      ...(industry && industry !== "all" ? { industry } : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          titleJa: true,
          titleKo: true,
          titleZh: true,
          description: true,
          descriptionEn: true,
          descriptionJa: true,
          descriptionKo: true,
          descriptionZh: true,
          client: true,
          year: true,
          image: true,
          industry: true,
          projectScope: true,
          teamSize: true,
          duration: true,
          challenge: true,
          solution: true,
          results: true,
          clientQuote: true,
          clientRole: true,
          roiMetric: true,
          primaryMetric: true,
          videoUrl: true,
          galleryImages: true,
          isPublished: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.project.count({ where }),
    ]);

    const localized = projects.map((p: typeof projects[number]) => ({
      id: p.id,
      slug: p.slug,
      title: getLocalizedField(p, "title", locale),
      description: getLocalizedField(p, "description", locale),
      client: p.client,
      year: p.year,
      image: p.image,
      industry: p.industry,
      projectScope: p.projectScope,
      teamSize: p.teamSize,
      duration: p.duration,
      challenge: p.challenge,
      solution: p.solution,
      results: p.results,
      clientQuote: p.clientQuote,
      clientRole: p.clientRole,
      roiMetric: p.roiMetric,
      primaryMetric: p.primaryMetric,
      videoUrl: p.videoUrl,
      galleryImages: p.galleryImages ?? [],
      category: p.category,
      isPublished: p.isPublished,
      _localeUsed: locale,
    }));

    logger.withSLO("GET /api/v1/case-studies success", {
      endpoint: "/api/v1/case-studies",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return list(localized, buildPagination(page, limit, total));
  } catch (error) {
    logger.withSLO("GET /api/v1/case-studies failed", { endpoint: "/api/v1/case-studies", latencyMs: 0, statusCode: 500 });
    return handleError(error);
  }
}
