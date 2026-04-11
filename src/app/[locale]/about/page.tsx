/**
 * About Page — LOOP Solutions
 * Rewritten 2026-04-11: Uses DS design tokens + fetches DB sections as fallback
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import AboutClient from "./AboutClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = tSeo("aboutTitle");
  const description = tSeo("aboutDescription");
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/about` },
    openGraph: {
      type: "website",
      title: `${title} — LOOP Solutions`,
      description,
      url: `${baseUrl}/${locale}/about`,
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  // Fetch DB sections (fallback to AboutClient i18n defaults if empty)
  let dbSections: Record<string, unknown>[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/about-sections?lang=${locale}&locale=${locale}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      dbSections = json.data ?? [];
    }
  } catch {
    dbSections = [];
  }

  return <AboutClient locale={locale} dbSections={dbSections as any} />;
}
