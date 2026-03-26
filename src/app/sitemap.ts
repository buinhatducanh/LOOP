/**
 * Sitemap — LOOP Solutions
 * Locale-aware sitemap for all 5 locales (VI/EN/JA/KO/ZH).
 * Dynamically includes blog post slugs from the database.
 */

import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

// Stable list for sitemap iteration (avoids repeated type casts)
const locales: string[] = [...routing.locales];

export const revalidate = 3600;

/**
 * Static routes shared across all locales.
 */
const staticRoutes = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "services", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "portfolio", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "pricing", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "team", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "blog", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "contact", priority: 0.5, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ─── Static pages (all locales) ─────────────────────────────────────────────
  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route.path ? `/${route.path}` : ""}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  // ─── Dynamic blog post slugs (all locales) ─────────────────────────────────
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true, publishedAt: true },
    });

    for (const locale of locales) {
      for (const post of posts) {
        entries.push({
          url: `${baseUrl}/${locale}/blog/${post.slug}`,
          lastModified: post.publishedAt ?? post.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
      }
    }
  } catch {
    // Non-fatal: sitemap still serves static routes
  }

  return entries;
}
