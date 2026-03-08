import type { Metadata } from "next";
import { getServices } from "@/lib/db/queries";
import { services as mockServices } from "@/data/mockData";
import { ServicesPage } from "./services-page";
import JsonLd from "@/components/seo/JsonLd";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('servicesTitle'),
    description: t('servicesDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/services` },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  let services;
  try {
    const dbServices = await getServices();
    services = dbServices.length > 0 ? dbServices.map((s) => ({
      id: s.slug, icon: s.icon, title: s.title, shortDescription: s.shortDescription,
      longDescription: s.longDescription, features: s.features, technologies: s.technologies,
      startingPrice: s.startingPrice, deliveryTime: s.deliveryTime, category: s.category,
    })) : mockServices;
  } catch {
    services = mockServices;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": services.map((s, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": s.title,
        "description": s.shortDescription,
        "url": `https://loop.vn/services/${s.id}`,
        "provider": {
          "@type": "Organization",
          "name": "LOOP"
        }
      }
    }))
  };

  const tFaq = await getTranslations({ locale, namespace: 'ServicesPage' });
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
      <JsonLd data={jsonLd} />
      <JsonLd data={faqSchema} />
      <ServicesPage services={services} />
    </>
  );
}
