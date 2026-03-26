/**
 * Portfolio Page — LOOP Solutions
 * Public page at /[locale]/portfolio
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedProject } from "@/lib/i18n/localization";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  return {
    title: t("portfolioTitle"),
    description: t("portfolioDescription"),
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("PortfolioPage");
  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let projects: unknown[] = [];

  try {
    const raw = await prisma.project.findMany({
      where: { isPublished: true },
      select: {
        id: true, slug: true, title: true, description: true,
        category: true, client: true, year: true,
        image: true,
      },
      orderBy: { year: "desc" },
    });
    projects = raw.map((p) => mapLocalizedProject(p, resolvedLocale));
  } catch {
    projects = [];
  }

  const categories = ["All", ...new Set(
    projects.map((p) => (p as Record<string, unknown>).category as string).filter(Boolean)
  )];

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

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <p style={{ color: "#9CA3AF", textAlign: "center", padding: "3rem" }}>
          {t("noResults")}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {projects.map((project) => {
            const p = project as Record<string, unknown>;
            return (
              <a
                key={p.id as string}
                href={`/${locale}/portfolio/${p.slug}`}
                style={{ display: "block", borderRadius: "12px", overflow: "hidden", textDecoration: "none", color: "inherit", border: "1px solid #E5E7EB", transition: "box-shadow 0.2s, transform 0.2s" }}
              >
                {/* Cover Image */}
                <div style={{ height: "200px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.image ? (
                    <img src={p.image as string} alt={p.title as string} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "3rem", opacity: 0.3 }}>🏗</span>
                  )}
                </div>
                {/* Content */}
                <div style={{ padding: "1.25rem" }}>
                  {!!p.category && typeof p.category === "string" && (
                    <p style={{ fontSize: "0.75rem", color: "#3B82F6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                      {p.category}
                    </p>
                  )}
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    {p.title as string}
                  </h2>
                  {!!p.description && typeof p.description === "string" && (
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.description}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {!!p.client && typeof p.client === "string" && (
                      <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                        {p.client}
                      </span>
                    )}
                    {!!p.year && typeof p.year === "string" && (
                      <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                        {p.year}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
