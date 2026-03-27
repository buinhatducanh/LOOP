/**
 * GET /api/services/[slug]
 *
 * Returns a single service by slug.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi).
 */

import { ok, notFound, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedService } from "@/lib/i18n/localization";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        projects: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, slug: true, image: true },
        },
      },
    });

    if (!service) return notFound("Service not found");

    const result = {
      ...mapLocalizedService(service, locale),
      projects: service.projects,
    };

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
