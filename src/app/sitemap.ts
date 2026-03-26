import type { MetadataRoute } from "next";
import { getServices, getProjects, getTeamMembers } from "@/lib/db/queries";
import { client } from "@/sanity/client";
import { postsQuery } from "@/sanity/queries";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ─── Static pages ─────────────────────────────────────────────────────────
  const staticRoutes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/portfolio", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
  ];

  for (const route of staticRoutes) {
    const normalizedPath = route.path === "/" ? "" : route.path;
    entries.push({
      url: `${baseUrl}${normalizedPath ? `/${normalizedPath}` : ""}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  // ─── Services (from DB) ────────────────────────────────────────────────────
  try {
    const services = await getServices();
    for (const service of services) {
      entries.push({
        url: `${baseUrl}/services/${service.slug}`,
        lastModified: service.updatedAt ?? service.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      });
    }
  } catch {
    // If DB fails, services are omitted from sitemap.
  }

  // ─── Portfolio / Projects (from DB) ───────────────────────────────────────
  try {
    const projects = await getProjects();
    for (const project of projects) {
      entries.push({
        url: `${baseUrl}/portfolio/${project.slug}`,
        lastModified: project.updatedAt ?? project.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    }
  } catch {
    // If DB fails, projects are omitted from sitemap.
  }

  // ─── Team pages (from DB) ─────────────────────────────────────────────────
  try {
    const teamMembers = await getTeamMembers();
    for (const member of teamMembers) {
      entries.push({
        url: `${baseUrl}/team/${member.slug}`,
        lastModified: member.updatedAt ?? member.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
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
      entries.push({
        url: `${baseUrl}/blog/${post.slug.current}`,
        lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    }
  } catch {
    // If Sanity fails, blog posts are omitted from sitemap.
  }

  return entries;
}
