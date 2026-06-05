import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { DEFAULT_CONTACT_SETTINGS } from "@/lib/constants";
import { PortfolioLungLo } from "@/components/landing/PortfolioLungLo";
import { mapLocalizedProject } from "@/lib/i18n/localization";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = t("portfolioTitle");
  const description = t("portfolioDescription");
  const brandMetaTitle = t("brandMetaTitle");
  const brandMetaDescription = t("brandMetaDescription");
  const _ogImage = t("ogImage");
  const canonical = `${baseUrl}/${locale}/portfolio`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      url: canonical,
      images: [{ url: `/api/og?type=service&locale=${locale}`, width: 1200, height: 630, alt: "LOOP Solutions" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      images: [`/api/og?type=service&locale=${locale}`],
    },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  // Fetch settings for the LP2Navbar to render Hotline, Zalo, Address, etc. properly
  const dbSettings = await prisma.siteSetting.findMany({
    where: {
      group: "contact",
    },
  });

  const settings: Record<string, string> = { ...DEFAULT_CONTACT_SETTINGS };
  for (const s of dbSettings) {
    settings[s.key] = s.value;
  }

  // Fetch projects from the database
  const rawProjects = await prisma.project.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      titleJa: true,
      titleKo: true,
      titleZh: true,
      category: true,
      client: true,
      year: true,
      image: true,
      description: true,
      descriptionEn: true,
      descriptionJa: true,
      descriptionKo: true,
      descriptionZh: true,
      techStack: true,
      techStackEn: true,
      techStackJa: true,
      techStackKo: true,
      techStackZh: true,
      features: true,
      featuresEn: true,
      featuresJa: true,
      featuresKo: true,
      featuresZh: true,
      results: true,
      resultsEn: true,
      resultsJa: true,
      resultsKo: true,
      resultsZh: true,
      screenshots: true,
      isPublished: true,
      isCaseStudy: true,
      industry: true,
      primaryMetric: true,
      roiMetric: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const projects = rawProjects.map((p) => mapLocalizedProject(p, locale));

  return <PortfolioLungLo locale={locale} settings={settings} projects={projects} />;
}
