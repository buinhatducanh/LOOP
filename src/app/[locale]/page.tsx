/**
 * [locale] Home Page — LOOP Solutions
 * Server component: exports metadata for SEO.
 * Client interactivity lives in HomeClient.tsx.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Landing2Client from "../landing2/Landing2Client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTACT_SETTINGS } from "@/lib/constants";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const _t = await getTranslations({ locale, namespace: "seo" });
  const tHome = await getTranslations({ locale, namespace: "HomePage" });

  return {
    title: {
      default: tHome("homeTitle") || "LOOP Solutions — Digital Agency",
      template: `%s | LOOP Solutions`,
    },
    description: tHome("homeDescription") || "LOOP Solutions là đối tác công nghệ tin cậy — thiết kế, phát triển và vận hành giải pháp số toàn diện cho doanh nghiệp Việt Nam.",
    openGraph: {
      title: tHome("homeTitle") || "LOOP Solutions",
      description: tHome("homeDescription") || "Đối tác công nghệ tin cậy cho doanh nghiệp Việt Nam",
      url: `https://www.loops.vn/${locale}`,
      siteName: "LOOP Solutions",
      locale: locale === "vi" ? "vi_VN" : locale === "en" ? "en_US" : locale,
      type: "website",
      images: [{
        url: `/api/og?type=home&locale=${locale}`,
        width: 1200,
        height: 630,
        alt: "LOOP Solutions — Digital Agency",
      }],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        vi: "/vi",
        en: "/en",
        ja: "/ja",
        ko: "/ko",
        zh: "/zh",
      },
    },
    twitter: {
      card: "summary_large_image",
      title: tHome("homeTitle") || "LOOP Solutions",
      description: tHome("homeDescription") || "Đối tác công nghệ tin cậy cho doanh nghiệp Việt Nam",
      images: [`/api/og?type=home&locale=${locale}`],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  const dbSettings = await prisma.siteSetting.findMany({
    where: {
      group: "contact",
    },
  });

  const settings: Record<string, string> = { ...DEFAULT_CONTACT_SETTINGS };
  for (const s of dbSettings) {
    settings[s.key] = s.value;
  }

  const dbServices = await prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const dbFaqs = await prisma.faq.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const dbProjects = await prisma.project.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const dbPortfolioImages = await prisma.portfolioImage.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { row: "asc" },
      { sortOrder: "asc" },
      { createdAt: "desc" }
    ],
  });

  return (
    <Landing2Client
      locale={locale}
      settings={settings}
      dbServices={JSON.parse(JSON.stringify(dbServices))}
      dbFaqs={JSON.parse(JSON.stringify(dbFaqs))}
      dbProjects={JSON.parse(JSON.stringify(dbProjects))}
      dbPortfolioImages={JSON.parse(JSON.stringify(dbPortfolioImages))}
    />
  );
}
