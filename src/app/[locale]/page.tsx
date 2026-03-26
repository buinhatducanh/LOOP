/**
 * [locale] Home Page — LOOP Solutions
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const tHero = await getTranslations("home.hero");
  const tStats = await getTranslations("home.stats");
  const tServices = await getTranslations("home.services");
  const tPortfolio = await getTranslations("home.portfolio");
  const tCta = await getTranslations("home.cta");

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: "6rem 2rem", textAlign: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff" }}>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          {tHero("title")}
        </h1>
        <p style={{ fontSize: "1.25rem", marginBottom: "2rem", opacity: 0.9 }}>
          {tHero("subtitle")}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <a
            href={`/${locale}/contact`}
            style={{ padding: "0.75rem 2rem", background: "#fff", color: "#667eea", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}
          >
            {tHero("cta")}
          </a>
          <a
            href={`/${locale}/portfolio`}
            style={{ padding: "0.75rem 2rem", border: "2px solid #fff", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
          >
            {tHero("ctaSecondary")}
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "4rem 2rem", background: "#f9f9f9" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "2rem", textAlign: "center" }}>
          {[
            { value: "100+", label: tStats("projects") },
            { value: "50+", label: tStats("clients") },
            { value: "20+", label: tStats("awards") },
            { value: "5+", label: tStats("years") },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#667eea" }}>{stat.value}</div>
              <div style={{ color: "#666", marginTop: "0.5rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services CTA */}
      <section style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{tServices("title")}</h2>
        <p style={{ color: "#666", marginBottom: "2rem" }}>{tServices("subtitle")}</p>
        <a
          href={`/${locale}/services`}
          style={{ padding: "0.75rem 2rem", background: "#667eea", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
        >
          {tServices("cta")}
        </a>
      </section>

      {/* Portfolio CTA */}
      <section style={{ padding: "5rem 2rem", background: "#667eea", color: "#fff", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{tPortfolio("title")}</h2>
        <p style={{ opacity: 0.9, marginBottom: "2rem" }}>{tPortfolio("subtitle")}</p>
        <a
          href={`/${locale}/portfolio`}
          style={{ padding: "0.75rem 2rem", border: "2px solid #fff", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
        >
          {tPortfolio("cta")}
        </a>
      </section>

      {/* Contact CTA */}
      <section style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{tCta("title")}</h2>
        <p style={{ color: "#666", marginBottom: "2rem" }}>{tCta("subtitle")}</p>
        <a
          href={`/${locale}/contact`}
          style={{ padding: "0.75rem 2rem", background: "#333", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
        >
          {tCta("button")}
        </a>
      </section>
    </div>
  );
}
