"use client";

/**
 * CaseStudiesSection — Homepage featured case studies (3 cards)
 * Used in HomeClient.tsx
 */
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, TrendingUp, Users, Clock } from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";

type ProjectRecord = Record<string, unknown>;

const INDUSTRY_COLORS: Record<string, string> = {
  fintech: "#4F7DF3",
  retail: "#EC4899",
  manufacturing: "#E6C75F",
  healthcare: DS.green,
  education: "#8B5CF6",
  logistics: "#62C5EB",
  other: "#71717A",
};

function CaseStudyCard({
  project,
  index,
  locale,
}: {
  project: ProjectRecord;
  index: number;
  locale: string;
}) {
  const title = (project.title as string) ?? "Untitled";
  const image = (project.image as string | null) ?? "";
  const industry = project.industry as string | null | undefined;
  const primaryMetric = project.primaryMetric as string | null | undefined;
  const teamSize = project.teamSize as number | null | undefined;
  const duration = project.duration as string | null | undefined;
  const slug = (project.slug as string) ?? String(project.id ?? index);
  const key = industry ?? "other";
  const color = INDUSTRY_COLORS[key] ?? INDUSTRY_COLORS.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
    >
      <Link href={`/${locale}/case-studies/${slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            background: DS.bgCard,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
            height: "100%",
            transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(236,72,153,0.18)`;
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(236,72,153,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
          }}
        >
          {/* Image */}
          <div
            style={{
              height: 160,
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
                background: "linear-gradient(to top, rgba(12,12,20,0.85) 0%, transparent 60%)",
              }}
            />
            {/* Industry badge */}
            {industry && (
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 700,
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}35`,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {industry}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "1rem 1.25rem" }}>
            <h3
              style={{
                fontFamily: DS.heading,
                fontSize: 15,
                fontWeight: 700,
                color: DS.text,
                marginBottom: 10,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h3>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              {duration && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: DS.text3 }}>
                  <Clock size={11} />{duration}
                </span>
              )}
              {teamSize != null && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: DS.text3 }}>
                  <Users size={11} />{teamSize} người
                </span>
              )}
              {primaryMetric && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: DS.pink, fontWeight: 600 }}>
                  <TrendingUp size={11} />{primaryMetric}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4, color: DS.pink, fontSize: 12, fontWeight: 600 }}>
              <span>Xem chi tiết</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CaseStudiesSection({
  projects,
  locale,
}: {
  projects: ProjectRecord[];
  locale: string;
}) {
  if (!projects.length) return null;

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, rgba(236,72,153,0.04) 0%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                padding: "6px 16px",
                borderRadius: 9999,
                background: "rgba(236,72,153,0.08)",
                border: "1px solid rgba(236,72,153,0.2)",
              }}
            >
              <div
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: DS.pink, boxShadow: `0 0 6px ${DS.pink}`,
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
                Case Studies
              </span>
            </div>

            <h2
              style={{
                fontFamily: DS.heading,
                fontSize: "clamp(22px, 4vw, 36px)",
                fontWeight: 900,
                letterSpacing: "0.04em",
                marginBottom: 12,
                color: DS.text,
              }}
            >
              Câu chuyện thành công
            </h2>
            <p style={{ color: DS.text3, fontSize: 15, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Khám phá cách LOOP giúp các doanh nghiệp Việt Nam tăng trưởng 200-500% qua chuyển đổi số toàn diện.
            </p>

            <Link
              href={`/${locale}/case-studies`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 9999,
                background: GRD.pink,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: `0 0 20px rgba(236,72,153,0.35)`,
              }}
            >
              <span>Xem tất cả Case Studies</span>
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {projects.slice(0, 3).map((project, i) => (
            <CaseStudyCard key={project.id as string ?? i} project={project} index={i} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
