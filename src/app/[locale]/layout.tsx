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
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/json-ld";
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
  // Use seo.homeTitle as default — business-facing tagline (not tech tagline)
  const homeTitle = seo.homeTitle ?? "LOOP Solutions";
  const title = seo.defaultTitle ?? homeTitle;
  const description = seo.defaultDescription ?? "LOOP Solutions platform with server-first architecture, AI-driven workflows, and edge-ready delivery.";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const ogImage = `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&locale=${locale}`;
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? "";
  const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? "";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: homeTitle,
      // Clean short template — "LOOP" fits any page title width
      template: `%s | LOOP`,
    },
    description,
    keywords: seo.keywords ?? [
      "thiết kế website", "web app", "SaaS", "dashboard", "SEO",
      "website design", "web application", "agency Vietnam",
    ],
    authors: [{ name: "LOOP Solutions" }],
    creator: "LOOP Solutions",
    publisher: "LOOP Solutions",
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        (routing.locales).map((loc: string) => [loc, `${baseUrl}/${loc}`])
      ),
    },
    openGraph: {
      siteName: "LOOP",
      title: title,
      description: description,
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
      title: title,
      description: description,
      images: [ogImage],
    },
    // ── Icons — all via metadata.icons (Next.js App Router requirement) ─────
    icons: {
      icon: [
        { url: `${baseUrl}/favicon.svg`, type: "image/svg+xml" },
        { url: `${baseUrl}/favicon.ico` },
      ],
      apple: [
        { url: `${baseUrl}/icon-192.svg` },
      ],
    },
    // PWA manifest
    manifest: `${baseUrl}/manifest.json`,
    // ── Geo tags ────────────────────────────────────────────────────────────
    other: {
      "geo.region": "VN",
      "geo.placename": "Ho Chi Minh City",
      "ICBM": "10.7769, 106.7009",
      // Google Search Console ownership verification
      ...(gscVerification ? { "google-site-verification": gscVerification } : {}),
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
  const organizationJsonLd = buildOrganizationJsonLd();
  const websiteJsonLd = buildWebSiteJsonLd();
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? "";

  return (
    // "dark" class activates Figma dark theme CSS variables from figma-theme.css
    <html lang={locale} suppressHydrationWarning className="dark">
      <body
        style={{ margin: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}
        className={`dark ${getFontClass(locale)}`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}

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
