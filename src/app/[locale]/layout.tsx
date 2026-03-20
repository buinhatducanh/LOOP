import type { Metadata } from "next";
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { routing } from '@/i18n/routing';
import { PublicShell } from '@/components/layout/PublicShell';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { getCachedSiteSettings, getCachedServices } from '@/lib/db/queries';

// Layout-level ISR — revalidates every hour.
// The footer data (services + settings) rarely changes, so caching it here
// prevents redundant DB queries on every page load across all public routes.
export const revalidate = 3600;

// Lazy-load third-party chat widget — only loads after page is interactive
const TawktoChat = dynamic(
  () => import('@/components/shared/TawktoChat').then((m) => ({ default: m.TawktoChat }))
);

// Lazy-load speed dial — reduces initial bundle
const SpeedDial = dynamic(
  () => import('@/components/shared/SpeedDial').then((m) => ({ default: m.SpeedDial }))
);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `https://loop.vn/${locale}`,
      languages: {
        "vi": "https://loop.vn/vi",
        "en": "https://loop.vn/en",
        "x-default": "https://loop.vn",
      }
    }
  };
}

export default async function LocaleLayout({
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

  const [siteSettings, dbServices] = await Promise.all([
    getCachedSiteSettings(),
    getCachedServices().catch(() => []),
  ]);

  const footerData = {
    services: dbServices.length > 0
      ? dbServices.map((s) => ({ slug: s.slug, title: s.title }))
      : [],
    settings: siteSettings,
  };

  // No <html>/<head>/<body> here — those live in src/app/layout.tsx
  // NextIntlClientProvider lives in src/app/layout.tsx (root) for synchronous availability
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID ?? ""} />
      <PublicShell footerData={footerData}>
        {children}
      </PublicShell>
      {/* Lazy-loaded: render after page is interactive to reduce initial bundle */}
      <Suspense fallback={null}>
        <SpeedDial />
      </Suspense>
      <Suspense fallback={null}>
        <TawktoChat />
      </Suspense>
    </>
  );
}
