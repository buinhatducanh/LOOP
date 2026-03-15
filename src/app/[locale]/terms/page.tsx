import type { Metadata } from "next";
import { TermsPage } from "./terms-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('termsTitle'),
    description: t('termsDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/terms` },
  };
}

export default async function Page() {
  return <TermsPage />;
}
