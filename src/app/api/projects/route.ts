/**
 * GET /api/projects
 *
 * Returns all published projects.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi).
 */

import { handleError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField, getLocalizedArray } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      include: {
        service: { select: { slug: true } },
        teamMember: { select: { id: true, slug: true, name: true, role: true, image: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const localized = projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      category: p.category,
      client: p.client,
      year: p.year,
      image: p.image,
      title: getLocalizedField(p, "title", locale),
      description: getLocalizedField(p, "description", locale),
      techStack: getLocalizedArray(p, "techStack", locale),
      results: getLocalizedField(p, "results", locale),
      isPublished: p.isPublished,
      service: p.service,
      teamMember: p.teamMember,
      _localeUsed: locale,
    }));

    return ok(localized);
  } catch (error) {
    return handleError(error);
  }
}
