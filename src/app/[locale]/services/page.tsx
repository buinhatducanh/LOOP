/**
 * Services Page — LOOP Solutions
 * Public page at /[locale]/services
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedService } from "@/lib/i18n/localization";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
  };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("ServicesPage");

  // Resolve effective locale for data fetching
  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let services: unknown[] = [];

  try {
    const raw = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, title: true, shortDescription: true,
        longDescription: true, category: true, features: true,
        technologies: true, startingPrice: true, deliveryTime: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    services = raw.map((s) => mapLocalizedService(s, resolvedLocale));
  } catch {
    services = [];
  }

  const categories = [...new Set(services.map((s) => (s as Record<string, unknown>).category as string))];

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.875rem", color: "#3B82F6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("badge")}
        </p>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t("heroTitle1")}{" "}
          <span style={{ color: "#3B82F6" }}>{t("heroHighlight")}</span>
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#6B7280", maxWidth: "640px" }}>
          {t("heroDesc")}
        </p>
      </div>

      {/* CTA */}
      <div style={{ marginBottom: "3rem" }}>
        <a
          href={`/${locale}/contact`}
          style={{ display: "inline-block", padding: "0.75rem 1.5rem", background: "#3B82F6", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}
        >
          {t("btnQuote")}
        </a>
      </div>

      {/* Process */}
      <div style={{ marginBottom: "4rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t("processTitle1")}{" "}
          <span style={{ color: "#3B82F6" }}>{t("processHighlight")}</span>
        </h2>
        <p style={{ color: "#6B7280", marginBottom: "2rem" }}>{t("processDesc")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {[
            { n: "1", title: t("step1Title"), desc: t("step1Desc") },
            { n: "2", title: t("step2Title"), desc: t("step2Desc") },
            { n: "3", title: t("step3Title"), desc: t("step3Desc") },
            { n: "4", title: t("step4Title"), desc: t("step4Desc") },
          ].map((step) => (
            <div key={step.n} style={{ padding: "1.5rem", border: "1px solid #E5E7EB", borderRadius: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#EFF6FF", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.125rem", marginBottom: "1rem" }}>
                {step.n}
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{step.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services by Category */}
      {categories.length === 0 ? (
        <p style={{ color: "#9CA3AF", textAlign: "center", padding: "3rem" }}>
          No services available.
        </p>
      ) : (
        categories.map((cat) => {
          const catServices = services.filter((s) => (s as Record<string, unknown>).category === cat);
          return (
            <div key={cat} style={{ marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #3B82F6" }}>
                {cat}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {catServices.map((svc) => {
                  const s = svc as Record<string, unknown>;
                  return (
                    <a
                      key={s.id as string}
                      href={`/${locale}/services/${s.slug}`}
                      style={{ display: "block", padding: "1.5rem", border: "1px solid #E5E7EB", borderRadius: "12px", textDecoration: "none", color: "inherit", transition: "box-shadow 0.2s" }}
                    >
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        {s.title as string}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.75rem" }}>
                        {(s.shortDescription as string) ?? ""}
                      </p>
                      {s.startingPrice !== null && s.startingPrice !== undefined && (
                        <p style={{ fontSize: "0.875rem", color: "#3B82F6", fontWeight: 600 }}>
                          {(s.startingPrice as number) === 0
                            ? "Included"
                            : `From ${(s.startingPrice as number).toLocaleString()} VND`}
                        </p>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* FAQ */}
      <div style={{ marginTop: "4rem", padding: "2rem", background: "#F9FAFB", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          {t("faqTitle1")}{" "}
          <span style={{ color: "#3B82F6" }}>{t("faqHighlight")}</span>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { q: t("faq1_q"), a: t("faq1_a") },
            { q: t("faq2_q"), a: t("faq2_a") },
            { q: t("faq3_q"), a: t("faq3_a") },
            { q: t("faq4_q"), a: t("faq4_a") },
            { q: t("faq5_q"), a: t("faq5_a") },
          ].map((faq, i) => (
            <div key={i}>
              <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{faq.q}</p>
              <p style={{ color: "#6B7280", fontSize: "0.9375rem" }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
