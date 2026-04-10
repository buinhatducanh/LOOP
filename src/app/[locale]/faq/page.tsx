import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { FaqClient } from "@/components/landing/FaqClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");

  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: { canonical: `/${locale}/faq` },
    openGraph: {
      type: "website",
      title: t("faqTitle"),
      description: t("faqDescription"),
      url: `/${locale}/faq`,
    },
  };
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  let faqs: Array<{
    id: string;
    question: string | null;
    answer: string | null;
    category: string;
    sortOrder: number;
  }> = [];
  let categories: string[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/faq?lang=${locale}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const json = await res.json();
      faqs = json.data ?? [];
      categories = json.categories ?? [];
    }
  } catch {
    faqs = [];
    categories = [];
  }

  return <FaqClient locale={locale} initialFaqs={faqs} initialCategories={categories} />;
}
