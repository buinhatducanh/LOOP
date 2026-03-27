/**
 * Portfolio Detail Page — LOOP Solutions
 * Dark Figma design, server component → Prisma → Client
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { mapLocalizedProject } from "@/lib/i18n/localization";
import { ProjectDetailClient } from "@/components/landing/ProjectDetailClient";

type Props = { params: Promise<{ locale: string }> };
type DetailProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: "Dự án đã thực hiện | LOOP",
    alternates: { canonical: `${baseUrl}/${locale}/portfolio` },
  };
}

export default async function PortfolioDetailPage({ params }: DetailProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const tNav = await getTranslations("Navigation");
  const tCta = await getTranslations("ProjectDetailPage");

  const raw = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true, description: true,
      category: true, client: true, year: true, image: true,
      techStack: true, features: true, results: true, screenshots: true,
    },
  });

  if (!raw) notFound();

  const project = mapLocalizedProject(raw, resolvedLocale);

  return (
    <ProjectDetailClient
      locale={locale}
      project={project}
      tNav={tNav as unknown as Record<string, string>}
      tCta={tCta as unknown as Record<string, string>}
    />
  );
}
