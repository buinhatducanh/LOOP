/**
 * HomeGalleryImage — Public v1 API
 *
 * GET /api/v1/home-gallery-images    → active gallery images (localized)
 */

import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["vi", "en", "ja", "ko", "zh"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function getLocale(lang: string | null): Locale {
  if (lang && SUPPORTED_LOCALES.includes(lang as Locale)) {
    return lang as Locale;
  }
  return "vi";
}

function mapAlt(image: {
  alt?: string | null;
  altEn?: string | null;
  altJa?: string | null;
  altKo?: string | null;
  altZh?: string | null;
  image: string;
}, locale: Locale) {
  const altMap: Record<Locale, string | null | undefined> = {
    vi: image.alt,
    en: image.altEn ?? image.alt,
    ja: image.altJa ?? image.alt,
    ko: image.altKo ?? image.alt,
    zh: image.altZh ?? image.alt,
  };
  return {
    src: image.image,
    alt: altMap[locale] ?? image.alt ?? "LOOP Solutions gallery",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const locale = getLocale(searchParams.get("lang"));

    const images = await prisma.homeGalleryImage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const mapped = images.map((img) => mapAlt(img, locale));

    return NextResponse.json({ data: mapped }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch gallery images" }, { status: 500 });
  }
}
