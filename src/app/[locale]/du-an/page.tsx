/**
 * Du an (Portfolio) Page — LOOP Solutions
 * Route: /vi/du-an, /en/du-an, /ja/du-an, /ko/du-an, /zh/du-an
 * Redirects to /{locale}/portfolio (the canonical portfolio route)
 */
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function DuAnPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/portfolio`);
}
