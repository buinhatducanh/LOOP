/**
 * GET /api/v1/services
 *
 * Returns all active services for the public website.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField, getLocalizedArray } from "@/lib/i18n/localization";
import { handleError } from "@/lib/api/response";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const localized = services.map((s) => ({
      id: s.id,
      slug: s.slug,
      icon: s.icon,
      title: getLocalizedField(s, "title", locale),
      shortDescription: getLocalizedField(s, "shortDescription", locale),
      longDescription: getLocalizedField(s, "longDescription", locale),
      features: getLocalizedArray(s, "features", locale),
      technologies: getLocalizedArray(s, "technologies", locale),
      startingPrice: s.startingPrice,
      deliveryTime: s.deliveryTime,
      category: s.category,
      isActive: s.isActive,
      sortOrder: s.sortOrder,
      _localeUsed: locale,
    }));

    // Group by category for navbar dropdowns
    const grouped: Record<string, typeof localized> = {};
    for (const service of localized) {
      const cat = service.category ?? "Khác";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    }

    logger.withSLO("GET /api/v1/services success", {
      endpoint: "/api/v1/services",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return NextResponse.json(
      {
        version: "v1",
        data: { services: localized, grouped, categories: Object.keys(grouped) },
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
    logger.withSLO("GET /api/v1/services failed", { endpoint: "/api/v1/services", latencyMs: 0, statusCode: 500 });
    return handleError(error);
  }
}
