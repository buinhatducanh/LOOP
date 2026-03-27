/**
 * GET /api/projects/[slug]
 *
 * Returns a single project by slug.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi).
 */

import { ok, notFound, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField, getLocalizedArray } from "@/lib/i18n/localization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const project = await prisma.project.findUnique({
      where: { slug, isPublished: true },
      include: {
        service: { select: { id: true, slug: true } },
        teamMember: { select: { id: true, slug: true, name: true, role: true, image: true } },
      },
    });

    if (!project) return notFound("Project not found");

    return ok({
      id: project.id,
      slug: project.slug,
      category: project.category,
      client: project.client,
      year: project.year,
      image: project.image,
      title: getLocalizedField(project, "title", locale),
      description: getLocalizedField(project, "description", locale),
      techStack: getLocalizedArray(project, "techStack", locale),
      features: getLocalizedArray(project, "features", locale),
      results: getLocalizedField(project, "results", locale),
      screenshots: project.screenshots,
      isPublished: project.isPublished,
      service: project.service,
      teamMember: project.teamMember,
      _localeUsed: locale,
    });
  } catch (error) {
    return handleError(error);
  }
}
