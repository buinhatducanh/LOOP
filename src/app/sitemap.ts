import type { MetadataRoute } from "next";
import { getServices, getProjects } from "@/lib/db/queries";
import { services as mockServices, projects as mockProjects } from "@/data/mockData";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://loop.vn";

  let serviceSlugs: string[];
  let projectSlugs: string[];

  try {
    const [dbServices, dbProjects] = await Promise.all([getServices(), getProjects()]);
    serviceSlugs = dbServices.length > 0 ? dbServices.map((s) => s.slug) : mockServices.map((s) => s.id);
    projectSlugs = dbProjects.length > 0 ? dbProjects.map((p) => p.slug) : mockProjects.map((p) => p.id);
  } catch {
    serviceSlugs = mockServices.map((s) => s.id);
    projectSlugs = mockProjects.map((p) => p.id);
  }

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/portfolio`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  const servicePages = serviceSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const portfolioPages = projectSlugs.map((slug) => ({
    url: `${baseUrl}/portfolio/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...servicePages, ...portfolioPages];
}
