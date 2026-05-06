/**
 * Robots.txt — LOOP Solutions
 * Locale-aware robots.txt for all 5 locales (VI/EN/JA/KO/ZH).
 */

import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow social crawlers to access OG image endpoint
        userAgent: ["facebookexternalhit", "Twitterbot", "LinkedInBot", "Slackbot", "WhatsApp", "ZaloBot"],
        allow: ["/", "/api/og"],
        disallow: ["/admin/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
