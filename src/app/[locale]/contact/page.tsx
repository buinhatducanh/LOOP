import type { Metadata } from "next";
import { ContactPage } from "./contact-page";
import JsonLd from "@/components/seo/JsonLd";
import { getSiteSettings } from "@/lib/db/queries";

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

export default async function Page() {
  const settings = await getSiteSettings();

  const email = settings.contact_email || "hello@loop.vn";
  const phone = settings.contact_phone || "+84 888 123 456";
  const address = settings.contact_address || "Ho Chi Minh City, Vietnam";
  const workingHours = settings.working_hours || "Mon - Fri, 9:00 AM - 6:00 PM (GMT+7)";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["ContactPage", "LocalBusiness"],
    name: "LOOP - Liên hệ",
    description: "Khách hàng có thể liên hệ LOOP qua Hotline, Email hoặc trực tiếp tại địa chỉ Công ty ở TPHCM.",
    url: "https://loop.vn/contact",
    telephone: phone,
    email: email,
    address: {
      "@type": "PostalAddress",
      addressLocality: address,
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
      <ContactPage
        contactInfo={{
          email,
          phone,
          address,
          workingHours,
        }}
      />
    </>
  );
}
