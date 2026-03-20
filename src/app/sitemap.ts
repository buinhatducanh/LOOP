import type { MetadataRoute } from "next";
import { getServices, getProjects, getTeamMembers } from "@/lib/db/queries";
import { client } from "@/sanity/client";
import { postsQuery } from "@/sanity/queries";
import { routing } from "@/i18n/routing";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

function getLocalizedUrl(path: string, locale: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ─── Static pages ──────────────────────────────────────────────────────────
  const staticRoutes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/portfolio", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/glossary", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  for (const route of staticRoutes) {
    for (const locale of routing.locales) {
      entries.push({
        url: getLocalizedUrl(route.path, locale),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, getLocalizedUrl(route.path, l)])
          ),
        },
      });
    }
  }

  // ─── Services (from DB) ────────────────────────────────────────────────────
  try {
    const services = await getServices();
    for (const service of services) {
      const updatedAt = service.updatedAt ?? service.createdAt;
      for (const locale of routing.locales) {
        entries.push({
          url: getLocalizedUrl(`/services/${service.slug}`, locale),
          lastModified: updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, getLocalizedUrl(`/services/${service.slug}`, l)])
            ),
          },
        });
      }
    }
  } catch {
    // If DB fails, services are omitted from sitemap — this is intentional.
    // Previously this fell back to mock data, causing data inconsistency.
  }

  // ─── Portfolio / Projects (from DB) ───────────────────────────────────────
  try {
    const projects = await getProjects();
    for (const project of projects) {
      const updatedAt = project.updatedAt ?? project.createdAt;
      for (const locale of routing.locales) {
        entries.push({
          url: getLocalizedUrl(`/portfolio/${project.slug}`, locale),
          lastModified: updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, getLocalizedUrl(`/portfolio/${project.slug}`, l)])
            ),
          },
        });
      }
    }
  } catch {
    // If DB fails, projects are omitted from sitemap.
  }

  // ─── Team pages (from DB) ───────────────────────────────────────────────────
  try {
    const teamMembers = await getTeamMembers();
    for (const member of teamMembers) {
      const updatedAt = member.updatedAt ?? member.createdAt;
      for (const locale of routing.locales) {
        entries.push({
          url: getLocalizedUrl(`/team/${member.slug}`, locale),
          lastModified: updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, getLocalizedUrl(`/team/${member.slug}`, l)])
            ),
          },
        });
      }
    }
  } catch {
    // If DB fails, team pages are omitted from sitemap.
  }

  // ─── Blog posts (from Sanity CMS) ─────────────────────────────────────────
  try {
    const posts = await client.fetch<Array<{ slug: { current: string }; publishedAt?: string }>>(
      postsQuery
    );
    for (const post of posts) {
      if (!post.slug?.current) continue;
      const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date();
      for (const locale of routing.locales) {
        entries.push({
          url: getLocalizedUrl(`/blog/${post.slug.current}`, locale),
          lastModified: publishedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, getLocalizedUrl(`/blog/${post.slug.current}`, l)])
            ),
          },
        });
      }
    }
  } catch {
    // If Sanity fails, blog posts are omitted from sitemap.
  }

  return entries;
}
