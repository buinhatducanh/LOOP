/**
 * [locale] Home Page — LOOP Solutions
 * Server component: exports metadata for SEO.
 * Client interactivity lives in HomeClient.tsx.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HomeClient } from "./HomeClient";

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
      url: `/${locale}`,
      siteName: "LOOP Solutions",
      locale: locale === "vi" ? "vi_VN" : locale === "en" ? "en_US" : locale,
      type: "website",
      images: [{ url: "/og-home.png", width: 1200, height: 630 }],
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
      images: ["/og-home.png"],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  return <HomeClient locale={locale} />;
}
