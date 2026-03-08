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

export default async function Page() {
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

  return (
    <>
      <JsonLd data={jsonLd} />
      <ServicesPage services={services} />
    </>
  );
}
