/**
 * Resources Page — LOOP Solutions
 * Content hub: guides, checklists, ebooks
 * 2026-04-11
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DS } from "@/lib/design-tokens";
import ResourcesClient from "./ResourcesClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  return {
    title: t("resourcesTitle"),
    description: t("resourcesDescription"),
    alternates: { canonical: `${baseUrl}/${locale}/resources` },
    openGraph: {
      title: `${t("resourcesTitle")} — LOOP Solutions`,
      description: t("resourcesDescription"),
      url: `${baseUrl}/${locale}/resources`,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((l) => ({ locale: l }));
}

export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);
  return <ResourcesClient locale={locale} />;
}
