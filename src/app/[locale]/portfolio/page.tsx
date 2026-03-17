import type { Metadata } from "next";
import { getProjects } from "@/lib/db/queries";
import { projects as mockProjects } from "@/data/mockData";
import { PortfolioPage } from "./portfolio-page";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('portfolioTitle'),
    description: t('portfolioDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/portfolio` },
  };
}

export default async function Page() {
  let projects;
  try {
    const dbProjects = await getProjects();
    projects = dbProjects.length > 0 ? dbProjects.map((p) => ({
      id: p.slug,
      title: p.title,
      category: p.category,
      client: p.client,
      year: p.year,
      image: p.image,
      description: p.description,
      techStack: p.techStack,
      features: p.features,
      results: p.results,
      screenshots: p.screenshots,
      serviceId: (p.service as { slug: string } | null)?.slug ?? "",
      teamMember: p.teamMember ? {
        id: p.teamMember.slug,
        name: p.teamMember.name,
        role: p.teamMember.role,
        image: p.teamMember.image,
      } : null,
    })) : mockProjects;
  } catch {
    projects = mockProjects;
  }
  return <PortfolioPage projects={projects} />;
}
