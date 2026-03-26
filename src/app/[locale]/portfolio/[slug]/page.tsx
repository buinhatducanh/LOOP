/**
 * Portfolio Detail Page — LOOP Solutions
 * Phase 0 i18n: wired to DB, ProjectDetailPage namespace
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { mapLocalizedProject } from "@/lib/i18n/localization";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function PortfolioDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const t = await getTranslations("ProjectDetailPage");
  const tNav = await getTranslations("Navigation");

  const raw = await prisma.project.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, title: true, description: true,
      category: true, client: true, year: true, image: true,
      techStack: true, features: true, results: true, screenshots: true,
    },
  });

  if (!raw) notFound();

  const project = mapLocalizedProject(raw, resolvedLocale);

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
            <a href={`/${locale}/portfolio`} style={{ color: "inherit", textDecoration: "none" }}>{tNav("portfolio")}</a>
            <span>›</span>
            <span>{project.title as string}</span>
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
            {(project.category as string) ?? ""}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.1 }}>
            {project.title as string}
          </h1>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1rem" }}>
            {(project.client as string) && (
              <div>
                <p style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("client")}</p>
                <p style={{ fontWeight: 700 }}>{project.client as string}</p>
              </div>
            )}
            {(project.year as string) && (
              <div>
                <p style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("year")}</p>
                <p style={{ fontWeight: 700 }}>{project.year as string}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Screenshots */}
      {Array.isArray(project.screenshots) && (project.screenshots as string[]).length > 0 && (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
            {(project.screenshots as string[]).map((shot, i) => (
              <div key={i} style={{ borderRadius: "0.75rem", overflow: "hidden", background: "#1e293b", minHeight: "240px" }}>
                <img src={shot} alt={`Screenshot ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: "240px" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        {/* Description */}
        {(project.description as string) && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              {t("aboutTitle")} <span style={{ color: "#6366f1" }}>{t("aboutHighlight")}</span>
            </h2>
            <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.8 }}>
              {project.description as string}
            </p>
          </section>
        )}

        {/* Results */}
        {(project.results as string) && (
          <section style={{ marginBottom: "2.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "1rem", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#166534", marginBottom: "0.75rem" }}>{t("results")}</h2>
            <p style={{ color: "#15803d", lineHeight: 1.7 }}>{project.results as string}</p>
          </section>
        )}

        {/* Tech Stack */}
        {Array.isArray(project.techStack) && (project.techStack as string[]).length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>{t("techStack")}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(project.techStack as string[]).map((tech, i) => (
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

        {/* Key Features */}
        {Array.isArray(project.features) && (project.features as string[]).length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
              {t("keyFeatures")} <span style={{ color: "#6366f1" }}>{t("keyFeaturesHighlight")}</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {(project.features as string[]).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "#6366f1", fontWeight: 700 }}>✓</span>
                  <span style={{ color: "#475569" }}>{f}</span>
                </div>
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
        }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 900, marginBottom: "0.75rem" }}>
            {t("ctaInterested")}
          </h2>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`/${locale}/contact`} style={{
              padding: "0.75rem 2rem",
              background: "white",
              color: "#6366f1",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 800,
            }}>
              {t("getQuote")}
            </a>
            <a href={`/${locale}/services`} style={{
              padding: "0.75rem 2rem",
              border: "2px solid rgba(255,255,255,0.5)",
              color: "white",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
            }}>
              {t("viewService")}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
