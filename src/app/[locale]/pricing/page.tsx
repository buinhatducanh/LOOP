import type { Metadata } from "next";
import { getPricingPlans } from "@/lib/db/queries";
import JsonLd from "@/components/seo/JsonLd";
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

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
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

  const tFaq = await getTranslations({ locale, namespace: 'PricingPage' });
  const faqs = [
    { q: tFaq("faq1_q"), a: tFaq("faq1_a") },
    { q: tFaq("faq2_q"), a: tFaq("faq2_a") },
    { q: tFaq("faq3_q"), a: tFaq("faq3_a") },
    { q: tFaq("faq4_q"), a: tFaq("faq4_a") },
    { q: tFaq("faq5_q"), a: tFaq("faq5_a") },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <PricingPage plans={plans} />
    </>
  );
}
