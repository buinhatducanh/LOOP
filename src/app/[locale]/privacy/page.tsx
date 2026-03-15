import type { Metadata } from "next";
import { PrivacyPage } from "./privacy-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('privacyTitle'),
    description: t('privacyDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/privacy` },
  };
}

export default async function Page() {
  return <PrivacyPage />;
}
