/**
 * Service Detail Page — LOOP Solutions
 * Dark Figma design, server component → Prisma → Client
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedService } from "@/lib/i18n/localization";
import { ServiceDetailClient } from "@/components/landing/ServiceDetailClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: "Dịch vụ thiết kế Website | LOOP",
    alternates: { canonical: `${baseUrl}/${locale}/services` },
  };
}

type DetailProps = { params: Promise<{ locale: string; slug: string }> };

export default async function ServiceDetailPage({ params }: DetailProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const tNav = await getTranslations("Navigation");

  const raw = await prisma.service.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true, shortDescription: true,
      longDescription: true, category: true, features: true,
      technologies: true, startingPrice: true, deliveryTime: true,
    },
  });

  if (!raw) notFound();

  const service = mapLocalizedService(raw, resolvedLocale);

  const relatedRaw = await prisma.service.findMany({
    where: { isActive: true, category: raw.category, NOT: { slug } },
    select: { id: true, slug: true, title: true, shortDescription: true },
    take: 3,
  });
  const relatedServices = relatedRaw.map((s) => mapLocalizedService(s, resolvedLocale));

  return (
    <ServiceDetailClient
      locale={locale}
      service={service}
      relatedServices={relatedServices}
      tNav={tNav as unknown as Record<string, string>}
    />
  );
}
