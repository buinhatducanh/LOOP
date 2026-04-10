/**
 * Testimonials Page — LOOP Solutions
 * Dedicated testimonials page beyond homepage
 * 2026-04-11
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DS, GRD } from "@/lib/design-tokens";
import TestimonialsClient from "./TestimonialsClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  return {
    title: t("testimonialsTitle"),
    description: t("testimonialsDescription"),
    alternates: { canonical: `${baseUrl}/${locale}/testimonials` },
    openGraph: {
      title: `${t("testimonialsTitle")} — LOOP Solutions`,
      description: t("testimonialsDescription"),
      url: `${baseUrl}/${locale}/testimonials`,
      images: [{ url: `/api/og?type=service&locale=${locale}`, width: 1200, height: 630 }],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((l) => ({ locale: l }));
}

export default async function TestimonialsPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  // Fetch testimonials from DB
  let testimonials: {
    id: string; name: string; role: string; company: string;
    avatar: string; rating: number; text: string;
    companyEn?: string | null;
  }[] = [];
  try {
    const { prisma } = await import("@/lib/prisma");
    testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 50,
    });
  } catch {
    testimonials = [];
  }

  // Fetch projects for case study testimonials
  let caseStudyProjects: {
    id: string; title: string; client: string; results: string; image: string;
    titleEn?: string | null; resultsEn?: string | null;
  }[] = [];
  try {
    const { prisma } = await import("@/lib/prisma");
    caseStudyProjects = await prisma.project.findMany({
      where: { isPublished: true, isCaseStudy: true },
      orderBy: { sortOrder: "asc" },
      take: 20,
    });
  } catch {
    caseStudyProjects = [];
  }

  return (
    <TestimonialsClient
      locale={locale}
      testimonials={testimonials.map(t => ({
        ...t,
        company: t.companyEn && locale !== "vi" ? t.companyEn : t.company,
      }))}
      caseStudyProjects={caseStudyProjects}
    />
  );
}