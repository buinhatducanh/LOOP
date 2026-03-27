/**
 * Services Page — LOOP Solutions
 * Figma dark UI + real Prisma DB data.
 * Server component for SEO, Prisma queries; interactive filter section uses client component.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedService } from "@/lib/i18n/localization";
import type { Metadata } from "next";
import { ServicesClient } from "@/components/landing/ServicesClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
  };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  // Fetch real services from DB
  let services: Record<string, unknown>[] = [];
  try {
    const raw = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        category: true,
        title: true,
        titleEn: true,
        titleJa: true,
        titleKo: true,
        titleZh: true,
        shortDescription: true,
        shortDescriptionEn: true,
        shortDescriptionJa: true,
        shortDescriptionKo: true,
        shortDescriptionZh: true,
        startingPrice: true,
        deliveryTime: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    services = raw.map((s) => mapLocalizedService(s, resolvedLocale));
  } catch {
    services = [];
  }

  return <ServicesClient locale={locale} services={services} />;
}
