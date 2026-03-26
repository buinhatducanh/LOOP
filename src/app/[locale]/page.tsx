/**
 * [locale] Home Page — LOOP Solutions
 * Phase 0 i18n: fully wired to DB for dynamic sections
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { mapLocalizedService } from "@/lib/i18n/localization";
import { mapLocalizedProject } from "@/lib/i18n/localization";
import { mapLocalizedTeamMember } from "@/lib/i18n/localization";

type Props = { params: Promise<{ locale: string }> };

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");
  const tStats = await getTranslations("Stats");
  const tWhy = await getTranslations("WhyUs");

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  // Fetch all sections in parallel
  const [services, projects, team, testimonials] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, title: true, shortDescription: true,
        category: true, startingPrice: true,
      },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    prisma.project.findMany({
      where: { isPublished: true },
      select: {
        id: true, slug: true, title: true, description: true,
        category: true, client: true, year: true, image: true,
      },
      orderBy: { year: "desc" },
      take: 6,
    }),
    prisma.teamMember.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, name: true, role: true,
        shortBio: true, image: true, roleLevel: true,
      },
      orderBy: { roleLevel: "asc" },
      take: 8,
    }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, role: true, company: true,
        text: true, avatar: true, rating: true,
      },
      take: 6,
    }),
  ]);

  const localizedServices = services.map((s) => mapLocalizedService(s, resolvedLocale));
  const localizedProjects = projects.map((p) => mapLocalizedProject(p, resolvedLocale));
  const localizedTeam = team.map((m) => mapLocalizedTeamMember(m, resolvedLocale));

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        color: "#fff",
        textAlign: "center",
        padding: "6rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.3)",
            border: "1px solid rgba(99,102,241,0.5)",
            color: "#a5b4fc",
            padding: "0.375rem 1.25rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "2rem",
            letterSpacing: "0.05em",
          }}>
            {t("badge")}
          </span>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem" }}>
            {t("heroTitle1")}<br />
            {t("heroTitle2")} <span style={{ color: "#818cf8" }}>{t("heroHighlight1")}</span>
          </h1>
          <p style={{ fontSize: "1.125rem", opacity: 0.8, maxWidth: "640px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            {t("heroDesc")}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`/${locale}/services`} style={{
              padding: "0.875rem 2rem",
              background: "#6366f1",
              color: "#fff",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1rem",
            }}>
              {t("btnServices")}
            </a>
            <a href={`/${locale}/portfolio`} style={{
              padding: "0.875rem 2rem",
              border: "2px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
            }}>
              {t("btnPortfolio")}
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ────────────────────────────────────────────────────── */}
      <section style={{ background: "#0f172a", color: "#94a3b8", padding: "2rem", textAlign: "center" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "2rem" }}>
          {[
            { value: "150+", label: tStats("projects_label") },
            { value: "98%", label: tStats("satisfaction_label") },
            { value: "30+", label: t("trustProjects").replace("150+", "30+") },
            { value: "24/7", label: tStats("years_label") },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "#818cf8", fontWeight: 800, fontSize: "1.25rem" }}>{item.value}</span>
              <span style={{ fontSize: "0.875rem" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────────── */}
      {localizedServices.length > 0 && (
        <section style={{ padding: "5rem 2rem", background: "#f8fafc" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ color: "#6366f1", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                {t("servicesSub")}
              </p>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#0f172a" }}>
                {t("servicesHighlight")}
              </h2>
              <p style={{ color: "#64748b", marginTop: "0.75rem", maxWidth: "500px", margin: "0.75rem auto 0" }}>
                {t("servicesDesc")}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {localizedServices.slice(0, 6).map((s) => {
                const title = (s.title as string) ?? "";
                return (
                  <a
                    key={s.id as string}
                    href={`/${locale}/services/${s.slug as string}`}
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      padding: "1.75rem",
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid #e2e8f0",
                      transition: "box-shadow 0.2s, transform 0.2s",
                      display: "block",
                    }}
                  >
                    <span style={{
                      display: "inline-block",
                      background: "#eef2ff",
                      color: "#6366f1",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                    }}>
                      {(s.category as string) ?? ""}
                    </span>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
                      {title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {(s.shortDescription as string) ?? ""}
                    </p>
                  </a>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <a href={`/${locale}/services`} style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                background: "#6366f1",
                color: "white",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontWeight: 700,
              }}>
                {t("btnAllServices")}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Portfolio ─────────────────────────────────────────────────────── */}
      {localizedProjects.length > 0 && (
        <section style={{ padding: "5rem 2rem", background: "#0f172a", color: "white" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                {t("portfolioSub")}
              </p>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 900 }}>
                {t("portfolioTitle")} <span style={{ color: "#818cf8" }}>{t("portfolioHighlight")}</span>
              </h2>
              <p style={{ color: "#94a3b8", marginTop: "0.75rem" }}>
                {t("portfolioDesc")}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {localizedProjects.slice(0, 6).map((p) => (
                <a
                  key={p.id as string}
                  href={`/${locale}/portfolio/${p.slug as string}`}
                  style={{
                    background: "#1e293b",
                    borderRadius: "1rem",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "white",
                    border: "1px solid #334155",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    display: "block",
                  }}
                >
                  <div style={{ height: "180px", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.image ? (
                      <img src={p.image as string} alt={p.title as string} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "3rem", opacity: 0.3 }}>🏗</span>
                    )}
                  </div>
                  <div style={{ padding: "1.25rem" }}>
                    <p style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                      {(p.category as string) ?? ""}
                    </p>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                      {p.title as string}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                      {(p.client as string) ?? ""} · {(p.year as string) ?? ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <a href={`/${locale}/portfolio`} style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                border: "2px solid #818cf8",
                color: "#818cf8",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontWeight: 700,
              }}>
                {t("btnAllProjects")}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Why Us ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem", background: "white" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#0f172a" }}>
              {t("whyHighlight")}
            </h2>
            <p style={{ color: "#64748b", marginTop: "0.75rem" }}>
              {t("whyDesc")}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: "⚡", title: tWhy("fastTitle"), desc: tWhy("fastDesc"), color: "#6366f1" },
              { icon: "🌍", title: tWhy("globalTitle"), desc: tWhy("globalDesc"), color: "#0ea5e9" },
              { icon: "🏆", title: tWhy("awardTitle"), desc: tWhy("awardDesc"), color: "#f59e0b" },
              { icon: "✅", title: tWhy("qualityTitle"), desc: tWhy("qualityDesc"), color: "#10b981" },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "1.75rem",
                borderRadius: "1rem",
                border: "1px solid #e2e8f0",
                background: "white",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#64748b" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      {localizedTeam.length > 0 && (
        <section style={{ padding: "5rem 2rem", background: "#f8fafc" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ color: "#6366f1", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                {t("teamSub")}
              </p>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#0f172a" }}>
                {t("teamTitle")}<span style={{ color: "#6366f1" }}>{t("teamHighlight")}</span>{t("teamTitle2")}
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
              {localizedTeam.slice(0, 8).map((m) => (
                <a
                  key={m.id as string}
                  href={`/${locale}/team/${m.slug as string}`}
                  style={{
                    background: "white",
                    borderRadius: "1rem",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "inherit",
                    border: "1px solid #e2e8f0",
                    textAlign: "center",
                    transition: "transform 0.2s",
                    display: "block",
                  }}
                >
                  <div style={{ height: "120px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {m.image ? (
                      <img src={m.image as string} alt={m.name as string} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ fontSize: "2.5rem", color: "#6366f1", fontWeight: 800 }}>
                        {String(m.name as string).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
                      {m.name as string}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "#6366f1", fontWeight: 600 }}>
                      {m.role as string}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <a href={`/${locale}/team`} style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                background: "#0f172a",
                color: "white",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontWeight: 700,
              }}>
                {t("teamViewAll")}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section style={{ padding: "5rem 2rem", background: "#0f172a", color: "white" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                {t("testimonialSub")}
              </p>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 900 }}>
                {t("testimonialTitle")} <span style={{ color: "#818cf8" }}>{t("testimonialHighlight")}</span>
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {testimonials.map((r) => (
                <div key={r.id} style={{
                  background: "#1e293b",
                  borderRadius: "1rem",
                  padding: "1.75rem",
                  border: "1px solid #334155",
                }}>
                  <div style={{ color: "#f59e0b", fontSize: "1.25rem", marginBottom: "1rem" }}>
                    {"★".repeat(r.rating ?? 5)}
                  </div>
                  <p style={{ color: "#e2e8f0", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1.25rem", fontStyle: "italic" }}>
                    "{r.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "2.5rem", height: "2.5rem",
                      background: "#334155",
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", fontWeight: 700,
                    }}>
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{r.name}</p>
                      <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{r.role}{r.company ? ` · ${r.company}` : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: "6rem 2rem",
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "white",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.2 }}>
            {t("ctaTitle1")} <span style={{ color: "#fde68a" }}>{t("ctaHighlight")}</span><br />{t("ctaTitle2")}
          </h2>
          <p style={{ opacity: 0.9, marginBottom: "2.5rem", fontSize: "1.0625rem" }}>
            {t("ctaDesc")}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`/${locale}/contact`} style={{
              padding: "0.875rem 2.5rem",
              background: "white",
              color: "#6366f1",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
            }}>
              {t("btnStart")}
            </a>
            <a href={`/${locale}/pricing`} style={{
              padding: "0.875rem 2.5rem",
              border: "2px solid rgba(255,255,255,0.5)",
              color: "white",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
            }}>
              {t("btnPricing")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
