/**
 * GET /api/v1/testimonials
 *
 * Returns all active testimonials for the public website.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";


import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { handleError } from "@/lib/api/response";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const localized = testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      rating: t.rating,
      text: getLocalizedField(t, "text", locale),
      role: getLocalizedField(t, "role", locale),
      company: getLocalizedField(t, "company", locale),
      _localeUsed: locale,
    }));

    logger.withSLO("GET /api/v1/testimonials success", {
      endpoint: "/api/v1/testimonials",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
    return NextResponse.json(
      {
        version: "v1",
        data: localized,
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
    logger.withSLO("GET /api/v1/testimonials failed", {
      endpoint: "/api/v1/testimonials",
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
