/**
 * Sitemap — LOOP Solutions
 * Locale-aware sitemap for all 5 locales (VI/EN/JA/KO/ZH).
 * Dynamically includes service/portfolio/team/blog slugs from the database.
 */

import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

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
  { path: "dang-nhap", priority: 0.8, changeFrequency: "yearly" as const },
  { path: "khach-hang", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "team", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "blog", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "privacy", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "terms", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "hoc-vien", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "dat-lich", priority: 0.9, changeFrequency: "monthly" as const },
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

  // ─── Dynamic service slugs (all locales) ───────────────────────────────────
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    for (const locale of locales) {
      for (const service of services) {
        entries.push({
          url: `${baseUrl}/${locale}/services/${service.slug}`,
          lastModified: service.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        });
      }
    }
  } catch {
    // Non-fatal
  }

  // ─── Dynamic portfolio/project slugs (all locales) ─────────────────────────
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });

    for (const locale of locales) {
      for (const project of projects) {
        entries.push({
          url: `${baseUrl}/${locale}/portfolio/${project.slug}`,
          lastModified: project.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        });
      }
    }
  } catch {
    // Non-fatal
  }

  // ─── Dynamic course slugs (all locales) ─────────────────────────────────
  try {
    const courses = await prisma.course.findMany({
      where: { instructorId: { not: "" } },
      select: { id: true, updatedAt: true },
    });

    for (const locale of locales) {
      for (const course of courses) {
        entries.push({
          url: `${baseUrl}/${locale}/hoc-vien/${course.id}`,
          lastModified: course.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        });
      }
    }
  } catch {
    // Non-fatal
  }

  // ─── Dynamic team member slugs (all locales) ───────────────────────────────
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    for (const locale of locales) {
      for (const member of members) {
        entries.push({
          url: `${baseUrl}/${locale}/team/${member.slug}`,
          lastModified: member.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.5,
        });
      }
    }
  } catch {
    // Non-fatal
  }

  return entries;
}
