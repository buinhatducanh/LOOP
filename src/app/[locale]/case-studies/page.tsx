/**
 * Case Studies Listing Page
 * Route: /vi/case-studies, /en/case-studies, ...
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { parseLocaleParam } from "@/lib/i18n/localization";
import type { Metadata } from "next";
import { CaseStudiesClient } from "@/components/landing/CaseStudiesClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = t("caseStudiesTitle");
  const description = t("caseStudiesDescription");

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/case-studies` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${baseUrl}/${locale}/case-studies`,
      images: [{ url: `/api/og?type=case-studies&locale=${locale}`, width: 1200, height: 630, alt: "LOOP Solutions Case Studies" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?type=case-studies&locale=${locale}`],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function CaseStudiesPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

  let projects: Record<string, unknown>[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/v1/case-studies?lang=${locale}&limit=100`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      projects = Array.isArray(json.data) ? json.data : [];
    }
  } catch {
    projects = [];
  }

  return <CaseStudiesClient locale={locale} initialProjects={projects} />;
}
