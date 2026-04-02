/**
 * GET /api/v1/services/packages
 *
 * Returns the WebPackages data (8 industry-specific website packages).
 * Data is localized based on ?lang= param (default: vi).
 * This is the static "pre-built website" data, separate from custom services.
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { getServicesPackages } from "@/app/data/locales";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = parseLocaleParam(searchParams);

  const packages = getServicesPackages(locale);

  return NextResponse.json(
    {
      version: "v1",
      data: packages,
      meta: { count: packages.length, locale },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
