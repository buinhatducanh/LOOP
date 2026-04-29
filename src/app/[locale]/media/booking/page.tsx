/**
 * Media Booking / Quotation — LOOP Solutions
 * Route: /[locale]/media/booking
 * Provides a 3-step wizard for media service quotation.
 */
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { MediaQuotationClient } from "@/components/landing/media/MediaQuotationClient";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  return { 
    title: t("mediaBookingTitle") || "Báo giá Media",
    description: t("mediaBookingDescription") || "Nhận báo giá dịch vụ media chuyên nghiệp từ LOOP Solutions."
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MediaBookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<div style={{ minHeight: "80vh", background: "#0B0F1A" }} />}>
      <MediaQuotationClient locale={locale} />
    </Suspense>
  );
}
