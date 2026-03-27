/**
 * Privacy Policy Page — LOOP Solutions
 * Route: /[locale]/privacy
 * i18n keys: PrivacyPage namespace in messages/*.json
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    alternates: { canonical: `${baseUrl}/${locale}/privacy` },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("PrivacyPage");
  const tNav = await getTranslations("Navigation");

  const sections = [
    {
      title: t("section1Title"),
      paragraphs: [t("section1P1"), t("section1P2")],
    },
    {
      title: t("section2Title"),
      paragraphs: [t("section2P1")],
      items: [t("section2Item1"), t("section2Item2"), t("section2Item3"), t("section2Item4"), t("section2Item5")],
    },
    {
      title: t("section3Title"),
      paragraphs: [t("section3P1")],
      items: [t("section3Item1"), t("section3Item2"), t("section3Item3"), t("section3Item4")],
    },
    {
      title: t("section4Title"),
      paragraphs: [t("section4P1"), t("section4P2")],
    },
    {
      title: t("section5Title"),
      paragraphs: [t("section5P1")],
      items: [t("section5Item1"), t("section5Item2"), t("section5Item3")],
    },
    {
      title: t("section6Title"),
      paragraphs: [t("section6P1"), t("section6P2")],
    },
    {
      title: t("section7Title"),
      paragraphs: [t("section7P1")],
    },
    {
      title: t("section8Title"),
      paragraphs: [t("section8P1")],
      items: [t("section8Item1"), t("section8Item2"), t("section8Item3")],
    },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        padding: "5rem 2rem 4rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Breadcrumb */}
          <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "1rem", letterSpacing: "0.05em" }}>
            <a href={`/${locale}`} style={{ color: "inherit", textDecoration: "none" }}>{t("breadcrumbHome")}</a>
            {" / "}{t("breadcrumbPrivacy")}
          </p>
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
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.1 }}>
            {t("heroTitle1")} <span style={{ color: "#818cf8" }}>{t("heroHighlight")}</span>
          </h1>
          <p style={{ fontSize: "1rem", opacity: 0.85, maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
            {t("heroDesc")}
          </p>
          <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "1rem" }}>{t("lastUpdated")}</p>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2rem" }}>
        {sections.map((section, i) => (
          <section key={i} style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              {section.title}
            </h2>
            {section.paragraphs.map((p, j) => (
              <p key={j} style={{ color: "#374151", lineHeight: 1.8, marginBottom: "0.75rem", fontSize: "0.9375rem" }}>
                {p}
              </p>
            ))}
            {section.items && section.items.length > 0 && (
              <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {section.items.map((item, k) => (
                  <li key={k} style={{ color: "#374151", fontSize: "0.9375rem", lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "2rem 2rem 4rem", background: "#f8fafc" }}>
        <p style={{ color: "#6B7280", marginBottom: "1rem", fontSize: "0.9375rem" }}>
          Câu hỏi khác?
        </p>
        <a
          href={`/${locale}/contact`}
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "#6366f1",
            color: "white",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9375rem",
          }}
        >
          {tNav("contact")}
        </a>
      </section>
    </div>
  );
}
