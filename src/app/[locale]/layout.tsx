import type { Metadata } from "next";
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { PublicShell } from '@/components/layout/PublicShell';
import { SpeedDial } from '@/components/shared/SpeedDial';
import { TawktoChat } from '@/components/shared/TawktoChat';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { getSiteSettings, getServices } from '@/lib/db/queries';

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
    getSiteSettings(),
    getServices().catch(() => []),
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
      <SpeedDial />
      <TawktoChat />
    </>
  );
}
