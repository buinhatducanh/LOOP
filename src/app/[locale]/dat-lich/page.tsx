/**
 * Dat lich (Booking Wizard) — LOOP Solutions
 * Route: /vi/dat-lich, /en/dat-lich, /ja/dat-lich, /ko/dat-lich, /zh/dat-lich
 * Legacy alias — redirects to /{locale}/thiet-ke-website
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await import(`@/i18n/messages/${locale}.json`).then(m => m.default);
  const title = t?.seo?.bookingTitle ?? "Thiết kế Website";
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function DatLichPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/thiet-ke-website`);
}
