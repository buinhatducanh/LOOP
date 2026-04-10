/**
 * Case Study Detail Page
 * Route: /vi/case-studies/[slug], /en/case-studies/[slug], ...
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { CaseStudyDetailClient } from "@/components/landing/CaseStudyDetailClient";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

  const project = await prisma.project.findFirst({
    where: { slug, isCaseStudy: true, isPublished: true },
    select: {
      title: true,
      titleEn: true,
      description: true,
      descriptionEn: true,
      client: true,
      industry: true,
      primaryMetric: true,
      image: true,
    },
  });

  const locale2 = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const title = project
    ? (locale2 === "en" ? project.titleEn : project.title) ?? t("caseStudiesTitle")
    : t("caseStudiesTitle");
  const description = project
    ? (locale2 === "en" ? project.descriptionEn : project.description) ?? t("caseStudiesDescription")
    : t("caseStudiesDescription");
  const ogImage = project?.image ?? `/api/og?type=case-studies&locale=${locale}`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/case-studies/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${baseUrl}/${locale}/case-studies/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function generateStaticParams() {
  return []; // populated at runtime
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { locale, slug } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

  let project: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${baseUrl}/api/v1/case-studies/${slug}?lang=${locale}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      project = json.data ?? null;
    }
  } catch {
    project = null;
  }

  if (!project) notFound();

  // Related: fetch same-industry case studies
  const industry = project?.industry as string | undefined;
  let related: Record<string, unknown>[] = [];
  try {
    const res = await fetch(
      `${baseUrl}/api/v1/case-studies?lang=${locale}&limit=4${industry ? `&industry=${industry}` : ""}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const json = await res.json();
      related = (Array.isArray(json.data) ? json.data : []).filter(
        (p: Record<string, unknown>) => p.slug !== slug
      );
    }
  } catch {
    related = [];
  }

  return <CaseStudyDetailClient locale={locale} project={project} relatedProjects={related.slice(0, 3)} />;
}
