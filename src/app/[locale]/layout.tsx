/**
 * [locale] Root Layout — LOOP Solutions
 * Wraps all locale-prefixed pages with next-intl provider and
 * locale-aware metadata (hreflang, html lang, etc.).
 *
 * NOTE: This layout is for FE pages. The backend API-only app
 * does NOT use this layout. API routes remain at /api/* without locale prefix.
 */

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();

  const seo = (messages as Record<string, Record<string, string>>).seo ?? {};
  const title = seo.defaultTitle ?? "LOOP Agency";
  const description = seo.defaultDescription ?? "";

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
        routing.locales.map((loc: string) => [loc, `${baseUrl}/${loc}`])
      ),
    },
    openGraph: {
      siteName: seo.siteName ?? "LOOP Agency",
      locale: locale,
      alternateLocale: routing.locales.filter((loc: string) => loc !== locale),
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale — show 404 for invalid locales
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
