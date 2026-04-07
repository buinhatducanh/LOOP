/**
 * Pricing Page — LOOP Solutions
 * Wired to GET /api/v1/pricing (database via Prisma)
 * Fallback: renders static cards if API unavailable (PricingPlan has no i18n fields — uses i18n translation keys)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const title = tSeo("pricingTitle");
  const description = tSeo("pricingDescription");
  const brandMetaTitle = tSeo("brandMetaTitle");
  const brandMetaDescription = tSeo("brandMetaDescription");
  const _ogImage = tSeo("ogImage");
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

  // Fetch pricing plans from DB — PricingPlan has no i18n fields, render with i18n text
  let plans: Array<{
    id: string;
    slug: string;
    name: string;
    price: number | null;
    period: string;
    tagline: string;
    features: string[];
    notIncluded: string[];
    highlighted: boolean;
    cta: string;
    color: string;
  }> = [];

  try {
    plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    plans = [];
  }

  const hasDbPlans = plans.length > 0;

  // Static fallback plans (used when DB is empty)
  const staticPlans = [
    {
      name: t("planStarter"),
      price: t("planStarterPrice"),
      period: t("planStarterPeriod"),
      tagline: t("starterDesc"),
      features: [t("feat1"), t("feat2"), t("feat3"), t("feat4")],
      highlighted: false,
    },
    {
      name: t("planProfessional"),
      price: t("planProfessionalPrice"),
      period: t("planProfessionalPeriod"),
      tagline: t("comparisonDesc"),
      features: [t("feat1"), t("feat2"), t("feat3"), t("feat4"), t("feat5"), t("feat6"), t("feat7")],
      highlighted: true,
    },
    {
      name: t("planEnterprise"),
      price: t("planEnterprisePrice"),
      period: "",
      tagline: t("deploymentDesc"),
      features: [t("feat1"), t("feat2"), t("feat3"), t("feat4"), t("feat5"), t("feat6"), t("feat7"), t("feat8")],
      highlighted: false,
    },
  ];

  const displayPlans = hasDbPlans
    ? plans.map((p) => ({
        name: p.name,
        price: p.price != null ? `$${p.price.toLocaleString()}` : t("planCustom"),
        period: p.period,
        tagline: p.tagline,
        features: p.features,
        highlighted: p.highlighted,
      }))
    : staticPlans;

  const allFeatures = [t("feat1"), t("feat2"), t("feat3"), t("feat4"), t("feat5"), t("feat6"), t("feat7"), t("feat8")];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_110%)] opacity-30" />

        {/* Radial glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
          >
            {t("badge")}
          </Badge>

          <h1 className="mb-6 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("heroTitle1")}{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {t("heroHighlight")}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {displayPlans.map((plan, i) => (
            <Card
              key={i}
              className={`relative flex flex-col border-slate-800 bg-slate-900/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted
                  ? "border-indigo-500/60 shadow-[0_0_60px_-12px_rgba(99,102,241,0.4)] ring-1 ring-indigo-500/30"
                  : "hover:border-slate-700"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    {t("mostPopular")}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-xl font-bold text-white">
                  {plan.name}
                </CardTitle>
                <CardDescription className="pt-2 text-slate-400">
                  {plan.tagline}
                </CardDescription>
                <div className="pt-4">
                  <span className="font-heading text-4xl font-black text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-sm text-slate-400">
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-sm text-slate-300">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  asChild
                  className={`w-full font-bold transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <Link href={`/${locale}/contact`}>{t("btnContact")}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="border-t border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-heading text-3xl font-black text-white sm:text-4xl">
              {t("comparisonTitle")}{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {t("comparisonHighlight")}
              </span>
            </h2>
            <p className="text-slate-400">{t("comparisonDesc")}</p>
          </div>

          <div className="space-y-3">
            {allFeatures.map((feat, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur transition-colors hover:border-slate-700"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-200">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hosting & Enterprise CTA */}
      <section className="border-t border-slate-800 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
            <div className="h-[300px] w-[600px] rounded-full bg-purple-600/10 blur-[100px]" />
          </div>

          <div className="relative">
            <h2 className="mb-4 font-heading text-3xl font-black text-white sm:text-4xl">
              {t("hostingTitle")}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("hostingHighlight")}
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-400">
              {t("hostingDesc")}
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-pink-500"
            >
              <Link href={`/${locale}/contact`}>{t("ctaEnterprise")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
