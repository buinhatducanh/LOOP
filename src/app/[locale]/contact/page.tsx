import type { Metadata } from "next";
import { ContactPage } from "./contact-page";
import JsonLd from "@/components/seo/JsonLd";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('contactTitle'),
    description: t('contactDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/contact` },
  };
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["ContactPage", "LocalBusiness"],
    name: "LOOP - Liên hệ",
    description: "Khách hàng có thể liên hệ LOOP qua Hotline, Email hoặc trực tiếp tại địa chỉ Công ty ở TPHCM.",
    url: "https://loop.vn/contact",
    telephone: "+84 888 123 456",
    email: "hello@loop.vn",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ho Chi Minh City",
      addressCountry: "VN",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ContactPage />
    </>
  );
}
