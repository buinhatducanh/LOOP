/**
 * Pricing Page — LOOP Solutions
 * Wired to GET /api/v1/pricing (database via Prisma)
 * Fallback: renders static cards if API unavailable (PricingPlan has no i18n fields — uses i18n translation keys)
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const title = tSeo("pricingTitle");
  const description = tSeo("pricingDescription");
  const brandMetaTitle = tSeo("brandMetaTitle");
  const brandMetaDescription = tSeo("brandMetaDescription");
  const ogImage = tSeo("ogImage");
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
      images: [{ url: ogImage || "/og-cover.jpg", width: 1200, height: 630, alt: "LOOP Solutions" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      images: [ogImage || "/og-cover.jpg"],
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
    // Fallback to static display if DB unavailable
    plans = [];
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        padding: "5rem 2rem 4rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.3)",
            border: "1px solid rgba(99,102,241,0.5)",
            color: "#a5b4fc",
            padding: "0.25rem 1rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}>
            {t("badge")}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, marginBottom: "0.75rem", lineHeight: 1.1 }}>
            {t("heroTitle1")} <span style={{ color: "#818cf8" }}>{t("heroHighlight")}</span>
          </h1>
          <p style={{ fontSize: "1.0625rem", opacity: 0.85, maxWidth: "540px", margin: "0 auto" }}>
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        {plans.length === 0 ? (
          /* Static fallback when DB has no plans */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "stretch" }}>
            <PricingCard
              name="Starter"
              price="$500"
              period="/ project"
              desc={t("starterDesc")}
              features={[t("feat1"), t("feat2"), t("feat3"), t("feat4")]}
              cta={t("btnContact")}
              ctaLink={`/${locale}/contact`}
              highlight={false}
            />
            <PricingCard
              name="Professional"
              price="$1,500"
              period="/ project"
              desc={t("comparisonDesc")}
              features={[t("feat1"), t("feat2"), t("feat3"), t("feat4"), t("feat5"), t("feat6"), t("feat7")]}
              cta={t("btnContact")}
              ctaLink={`/${locale}/contact`}
              highlight={true}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              desc={t("deploymentDesc")}
              features={[t("feat1"), t("feat2"), t("feat3"), t("feat4"), t("feat5"), t("feat6"), t("feat7"), t("feat8")]}
              cta={t("btnContact")}
              ctaLink={`/${locale}/contact`}
              highlight={false}
            />
          </div>
        ) : (
          /* Dynamic cards from DB */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "stretch" }}>
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                name={plan.name}
                price={plan.price != null ? `$${plan.price.toLocaleString()}` : "Custom"}
                period={plan.period}
                desc={plan.tagline}
                features={plan.features}
                cta={plan.cta || t("btnContact")}
                ctaLink={`/${locale}/contact`}
                highlight={plan.highlighted}
              />
            ))}
          </div>
        )}
      </section>

      {/* Feature comparison */}
      <section style={{ padding: "4rem 2rem", background: "white" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.5rem" }}>
            {t("comparisonTitle")} <span style={{ color: "#6366f1" }}>{t("comparisonHighlight")}</span>
          </h2>
          <p style={{ color: "#64748b", marginBottom: "2.5rem" }}>{t("comparisonDesc")}</p>
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[t("feat1"), t("feat2"), t("feat3"), t("feat4"), t("feat5"), t("feat6"), t("feat7"), t("feat8")].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                <span style={{ color: "#10b981", fontSize: "1.25rem" }}>✓</span>
                <span style={{ color: "#374151", fontSize: "0.9375rem" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hosting */}
      <section style={{ padding: "4rem 2rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.5rem" }}>
            {t("hostingTitle")} <span style={{ color: "#6366f1" }}>{t("hostingHighlight")}</span>
          </h2>
          <p style={{ color: "#64748b", marginBottom: "2rem" }}>{t("hostingDesc")}</p>
          <a href={`/${locale}/contact`} style={{
            display: "inline-block",
            padding: "0.875rem 2.5rem",
            background: "#6366f1",
            color: "white",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 800,
          }}>
            {t("ctaEnterprise")}
          </a>
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  name, price, period, desc, features, cta, ctaLink, highlight,
}: {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlight: boolean;
}) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "white",
      color: highlight ? "white" : "#0f172a",
      borderRadius: "1.25rem",
      padding: "2rem",
      border: highlight ? "none" : "1px solid #e2e8f0",
      boxShadow: highlight ? "0 20px 40px rgba(99,102,241,0.3)" : "0 1px 3px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      transform: highlight ? "scale(1.03)" : "none",
    }}>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "0.5rem" }}>{name}</h3>
      <div style={{ marginBottom: "1rem" }}>
        <span style={{ fontSize: "2.5rem", fontWeight: 900 }}>{price}</span>
        {period && <span style={{ opacity: 0.7, fontSize: "0.875rem" }}>{period}</span>}
      </div>
      <p style={{ fontSize: "0.875rem", opacity: highlight ? 0.9 : 0.7, marginBottom: "1.5rem", lineHeight: 1.5 }}>
        {desc}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem" }}>
            <span style={{ color: highlight ? "#fde68a" : "#10b981", fontWeight: 700 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={ctaLink}
        style={{
          display: "block",
          textAlign: "center",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.9375rem",
          background: highlight ? "white" : "#6366f1",
          color: highlight ? "#6366f1" : "white",
        }}
      >
        {cta}
      </a>
    </div>
  );
}
