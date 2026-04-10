import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { WhyUsClient } from "@/components/landing/WhyUsClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await import(`@/i18n/messages/${locale}.json`, { assert: { type: "json" } });
  return {
    title: (t as unknown as { seo: { whyUsTitle: string; whyUsDescription: string } }).seo.whyUsTitle,
    description: (t as unknown as { seo: { whyUsDescription: string } }).seo.whyUsDescription,
  };
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function WhyUsPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  return <WhyUsClient locale={locale} />;
}
