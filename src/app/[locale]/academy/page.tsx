import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { AcademyClient } from "@/components/landing/AcademyClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: t("academyTitle") || "Academy | LOOP",
    description: t("academyDescription") || "Khóa học chuyên sâu từ LOOP Academy",
    alternates: { canonical: `${baseUrl}/${locale}/academy` },
  };
}

export default async function AcademyPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  return <AcademyClient locale={locale} />;
}
