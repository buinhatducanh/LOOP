/**
 * About Page — LOOP Solutions
 * Rewritten 2026-04-11: Uses DS design tokens throughout
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DS, GRD } from "@/lib/design-tokens";
import AboutClient from "./AboutClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = tSeo("aboutTitle");
  const description = tSeo("aboutDescription");
  const brandMetaTitle = tSeo("brandMetaTitle");
  const brandMetaDescription = tSeo("brandMetaDescription");
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/about` },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      url: `${baseUrl}/${locale}/about`,
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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  return <AboutClient locale={locale} />;
}
