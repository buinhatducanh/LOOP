/**
 * Bảng Giá Dịch Vụ — /dich-vu
 * Server Component: fetches ServiceTiers + ServiceAttributes, builds SEO metadata + Schema.org.
 * Clients call /api/services/pricing (cached 5 min).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DichVuClient } from "./client";

type Props = { params: Promise<{ locale: string }> };

// ── SEO Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const canonical = `${baseUrl}/${locale}/dich-vu`;

  const title = locale === "vi"
    ? "Bảng Giá Dịch Vụ Web, App, Dashboard, SEO | LOOP Solutions"
    : locale === "en"
    ? "Web, App, Dashboard & SEO Service Pricing | LOOP Solutions"
    : locale === "ja"
    ? "ウェブ、アプリ、SEOサービス料金表 | LOOP Solutions"
    : locale === "ko"
    ? "웹, 앱, 대시보드, SEO 서비스 가격표 | LOOP Solutions"
    : "网页、应用、仪表盘和SEO服务价格表 | LOOP Solutions";

  const description = locale === "vi"
    ? "Xem bảng giá chi tiết 4 dịch vụ: Website, App/SaaS, Dashboard, SEO — mỗi dịch vụ 3 cấp Basic / Business / Experience. Basic từ 3.9M, Business từ 5.9M. Miễn phí SSL, bảo hành."
    : locale === "en"
    ? "View detailed pricing for 4 services: Website, App/SaaS, Dashboard, SEO — each with 3 tiers: Basic, Business, Experience. Basic from $160, Business from $240."
    : locale === "ja"
    ? "4つのサービス（ウェブサイト、アプリ/SaaS、SEO、CRM）の料金表。3つのプラン：Basic、Business、Experience。"
    : locale === "ko"
    ? "웹사이트, 앱/SaaS, 대시보드, SEO 4가지 서비스의 가격표를 확인하세요. Basic, Business, Experience 3단계로 제공됩니다."
    : "查看网页、应用、SaaS、SEO、CRM服务的价格表，包含Basic、Business、Experience三个级别。";

  const keywords = locale === "vi"
    ? "bảng giá website, giá thiết kế app, giá dashboard, giá SEO, LOOP Solutions, báo giá web, giá web từ 3.9M"
    : "web design pricing, app development cost, SEO service price, LOOP Solutions";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        vi: `/vi/dich-vu`,
        en: `/en/dich-vu`,
        ja: `/ja/dich-vu`,
        ko: `/ko/dich-vu`,
        zh: `/zh/dich-vu`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: [{ url: `/api/og?type=service&locale=${locale}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?type=service&locale=${locale}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

// ── Fetch data ─────────────────────────────────────────────────────────────────

async function fetchPricingData() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
    const res = await fetch(`${base}/api/services/pricing`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Schema.org Structured Data ────────────────────────────────────────────────

function buildSchemaOrg(_tiers: Array<{ name: string; basePrice: number; serviceKey: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Bảng Giá Dịch Vụ LOOP Solutions",
    description: "Bảng giá chi tiết 4 dịch vụ: Website, App/SaaS, Dashboard, SEO",
    url: "https://www.loops.vn/vi/dich-vu",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: "https://www.loops.vn/vi" },
        { "@type": "ListItem", position: 2, name: "Bảng Giá Dịch Vụ", item: "https://www.loops.vn/vi/dich-vu" },
      ],
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DichVuPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const data = await fetchPricingData();

  // Build schema
  const schema = buildSchemaOrg(data?.tiers ?? []);

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <DichVuClient data={data} locale={locale} />
    </>
  );
}
