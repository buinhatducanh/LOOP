/**
 * GET /api/expertises
 *
 * Public expertise list with optional ?lang= param.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);
    const activeOnly = searchParams.get("active") !== "false";

    const expertises = await prisma.expertise.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    const localized = expertises.map((e) => ({
      id: e.id,
      name: getLocalizedField(e, "name", locale),
      category: getLocalizedField(e, "category", locale),
      icon: e.icon,
      logo: e.logo,
      _localeUsed: locale,
    }));

    return NextResponse.json({
      version: "v1",
      data: localized,
      meta: { count: localized.length, locale },
    });
  } catch (error) {
    console.error("[/api/expertises] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch expertises" },
      { status: 500 }
    );
  }
}
