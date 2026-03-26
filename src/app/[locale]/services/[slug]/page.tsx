/**
 * Service Detail Page — LOOP Solutions
 * Phase 0 i18n: wired to DB, ServiceDetailPage namespace
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { mapLocalizedService } from "@/lib/i18n/localization";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: "Dịch vụ thiết kế Website | LOOP",
    alternates: { canonical: `${baseUrl}/${locale}/services` },
  };
}

type DetailProps = { params: Promise<{ locale: string; slug: string }> };

export default async function ServiceDetailPage({ params }: DetailProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const t = await getTranslations("ServiceDetailPage");
  const tNav = await getTranslations("Navigation");

  const raw = await prisma.service.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true, shortDescription: true,
      longDescription: true, category: true, features: true,
      technologies: true, startingPrice: true, deliveryTime: true,
    },
  });

  if (!raw) notFound();

  const service = mapLocalizedService(raw, resolvedLocale);

  const relatedServices = await prisma.service.findMany({
    where: {
      isActive: true,
      category: raw.category,
      NOT: { slug },
    },
    select: { id: true, slug: true, title: true, shortDescription: true, category: true },
    take: 3,
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        padding: "5rem 2rem 4rem",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", opacity: 0.6, fontSize: "0.875rem" }}>
            <a href={`/${locale}`} style={{ color: "inherit", textDecoration: "none" }}>{tNav("home")}</a>
            <span>›</span>
            <a href={`/${locale}/services`} style={{ color: "inherit", textDecoration: "none" }}>{tNav("services")}</a>
            <span>›</span>
            <span>{service.title as string}</span>
          </div>
          <span style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.3)",
            color: "#a5b4fc",
            padding: "0.25rem 1rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}>
            {(service.category as string) ?? ""}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.1 }}>
            {service.title as string}
          </h1>
          {(service.shortDescription as string) && (
            <p style={{ fontSize: "1.125rem", opacity: 0.85, maxWidth: "600px", lineHeight: 1.7 }}>
              {service.shortDescription as string}
            </p>
          )}
          <div style={{ display: "flex", gap: "2rem", marginTop: "2rem", flexWrap: "wrap" }}>
            {(service.startingPrice as string) && (
              <div>
                <p style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("startingFrom")}</p>
                <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>{service.startingPrice as string}</p>
              </div>
            )}
            {(service.deliveryTime as string) && (
              <div>
                <p style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("delivery")}</p>
                <p style={{ fontWeight: 800, fontSize: "1.25rem" }}>{service.deliveryTime as string}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Long description */}
        {(service.longDescription as string) && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              {t("aboutTitle")} <span style={{ color: "#6366f1" }}>{t("aboutHighlight")}</span>
            </h2>
            <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.8 }}>
              {service.longDescription as string}
            </p>
          </section>
        )}

        {/* Features */}
        {Array.isArray(service.features) && service.features.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              {t("includedTitle")} <span style={{ color: "#6366f1" }}>{t("includedHighlight")}</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.75rem" }}>
              {(service.features as string[]).map((feature, i) => (
                <div key={i} style={{
                  background: "#f1f5f9",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.9375rem",
                  color: "#334155",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}>
                  <span style={{ color: "#6366f1", fontWeight: 700 }}>✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technologies */}
        {Array.isArray(service.technologies) && service.technologies.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              {t("techUsed")}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(service.technologies as string[]).map((tech, i) => (
                <span key={i} style={{
                  background: "#e0e7ff",
                  color: "#4338ca",
                  padding: "0.25rem 0.875rem",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "white",
          borderRadius: "1rem",
          padding: "2.5rem",
          textAlign: "center",
          marginBottom: "3rem",
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.75rem" }}>
            {t("ctaTitle")}
          </h2>
          <p style={{ opacity: 0.9, marginBottom: "1.5rem" }}>{t("ctaDesc")}</p>
          <a href={`/${locale}/contact`} style={{
            display: "inline-block",
            padding: "0.875rem 2.5rem",
            background: "white",
            color: "#6366f1",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 800,
          }}>
            {t("requestQuote")}
          </a>
        </section>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <section>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem" }}>
              {t("relatedTitle")} <span style={{ color: "#6366f1" }}>{t("relatedHighlight")}</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {relatedServices.map((s) => {
                const ls = mapLocalizedService(s, resolvedLocale);
                return (
                  <a
                    key={s.id}
                    href={`/${locale}/services/${s.slug}`}
                    style={{
                      display: "block",
                      padding: "1rem 1.25rem",
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    <p style={{ fontWeight: 700, color: "#0f172a" }}>{ls.title as string}</p>
                    {(s.shortDescription as string) && (
                      <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                        {(s.shortDescription as string).slice(0, 100)}...
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
