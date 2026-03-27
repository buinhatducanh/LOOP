/**
 * GET /api/v1/projects
 *
 * Returns all published projects for the public website.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
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
        teamMember: { select: { id: true, slug: true, role: true, image: true } },
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
      features: getLocalizedArray(p, "features", locale),
      results: getLocalizedField(p, "results", locale),
      screenshots: p.screenshots,
      isPublished: p.isPublished,
      sortOrder: p.sortOrder,
      service: p.service,
      teamMember: p.teamMember,
      _localeUsed: locale,
    }));

    return NextResponse.json(
      {
        version: "v1",
        data: localized,
        meta: { count: localized.length, locale },
      },
      { headers: { "X-API-Version": "v1" } }
    );
  } catch (error) {
    console.error("[/api/v1/projects] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch projects" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
