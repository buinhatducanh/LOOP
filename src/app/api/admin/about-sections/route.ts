/**
 * GET  /api/admin/about-sections — list sections (filter by locale)
 * POST /api/admin/about-sections — create section
 */

import { handleError, ok, list, badRequest, buildPagination } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: Request) {
  try {
    const session = await requirePermission("blog-posts", "read");
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") ?? "vi";
    const sectionType = searchParams.get("sectionType") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { locale };
    if (sectionType) where.sectionType = sectionType;

    const [sections, total] = await Promise.all([
      prisma.aboutSection.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
      prisma.aboutSection.count({ where }),
    ]);

    return list(sections, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("blog-posts", "create");
    const body = await req.json();

    if (!body.sectionType || typeof body.sectionType !== "string") {
      return badRequest("sectionType is required");
    }

    const data = {
      sectionType: body.sectionType,
      locale: body.locale ?? "vi",
      badge: body.badge ?? null,
      title: body.title ?? null,
      titleHighlight: body.titleHighlight ?? null,
      subtitle: body.subtitle ?? null,
      description: body.description ?? null,
      ctaText: body.ctaText ?? null,
      ctaLink: body.ctaLink ?? null,
      cta2Text: body.cta2Text ?? null,
      cta2Link: body.cta2Link ?? null,
      stats: body.stats ?? null,
      story: body.story ?? null,
      timeline: body.timeline ?? null,
      values: body.values ?? null,
      teamPreview: body.teamPreview ?? null,
      ctaSectionTitle: body.ctaSectionTitle ?? null,
      ctaSectionSub: body.ctaSectionSub ?? null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    };

    const section = await prisma.aboutSection.create({ data });
    return ok(section, 201);
  } catch (err) {
    return handleError(err);
  }
}
