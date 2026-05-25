/**
 * GET /api/v1/services
 *
 * Returns all active services for the public website.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 * Supports ?limit=N for pagination (default: all)
 *
 * Version: v1 (stable)
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField, getLocalizedArray } from "@/lib/i18n/localization";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 20) : undefined;

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: limit,
    });

    const localized = services.map((s) => ({
      id: s.id,
      slug: s.slug,
      icon: s.icon,
      title: getLocalizedField(s, "title", locale),
      shortDescription: getLocalizedField(s, "shortDescription", locale),
      longDescription: getLocalizedField(s, "longDescription", locale),
      features: getLocalizedArray(s, "features", locale),
      technologies: s.technologies ?? [],
      startingPrice: s.startingPrice,
      deliveryTime: s.deliveryTime,
      category: s.category,
      _localeUsed: locale,
    }));

    logger.withSLO("GET /api/v1/services success", {
      endpoint: "/api/v1/services",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return NextResponse.json(
      {
        version: "v1",
        data: { services: localized },
        meta: { count: localized.length, locale },
      },
      {
        headers: {
          "X-API-Version": "v1",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    logger.withSLO("GET /api/v1/services failed", {
      endpoint: "/api/v1/services",
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch services" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
