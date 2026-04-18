/**
 * Thiết kế Website — LOOP Solutions
 * Route: /vi/thiet-ke-website, /en/thiet-ke-website, /ja/thiet-ke-website, /ko/thiet-ke-website, /zh/thiet-ke-website
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Suspense } from "react";
import { BookingWizardClient } from "@/components/landing/BookingWizardClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const tBooking = await getTranslations("BookingPage");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = t("bookingTitle") || "Thiết kế Website";
  const description = tBooking("heroDesc") || "Wizard 3 bước chọn gói Website phù hợp. Báo giá minh bạch, không phí ẩn. Tặng 500 LP khi đăng ký.";
  const _ogImage = t("ogImage");
  const brandMetaTitle = t("brandMetaTitle");
  const canonical = `${baseUrl}/${locale}/thiet-ke-website`;
  const dynamicOgImage = `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&type=booking&locale=${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        vi: "/vi/thiet-ke-website",
        en: "/en/thiet-ke-website",
        ja: "/ja/thiet-ke-website",
        ko: "/ko/thiet-ke-website",
        zh: "/zh/thiet-ke-website",
      },
    },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description,
      url: canonical,
      images: [{ url: dynamicOgImage, width: 1200, height: 630, alt: "LOOP Solutions Thiết kế Website" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description,
      images: [dynamicOgImage],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ThietKeWebsitePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#020617" }} />}>
      <BookingWizardClient locale={locale} />
    </Suspense>
  );
}
