"use client";

/**

 * CaseStudiesClient — Public listing page client component
 * Dark cosmic theme (DS.bg = #0C0C14)
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Clock, Users, TrendingUp, ArrowRight, X, Filter,
} from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";

type ProjectRecord = Record<string, unknown>;

const INDUSTRY_TABS = [
  { key: "all", vi: "Tất cả", en: "All" },
  { key: "fintech", vi: "Fintech", en: "Fintech" },
  { key: "retail", vi: "Bán lẻ", en: "Retail" },
  { key: "manufacturing", vi: "Sản xuất", en: "Manufacturing" },
  { key: "healthcare", vi: "Y tế", en: "Healthcare" },
  { key: "education", vi: "Giáo dục", en: "Education" },
  { key: "logistics", vi: "Logistics", en: "Logistics" },
  { key: "other", vi: "Khác", en: "Other" },
] as const;

const INDUSTRY_COLORS: Record<string, string> = {
  fintech: "#4F7DF3",
  retail: "#EC4899",
  manufacturing: "#E6C75F",
  healthcare: "#22C55E",
  education: "#8B5CF6",
  logistics: "#62C5EB",
  other: "#71717A",
};

function IndustryBadge({ industry }: { industry: string | null | undefined }) {
  const key = industry ?? "other";
  const color = INDUSTRY_COLORS[key] ?? INDUSTRY_COLORS.other;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}18`,
        border: `1px solid ${color}35`,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {industry ?? "Khác"}
    </span>
  );
}

function CaseStudyCard({
  project,
  index,
  locale,
  t,
}: {
  project: ProjectRecord;
  index: number;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: ReturnType<typeof useTranslations<"CaseStudiesPage">>;
}) {
  const title = (project.title as string) ?? "Untitled";
  const description = (project.description as string) ?? "";
  const client = (project.client as string) ?? "";
  const image = (project.image as string | null) ?? "";
  const industry = project.industry as string | null | undefined;
  const duration = project.duration as string | null | undefined;
  const teamSize = project.teamSize as number | null | undefined;
  const primaryMetric = project.primaryMetric as string | null | undefined;
  const slug = (project.slug as string) ?? String(project.id ?? index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.21, 1.02, 0.73, 1] }}
    >
      <Link href={`/${locale}/case-studies/${slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            background: DS.bgCard,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid rgba(255,255,255,0.06)`,
            cursor: "pointer",
            transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
            height: "100%",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = GLOW.pinkCosmic;
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(236,72,153,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              height: 200,
              background: image
                ? `url(${image}) center/cover no-repeat`
                : GRD.cosmicBg2,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(12,12,20,0.9) 0%, transparent 60%)",
              }}
            />
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <IndustryBadge industry={industry} />
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "1.25rem" }}>
            <h3
              style={{
                fontFamily: DS.heading,
                fontSize: 17,
                fontWeight: 700,
                color: DS.text,
                marginBottom: 6,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h3>
            {client && (
              <p style={{ fontSize: 12, color: DS.text3, marginBottom: 10, letterSpacing: "0.04em" }}>
                {client}
              </p>
            )}
            {description && (
              <p
                style={{
                  fontSize: 13,
                  color: DS.text3,
                  lineHeight: 1.6,
                  marginBottom: 14,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </p>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              {duration && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: DS.text3, fontSize: 12 }}>
                  <Clock size={12} />
                  <span>{duration}</span>
                </div>
              )}
              {teamSize != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: DS.text3, fontSize: 12 }}>
                  <Users size={12} />
                  <span>{teamSize} {t("people")}</span>
                </div>
              )}
              {primaryMetric && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: DS.pink, fontSize: 12, fontWeight: 600 }}>
                  <TrendingUp size={12} />
                  <span>{primaryMetric}</span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: DS.pink,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>{t("readMore")}</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CaseStudiesClient({
  locale,
  initialProjects,
}: {
  locale: string;
  initialProjects: ProjectRecord[];
}) {
  const t = useTranslations("CaseStudiesPage");
  const [activeIndustry, setActiveIndustry] = useState<string>("all");

  const filtered = useMemo(() => {
    if (activeIndustry === "all") return initialProjects;
    return initialProjects.filter(
      (p) => (p.industry as string) === activeIndustry
    );
  }, [initialProjects, activeIndustry]);

  const tabs = INDUSTRY_TABS.map((tab) => ({
    ...tab,
    label: locale === "vi" ? tab.vi : tab.en,
  }));

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          padding: "80px 24px 60px",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(107,61,245,0.08) 0%, transparent 100%)",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                padding: "6px 16px",
                borderRadius: 9999,
                background: "rgba(236,72,153,0.08)",
                border: "1px solid rgba(236,72,153,0.25)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: DS.pink,
                  boxShadow: `0 0 6px ${DS.pink}`,
                }}
              />
              <span
                style={{
                  color: DS.pink,
                  fontSize: 11,
                  fontFamily: DS.mono,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                {t("badge")}
              </span>
            </div>

            <h1
              style={{
                fontFamily: DS.heading,
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: 900,
                letterSpacing: "0.04em",
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              <span
                style={{
                  background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.text2} 60%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("heroHighlight")}
              </span>
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${DS.pink} 0%, ${DS.pinkLight} 60%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("heroTitle")}
              </span>
            </h1>

            <p
              style={{
                color: DS.text3,
                fontSize: 16,
                lineHeight: 1.75,
                maxWidth: 520,
                margin: "0 auto 28px",
              }}
            >
              {t("heroDesc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Industry Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "0 24px 40px",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeIndustry === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveIndustry(tab.key)}
              style={{
                padding: "8px 20px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                background: isActive ? GRD.pink : "transparent",
                border: isActive ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: isActive ? "#fff" : DS.text3,
                boxShadow: isActive ? GLOW.pink : "none",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <section style={{ padding: "0 24px 80px" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: "center",
                padding: "80px 24px",
                color: DS.text3,
              }}
            >
              <Filter size={40} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
              <p style={{ fontSize: 16 }}>{t("emptyFilter")}</p>
            </motion.div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              {filtered.map((project, i) => (
                <CaseStudyCard
                  key={project.id as string ?? i}
                  project={project}
                  index={i}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
