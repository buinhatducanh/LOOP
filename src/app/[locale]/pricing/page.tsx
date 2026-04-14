/**
 * Pricing Page — LOOP Solutions
 * Toggle between "Dịch vụ" (service cards) and "Gói Web" (web purchase wizard).
 * Service cards wired to GET /api/v1/pricing (database via Prisma).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PricingModeToggle } from "@/components/landing/PricingModeToggle";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { locale } = await params;
 const tSeo = await getTranslations("seo");
 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
 const title = tSeo("pricingTitle");
 const description = tSeo("pricingDescription");
 const brandMetaTitle = tSeo("brandMetaTitle");
 const brandMetaDescription = tSeo("brandMetaDescription");
 const canonical = `${baseUrl}/${locale}/pricing`;

 return {
 title,
 description,
 alternates: { canonical },
 openGraph: {
 type: "website",
 title: `${title} — ${brandMetaTitle}`,
 description: brandMetaDescription || description,
 url: canonical,
 images: [{ url: `/api/og?type=service&locale=${locale}`, width: 1200, height: 630, alt: "LOOP Solutions" }],
 },
 twitter: {
 card: "summary_large_image",
 title: `${title} — ${brandMetaTitle}`,
  description: brandMetaDescription || description,
 images: [`/api/og?type=service&locale=${locale}`],
 },
 };
}

export default async function PricingPage({ params }: Props) {
 const { locale } = await params;
 if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
 setRequestLocale(locale);

 const t = await getTranslations("PricingPage");

 // Check if user is authenticated (for wizard)
 let isAuthenticated = false;
 try {
 const { getSession } = await import("@/lib/auth/permissions");
 const session = await getSession();
 isAuthenticated = !!session;
 } catch { /* non-critical */ }

 const translations = {
 // Web wizard
 heroTitle: t("heroTitle1"),
 heroSubtitle: t("heroDesc"),
 stepType: t("stepType"),
 stepPackage: t("stepPackage"),
 stepDomain: t("stepDomain"),
 stepHosting: t("stepHosting"),
 stepSummary: t("stepSummary"),
 typeTitle: t("typeTitle"),
 typeTemplate: t("typeTemplate"),
 typeTemplateDesc: t("typeTemplateDesc"),
 typeCustom: t("typeCustom"),
 typeCustomDesc: t("typeCustomDesc"),
 selectPackage: t("selectPackage"),
 searchDomain: t("searchDomain"),
 searchPlaceholder: t("searchPlaceholder"),
 selectHosting: t("selectHosting"),
 termMonths: t("termMonths"),
  term6mo: t("term6mo"),
 term12mo: t("term12mo"),
 term24mo: t("term24mo"),
 monthly: t("monthly"),
 yearly: t("yearly"),
 summaryTitle: t("summaryTitle"),
 orderNow: t("orderNow"),
 total: t("total"),
 template: t("template"),
 domain: t("domain"),
 hosting: t("hosting"),
 years: t("years"),
 months12: t("months12"),
 months24: t("months24"),
 checking: t("checking"),
 available: t("available"),
 unavailable: t("unavailable"),
 noPackage: t("noPackage"),
 noHosting: t("noHosting"),
 back: t("back"),
 next: t("next"),
  required: t("required"),
 invalidEmail: t("invalidEmail"),
 successTitle: t("successTitle"),
 successDesc: t("successDesc"),
 successOrderNum: t("successOrderNum"),
 successTotal: t("successTotal"),
 viewOrders: t("viewOrders"),
 confirm: t("confirm"),
 // Static cards
 badge: t("badge"),
 heroHighlight: t("heroHighlight"),
 comparisonTitle: t("comparisonTitle"),
 comparisonHighlight: t("comparisonHighlight"),
 comparisonDesc: t("comparisonDesc"),
 mostPopular: t("mostPopular"),
 planStarter: t("planStarter"),
 planStarterPrice: t("planStarterPrice"),
 planStarterPeriod: t("planStarterPeriod"),
 planStarterFeatures: t("planStarterFeatures"),
 planProfessional: t("planProfessional"),
 planProfessionalPrice: t("planProfessionalPrice"),
 planProfessionalPeriod: t("planProfessionalPeriod"),
 planProfessionalFeatures: t("planProfessionalFeatures"),
  planEnterprise: t("planEnterprise"),
 planEnterprisePrice: t("planEnterprisePrice"),
 planEnterprisePeriod: t("planEnterprisePeriod"),
 planEnterpriseFeatures: t("planEnterpriseFeatures"),
 planCustom: t("planCustom"),
 deploymentDesc: t("deploymentDesc"),
  hostingTitle: t("hostingTitle"),
 hostingHighlight: t("hostingHighlight"),
 hostingDesc: t("hostingDesc"),
 ctaEnterprise: t("ctaEnterprise"),
 btnContact: t("btnContact"),
 feat1: t("feat1"),
 feat2: t("feat2"),
 feat3: t("feat3"),
 feat4: t("feat4"),
 feat5: t("feat5"),
 feat6: t("feat6"),
 feat7: t("feat7"),
 feat8: t("feat8"),
 };

 return (
 <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
 {/* Background grid */}
 <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_110%)] opacity-30" />
 <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
 <div className="h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
 </div>

 <div className="relative mx-auto max-w-5xl px-6 py-16">
 {/* Page header */}
 <div className="mb-12 text-center">
 <h1 className="mb-4 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl">
 {t("heroTitle1")}
 </h1>
 <p className="mx-auto max-w-xl text-lg text-slate-300">{t("heroDesc")}</p>
 </div>

 {/* Mode toggle + content */}
 <PricingModeToggle
 locale={locale}
 isAuthenticated={isAuthenticated}
 t={translations}
 />
 </div>
 </div>
 );
}
