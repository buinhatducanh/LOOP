/**
 * Booking (Legacy) — LOOP Solutions
 * Route: /vi/booking, /en/booking, /ja/booking, /ko/booking, /zh/booking
 * Redirects to /{locale}/thiet-ke-website
 */
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<{ title: string; robots: { index: boolean; follow: boolean } }> {
  return { title: "Thiết kế Website", robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/thiet-ke-website`);
}
