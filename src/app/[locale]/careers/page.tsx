import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CareersClient } from "@/components/landing/CareersClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await import(`@/i18n/messages/${locale}.json`, { assert: { type: "json" } });
  return {
    title: (t as unknown as { seo: { careersTitle: string; careersDescription: string } }).seo.careersTitle,
    description: (t as unknown as { seo: { careersDescription: string } }).seo.careersDescription,
  };
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  return <CareersClient locale={locale} />;
}
