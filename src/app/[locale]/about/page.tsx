import type { Metadata } from "next";
import { AboutPage } from "./about-page";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('aboutTitle'),
    description: t('aboutDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/about` },
  };
}

export default function Page() {
  return <AboutPage />;
}
