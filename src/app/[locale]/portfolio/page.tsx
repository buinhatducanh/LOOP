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
  return {
    title: t("portfolioTitle"),
    description: t("portfolioDescription"),
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
