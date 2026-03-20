import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import JsonLd from '@/components/seo/JsonLd';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL("https://loop.vn"),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico" },
      ],
    },
    title: {
      default: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
      template: "%s | LOOP",
    },
    description:
      "LOOP - Công ty thiết kế website thương mại, ứng dụng di động, phần mềm quản lý doanh nghiệp. Tối ưu SEO, hiệu suất cao, hỗ trợ 24/7.",
    keywords: [
      "thiết kế website", "làm website", "website thương mại điện tử",
      "ứng dụng di động", "phần mềm quản lý", "web development", "LOOP",
    ],
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "vi_VN",
      alternateLocale: locale === "en" ? "vi_VN" : "en_US",
      siteName: "LOOP",
      title: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
      description: "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý. Cam kết SEO top Google, hiệu suất 95+.",
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "LOOP - Web Development Agency" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
      description: "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý doanh nghiệp.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
    },
    alternates: {
      canonical: `https://loop.vn/${locale}`,
      languages: { "vi": "https://loop.vn/vi", "en": "https://loop.vn/en", "x-default": "https://loop.vn" },
    },
  };
}

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="theme-color" content="#020617" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LOOP",
          url: "https://loop.vn",
          logo: "https://loop.vn/logo.png",
          description: "Công ty thiết kế website và ứng dụng chuyên nghiệp",
          foundingDate: "2016",
          numberOfEmployees: { "@type": "QuantitativeValue", value: 50 },
          sameAs: ["https://facebook.com/loop.vn", "https://linkedin.com/company/loop-vn"],
        }} />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "LOOP",
          url: "https://loop.vn",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://loop.vn/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
