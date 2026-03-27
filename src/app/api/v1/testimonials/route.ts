/**
 * GET /api/v1/testimonials
 *
 * Returns all active testimonials for the public website.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { handleError } from "@/lib/api/response";

export async function GET(req: Request) {
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

    return NextResponse.json(
      {
        version: "v1",
        data: localized,
        meta: { count: localized.length, locale },
      },
      { headers: { "X-API-Version": "v1" } }
    );
  } catch (error) {
    return handleError(error);
  }
}
