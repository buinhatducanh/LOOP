import type { MetadataRoute } from "next";
import { getServices, getProjects } from "@/lib/db/queries";
import { services as mockServices, projects as mockProjects } from "@/data/mockData";
import { routing } from "@/i18n/routing";

const baseUrl = "https://loop.vn";

function getLocalizedUrl(path: string, locale: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "monthly" as const },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/portfolio", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  serviceSlugs.forEach(slug => {
    routes.push({ path: `/services/${slug}`, priority: 0.8, changeFrequency: "monthly" as const });
  });

  projectSlugs.forEach(slug => {
    routes.push({ path: `/portfolio/${slug}`, priority: 0.7, changeFrequency: "monthly" as const });
  });

  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    routing.locales.forEach((locale) => {
      sitemapEntries.push({
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
    });
  });

  return sitemapEntries;
}
