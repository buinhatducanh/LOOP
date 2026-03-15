import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import JsonLd from '@/components/seo/JsonLd';
import { PublicShell } from '@/components/layout/PublicShell';
import { SpeedDial } from '@/components/shared/SpeedDial';
import { TawktoChat } from '@/components/shared/TawktoChat';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { getServices, getSiteSettings } from '@/lib/db/queries';
import "../globals.css";

const baseMetadata: Metadata = {
  metadataBase: new URL("https://loop.vn"),
  title: {
    default: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
    template: "%s | LOOP",
  },
  description:
    "LOOP - Công ty thiết kế website thương mại, ứng dụng di động, phần mềm quản lý doanh nghiệp. Tối ưu SEO, hiệu suất cao, hỗ trợ 24/7.",
  keywords: [
    "thiết kế website",
    "làm website",
    "website thương mại điện tử",
    "ứng dụng di động",
    "phần mềm quản lý",
    "web development",
    "LOOP",
  ],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: "en_US",
    siteName: "LOOP",
    title: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
    description:
      "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý. Cam kết SEO top Google, hiệu suất 95+.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LOOP - Web Development Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
    description:
      "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý doanh nghiệp.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
  alternates: {
    canonical: "https://loop.vn",
    languages: {
      "vi": "https://loop.vn/vi",
      "en": "https://loop.vn/en",
      "x-default": "https://loop.vn",
    }
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    ...baseMetadata,
    alternates: {
      canonical: `https://loop.vn/${locale}`,
      languages: {
        "vi": "https://loop.vn/vi",
        "en": "https://loop.vn/en",
        "x-default": "https://loop.vn",
      }
    }
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const tFooter = await getTranslations({ locale, namespace: 'Footer' });

  const [messages, footerServices, siteSettings] = await Promise.all([
    getMessages(),
    getServices().catch(() => []),
    getSiteSettings(),
  ]);

  const footerData = {
    services: footerServices.length > 0
      ? footerServices.slice(0, 6).map((s) => ({ slug: s.slug, title: s.title }))
      : [
          { slug: "web-development", title: tFooter("serviceWeb") },
          { slug: "mobile-apps", title: tFooter("serviceMobile") },
          { slug: "ui-ux-design", title: tFooter("serviceDesign") },
          { slug: "cloud-solutions", title: tFooter("serviceCloud") },
          { slug: "ai-ml", title: tFooter("serviceAI") },
          { slug: "devops", title: tFooter("serviceDevops") },
        ],
    settings: siteSettings,
  };

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#020617" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LOOP",
          url: "https://loop.vn",
          logo: "https://loop.vn/logo.png",
          description: "Công ty thiết kế website và ứng dụng chuyên nghiệp",
          foundingDate: "2016",
          numberOfEmployees: { "@type": "QuantitativeValue", value: 50 },
          sameAs: [
            "https://facebook.com/loop.vn",
            "https://linkedin.com/company/loop-vn",
          ],
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
          <PublicShell footerData={footerData}>
            {children}
          </PublicShell>
          <SpeedDial />
          <TawktoChat />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
