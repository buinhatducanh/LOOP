/**
 * About Page — LOOP Solutions
 * Phase 0 i18n: wired to AboutPage namespace
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  const title = tSeo("aboutTitle");
  const description = tSeo("aboutDescription");
  const brandMetaTitle = tSeo("brandMetaTitle");
  const brandMetaDescription = tSeo("brandMetaDescription");
  const ogImage = tSeo("ogImage");
  const canonical = `${baseUrl}/${locale}/about`;

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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("AboutPage");

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        padding: "6rem 2rem 4rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.3)",
            border: "1px solid rgba(99,102,241,0.5)",
            color: "#a5b4fc",
            padding: "0.25rem 1rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}>
            {t("badge")}
          </span>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, marginBottom: "1.5rem", lineHeight: 1.1 }}>
            {t("heroTitle1")} <span style={{ color: "#818cf8" }}>{t("heroHighlight")}</span>
          </h1>
          <p style={{ fontSize: "1.125rem", opacity: 0.85, maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ padding: "5rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: "#6366f1", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            {t("storyTitle")}
          </p>
          <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a" }}>
            {t("storyHighlight")}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <p style={{ color: "#475569", fontSize: "1.0625rem", lineHeight: 1.8 }}>
            {t("storyP1")}
          </p>
          <p style={{ color: "#475569", fontSize: "1.0625rem", lineHeight: 1.8 }}>
            {t("storyP2")}
          </p>
          <p style={{ color: "#475569", fontSize: "1.0625rem", lineHeight: 1.8 }}>
            {t("storyP3")}
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section style={{ padding: "4rem 2rem", background: "white" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: "🎯", title: t("val1Title"), desc: t("val1Desc") },
              { icon: "💡", title: t("val2Title"), desc: t("val2Desc") },
              { icon: "🤝", title: t("val3Title"), desc: t("val3Desc") },
              { icon: "🌍", title: t("val4Title"), desc: t("val4Desc") },
            ].map((v, i) => (
              <div key={i} style={{
                background: "#f8fafc",
                borderRadius: "1rem",
                padding: "1.75rem",
                border: "1px solid #e2e8f0",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{v.icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>{v.title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "5rem 2rem",
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "white",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1rem" }}>
            {t("ctaTitle")}
          </h2>
          <p style={{ opacity: 0.9, marginBottom: "2rem" }}>
            {t("ctaSub")}
          </p>
          <a href={`/${locale}/contact`} style={{
            display: "inline-block",
            padding: "0.875rem 2.5rem",
            background: "white",
            color: "#6366f1",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 800,
          }}>
            {t("btnContact")}
          </a>
        </div>
      </section>
    </div>
  );
}
