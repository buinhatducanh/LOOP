/**
 * Services Page — LOOP Solutions
 * Server component: fetches custom services from DB + WebPackages from locale data.
 * Client component: interactive filter, animations.
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const title = t("servicesTitle");
  const description = t("servicesDescription");
  const brandMetaTitle = t("brandMetaTitle");
  const brandMetaDescription = t("brandMetaDescription");
  const ogImage = t("ogImage");
  const canonical = `${baseUrl}/${locale}/services`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      url: canonical,
      images: [{ url: ogImage || "/og-cover.jpg", width: 1200, height: 630, alt: "LOOP Solutions" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      images: [ogImage || "/og-cover.jpg"],
    },
  };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  // 1. Fetch custom services from DB (localized)
  let customServices: Record<string, unknown>[] = [];
  try {
    const raw = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        category: true,
        icon: true,
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
    customServices = raw.map((s) => mapLocalizedService(s, resolvedLocale));
  } catch {
    customServices = [];
  }

  // 2. Fetch WebPackages from locale data (imported directly — no API call needed)
  const { getServicesPackages } = await import("@/app/data/locales");
  const webPackages = getServicesPackages(locale);

  // 3. Fetch UI labels from i18n
  const t = await getTranslations("services");
  const ui = {
    heroBadge: t("heroBadge"),
    heroTitle: t("heroTitle"),
    heroDesc: t("heroDesc"),
    ctaPrimary: t("ctaPrimary"),
    ctaSecondary: t("ctaSecondary"),
    filterAll: t("filterAll"),
    processLabel: t("processLabel"),
    processTitle: t("processTitle"),
    processStep1Title: t("processStep1Title"),
    processStep1Desc: t("processStep1Desc"),
    processStep2Title: t("processStep2Title"),
    processStep2Desc: t("processStep2Desc"),
    processStep3Title: t("processStep3Title"),
    processStep3Desc: t("processStep3Desc"),
    processStep4Title: t("processStep4Title"),
    processStep4Desc: t("processStep4Desc"),
    ctaReady: t("ctaReady"),
    ctaReadyDesc: t("ctaReadyDesc"),
    ctaReadyBtn: t("ctaReadyBtn"),
    webPackagesLabel: t("webPackagesLabel"),
    customServicesLabel: t("customServicesLabel"),
    customServicesDesc: t("customServicesDesc"),
    pkgPrice: t("pkgPrice"),
    pkgOrTrial: t("pkgOrTrial"),
    pkgFeatures: t("pkgFeatures"),
    pkgMoreFeatures: t("pkgMoreFeatures"),
    pkgCollapse: t("pkgCollapse"),
    pkgLpReward: t("pkgLpReward"),
    pkgTrialCta: t("pkgTrialCta"),
    emptyState: t("emptyState"),
    mapLabel: t("mapLabel"),
    anUong: t("anUong"),
    sucKhoe: t("sucKhoe"),
    luuTru: t("luuTru"),
    batDongSan: t("batDongSan"),
    khac: t("khac"),
    liênHệ: t("liênHệ"),
  };

  return (
    <ServicesClient
      locale={locale}
      customServices={customServices}
      webPackages={webPackages}
      ui={ui}
    />
  );
}
