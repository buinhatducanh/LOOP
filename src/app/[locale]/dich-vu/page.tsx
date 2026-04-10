/**
 * Pricing Page — /dich-vu
 * Server component: fetches pricing config, passes to client component.
 * Standalone pricing page (no wizard) — khách xem báo giá mà không cần đặt lịch.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import type { PricingConfig } from "@/lib/types/booking";
import { DichVuClient } from "./client";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = tSeo("servicesTitle") ?? "Dịch vụ";
  const description = tSeo("servicesDescription") ?? "Báo giá dịch vụ website — chọn gói, tùy chỉnh tính năng.";
  const canonical = `${baseUrl}/${locale}/dich-vu`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} | LOOP Solutions`,
      description,
      url: canonical,
      images: [{ url: `/api/og?type=service&locale=${locale}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | LOOP Solutions`,
      description,
      images: [`/api/og?type=service&locale=${locale}`],
    },
  };
}

async function fetchPricingConfig(locale: string): Promise<PricingConfig | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
    const res = await fetch(`${base}/api/pricing/config?lang=${locale}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DichVuPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const config = await fetchPricingConfig(locale);

  return (
    <DichVuClient
      config={config}
      locale={locale}
    />
  );
}
