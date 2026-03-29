/**
 * [locale] Root Layout — LOOP Solutions
 * Wraps all locale-prefixed pages with next-intl provider,
 * shared SiteHeader + SiteFooter, and locale-aware metadata.
 *
 * NOTE: This layout is for FE pages. The backend API-only app
 * does NOT use this layout. API routes remain at /api/* without locale prefix.
 */

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { getFontClass } from "@/lib/fonts";
import "@/styles/figma-theme.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  let messages;
  try {
    messages = await getMessages();
  } catch {
    messages = {};
  }

  const seo = (messages as Record<string, Record<string, string>>).seo ?? {};
  const title = seo.defaultTitle ?? "LOOP Solutions — Server-first + AI-driven + Edge-ready";
  const description = seo.defaultDescription ?? "LOOP Solutions platform with server-first architecture, AI-driven workflows, and edge-ready delivery.";
  const brandMetaTitle = seo.brandMetaTitle ?? "Server-first + AI-driven + Edge-ready";
  const brandMetaDescription = seo.brandMetaDescription ?? "Server-first architecture, AI-driven execution, edge-ready delivery for scalable digital products.";
  const ogImage = seo.ogImage ?? "/og-cover.jpg";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        (routing.locales).map((loc: string) => [loc, `${baseUrl}/${loc}`])
      ),
    },
    openGraph: {
      siteName: seo.siteName ?? "LOOP Solutions",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription,
      url: `${baseUrl}/${locale}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "LOOP Solutions",
        },
      ],
      locale: locale,
      alternateLocale: (routing.locales).filter((loc: string) => loc !== locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription,
      images: [ogImage],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    // "dark" class activates Figma dark theme CSS variables from figma-theme.css
    <html lang={locale} suppressHydrationWarning className="dark">
      <body
        style={{ margin: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}
        className={`dark ${getFontClass(locale)}`}
      >
        <NextIntlClientProvider messages={messages}>
          <SiteHeader locale={locale} />
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <SiteFooter locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
