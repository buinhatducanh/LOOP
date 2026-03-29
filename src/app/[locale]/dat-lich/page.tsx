/**
 * Dat lich (Booking Wizard) Page — LOOP Solutions
 * Route: /vi/dat-lich, /en/dat-lich, /ja/dat-lich, /ko/dat-lich, /zh/dat-lich
 * Redirects to /{locale}/booking (the canonical booking wizard route)
 */
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function DatLichPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/booking`);
}
