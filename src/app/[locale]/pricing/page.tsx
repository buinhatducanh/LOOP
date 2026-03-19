import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { PricingPage } from "./pricing-page";
import { getPricingPackagesData } from "@/lib/db/queries";
import { getTranslations } from "next-intl/server";
import { getPricingPackagesData } from "@/lib/db/queries";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { PricingPage } from "./pricing-page";

export const revalidate = 300; // ISR 5 phút

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

  const dbData = await getPricingPackagesData();

  const pricingData = {
    webPackages: dbData.webPackages.map((p) => ({
      id: p.slug,
      name: p.name,
      nameVi: p.nameVi,
      tagline: p.tagline,
      taglineVi: p.taglineVi,
      price: p.price,
      currency: p.currency as "VND",
      period: p.period,
      periodVi: p.periodVi,
      highlighted: p.highlighted,
      cta: p.cta,
      ctaVi: p.ctaVi,
      color: p.color,
      pages: p.pages,
      pagesVi: p.pagesVi,
    })),
    featureCategories: dbData.featureCategories.map((c) => ({
      id: c.slug,
      name: c.name,
      nameVi: c.nameVi,
      features: c.features.map((f) => ({
        id: f.id,
        name: f.name,
        nameVi: f.nameVi,
        tooltip: f.tooltip ?? undefined,
        tooltipVi: f.tooltipVi ?? undefined,
        values: f.values as Record<string, boolean | string>,
      })),
    })),
    hostingPlans: dbData.hostingPlans.map((h) => ({
      id: h.slug,
      name: h.name,
      nameVi: h.nameVi,
      price: h.price,
      period: h.period,
      periodVi: h.periodVi,
      features: h.features,
      featuresVi: h.featuresVi,
      highlighted: h.highlighted,
      color: h.color,
    })),
    domainPrices: dbData.domainPrices.map((d) => ({
      extension: d.extension,
      registrationPrice: d.registrationPrice,
      renewalPrice: d.renewalPrice,
      period: d.period,
      periodVi: d.periodVi,
      note: d.note ?? undefined,
      noteVi: d.noteVi ?? undefined,
    })),
    deploymentItems: dbData.deploymentItems.map((i) => ({
      id: i.slug,
      title: i.title,
      titleVi: i.titleVi,
      description: i.description,
      descriptionVi: i.descriptionVi,
      handedToClient: i.handedToClient,
      icon: i.icon,
      note: i.note ?? undefined,
      noteVi: i.noteVi ?? undefined,
    })),
  };

  const tFaq = await getTranslations({ locale, namespace: 'PricingPage' });
  const faqs = [
    { q: tFaq("faq1_q"), a: tFaq("faq1_a") },
    { q: tFaq("faq2_q"), a: tFaq("faq2_a") },
    { q: tFaq("faq3_q"), a: tFaq("faq3_a") },
    { q: tFaq("faq4_q"), a: tFaq("faq4_a") },
    { q: tFaq("faq5_q"), a: tFaq("faq5_a") },
    { q: tFaq("faq6_q"), a: tFaq("faq6_a") },
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
      <PricingPage
        locale={locale}
        webPackages={pricingData.webPackages}
        featureCategories={pricingData.featureCategories}
        hostingPlans={pricingData.hostingPlans}
        domainPrices={pricingData.domainPrices}
        deploymentItems={pricingData.deploymentItems}
      />
    </>
  );
}
