import type { Metadata } from "next";
import { getPricingPlans } from "@/lib/db/queries";
import { pricingPlans as mockPlans } from "@/data/mockData";
import { PricingPage } from "./pricing-page";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('pricingTitle'),
    description: t('pricingDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/pricing` },
  };
}

export default async function Page() {
  let plans: any;
  try {
    const dbPlans = await getPricingPlans();
    plans = dbPlans.length > 0 ? dbPlans.map((p) => ({
      id: p.slug, name: p.name, price: p.price, period: p.period,
      tagline: p.tagline, features: p.features, notIncluded: p.notIncluded,
      highlighted: p.highlighted, cta: p.cta, color: p.color,
    })) : mockPlans;
  } catch {
    plans = mockPlans;
  }
  return <PricingPage plans={plans} />;
}
