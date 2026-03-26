/**
 * Robots.txt — LOOP Solutions
 * Locale-aware robots.txt for VI + EN (Phase 0).
 */

import type { MetadataRoute } from "next";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// routing imported for future locale expansion (Phase 1: JA+KO, Phase 2: ZH)
import { routing } from "@/i18n/routing";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // Alternative: per-locale sitemaps
    // sitemap: routing.locales.map(loc => `${baseUrl}/${loc}/sitemap.xml`),
  };
}
