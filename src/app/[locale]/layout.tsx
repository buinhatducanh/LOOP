/**
 * [locale] Root Layout — LOOP Solutions
 * Wraps all locale-prefixed pages with next-intl provider and
 * locale-aware metadata (hreflang, html lang, etc.).
 *
 * NOTE: This layout is for FE pages. The backend API-only app
 * does NOT use this layout. API routes remain at /api/* without locale prefix.
 *
 * IMPORTANT: Locale is read from next-intl context (getLocale), NOT from params,
 * because params.locale is undefined during static prerendering.
 * next-intl provides locale context through NextIntlClientProvider.
 */

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Locale from params for metadata generation (params ARE available in generateMetadata)
  const { locale } = await params;

  let messages;
  try {
    messages = await getMessages();
  } catch {
    messages = {};
  }

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
        (routing.locales as unknown as string[]).map((loc: string) => [loc, `${baseUrl}/${loc}`])
      ),
    },
    openGraph: {
      siteName: seo.siteName ?? "LOOP Agency",
      locale: locale,
      alternateLocale: (routing.locales as unknown as string[]).filter((loc: string) => loc !== locale),
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  // Locale from params for validation
  const { locale } = await params;

  // Validate locale — show 404 for invalid locales
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Load messages — locale resolved from request context (params or cookie)
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
