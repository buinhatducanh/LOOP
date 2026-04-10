/**
 * GET /api/v1/case-studies/[slug]
 *
 * Returns a single published case study by slug.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { ok, notFound, handleError } from "@/lib/api";
import { logger } from "@/lib/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const start = Date.now();
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const project = await prisma.project.findFirst({
      where: { slug, isCaseStudy: true, isPublished: true },
      include: {
        service: { select: { id: true, slug: true, title: true } },
      },
    });

    if (!project) {
      return notFound("case study not found");
    }

    const data = {
      id: project.id,
      slug: project.slug,
      title: getLocalizedField(project, "title", locale),
      description: getLocalizedField(project, "description", locale),
      client: project.client,
      year: project.year,
      image: project.image,
      industry: project.industry,
      projectScope: project.projectScope,
      teamSize: project.teamSize,
      duration: project.duration,
      challenge: project.challenge,
      solution: project.solution,
      results: project.results,
      clientQuote: project.clientQuote,
      clientRole: project.clientRole,
      roiMetric: project.roiMetric,
      primaryMetric: project.primaryMetric,
      videoUrl: project.videoUrl,
      galleryImages: project.galleryImages ?? [],
      category: project.category,
      isPublished: project.isPublished,
      service: project.service,
      _localeUsed: locale,
    };

    logger.withSLO("GET /api/v1/case-studies/[slug] success", {
      endpoint: "/api/v1/case-studies/[slug]",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return ok(data);
  } catch (error) {
    logger.withSLO("GET /api/v1/case-studies/[slug] failed", { endpoint: "/api/v1/case-studies/[slug]", latencyMs: 0, statusCode: 500 });
    return handleError(error);
  }
}
