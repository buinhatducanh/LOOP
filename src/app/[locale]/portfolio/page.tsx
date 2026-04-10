import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedProject } from "@/lib/i18n/localization";
import type { Metadata } from "next";
import { PortfolioClient } from "@/components/landing/PortfolioClient";

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

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let projects: Record<string, unknown>[] = [];
  try {
    const raw = await prisma.project.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        category: true,
        title: true,
        titleEn: true,
        titleJa: true,
        titleKo: true,
        titleZh: true,
        description: true,
        descriptionEn: true,
        descriptionJa: true,
        descriptionKo: true,
        descriptionZh: true,
        client: true,
        year: true,
        image: true,
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    projects = raw.map((p) => mapLocalizedProject(p, resolvedLocale));
  } catch {
    projects = [];
  }

  return <PortfolioClient locale={locale} projects={projects} />;
}
