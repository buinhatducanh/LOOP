/**
 * Booking / Đặt lịch Page — LOOP Solutions
 * Route: /vi/booking, /en/booking, /ja/booking, /ko/booking, /zh/booking
 */
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BookingWizardClient } from "@/components/landing/BookingWizardClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: `Booking Wizard — LOOP Solutions`,
    description: `Book our professional services with our 8-step pricing wizard.`,
    alternates: { canonical: `${baseUrl}/${locale}/booking` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingWizardClient locale={locale} />;
}
