/**
 * Pricing Page — LOOP Solutions
 * Simplified: 1 section, 3 pricing cards, all CTAs link to /{locale}/contact.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PricingSectionClient } from "@/components/landing/PricingSectionClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { locale } = await params;
 const tSeo = await getTranslations("seo");
 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
 const title = tSeo("pricingTitle");
 const description = tSeo("pricingDescription");
 const brandMetaTitle = tSeo("brandMetaTitle");
 const brandMetaDescription = tSeo("brandMetaDescription");
 const canonical = `${baseUrl}/${locale}/pricing`;

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

export default async function PricingPage({ params }: Props) {
 const { locale } = await params;
 if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
 setRequestLocale(locale);

 const t = await getTranslations("PricingPage");

 const translations = {
 badge: t("badge"),
 heading: t("heroHighlight"),
 btnContact: t("btnContact"),
 planStarter: t("planStarter"),
 planStarterPrice: t("planStarterPrice"),
 planStarterPeriod: t("planStarterPeriod"),
 planStarterFeatures: t("planStarterFeatures"),
 planProfessional: t("planProfessional"),
 planProfessionalPrice: t("planProfessionalPrice"),
 planProfessionalPeriod: t("planProfessionalPeriod"),
 planProfessionalFeatures: t("planProfessionalFeatures"),
 planEnterprise: t("planEnterprise"),
 planEnterprisePrice: t("planEnterprisePrice"),
 planEnterprisePeriod: t("planEnterprisePeriod"),
 planEnterpriseFeatures: t("planEnterpriseFeatures"),
 };

 return (
 <div className="min-h-screen" style={{ background: "var(--ds-bg, #0C0C14)" }}>
 <PricingSectionClient locale={locale} {...translations} />
 </div>
 );
}
