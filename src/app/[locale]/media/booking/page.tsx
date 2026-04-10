/**
 * Media Booking Page — LOOP Solutions
 * Route: /[locale]/media/booking
 * Public booking form for media production services.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Suspense } from "react";
import { MediaBookingFormClient } from "@/components/landing/MediaBookingFormClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  return {
    title: t("mediaBookingTitle"),
    description: t("mediaBookingDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/media/booking`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/media/booking`])),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MediaBookingPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0C0C14" }} />}>
      <MediaBookingFormClient locale={locale} />
    </Suspense>
  );
}
