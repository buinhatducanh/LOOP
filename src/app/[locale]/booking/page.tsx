/**
 * Booking / Nhận báo giá Website — LOOP Solutions
 * Route: /vi/booking, /en/booking, /ja/booking, /ko/booking, /zh/booking
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const title = t("bookingTitle") || "Nhận báo giá Website";
  const description = t("bookingDescription") || "Nhận báo giá chi tiết cho thiết kế website. Wizard 3 bước chọn gói phù hợp.";
  const ogImage = t("ogImage");
  const brandMetaTitle = t("brandMetaTitle");
  const canonical = `${baseUrl}/${locale}/booking`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        vi: "/vi/booking",
        en: "/en/booking",
        ja: "/ja/booking",
        ko: "/ko/booking",
        zh: "/zh/booking",
      },
    },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description,
      url: canonical,
      images: [{ url: ogImage || "/og-cover.jpg", width: 1200, height: 630, alt: "LOOP Solutions Booking" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description,
      images: [ogImage || "/og-cover.jpg"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#020617" }} />}>
      <BookingWizardClient locale={locale} />
    </Suspense>
  );
}
