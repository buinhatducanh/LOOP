import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import JsonLd from '@/components/seo/JsonLd';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/json-ld';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

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
      images: [
        {
          url: "/api/og?title=LOOP&description=Công+ty+thiết+kế+website+và+ứng+dụng+chuyên+nghiệp&type=website",
          width: 1200,
          height: 630,
          alt: "LOOP - Web Development Agency",
        },
      ],
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="theme-color" content="#020617" />
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

