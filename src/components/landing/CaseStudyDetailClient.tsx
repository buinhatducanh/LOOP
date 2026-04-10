"use client";

/**
 * CaseStudyDetailClient — Public case study detail page
 * Dark cosmic theme
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Clock, Users, TrendingUp, ArrowLeft, ArrowRight,
  Target, Lightbulb, BarChart2, Quote, X, Play,
} from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";

type ProjectRecord = Record<string, unknown>;

const INDUSTRY_COLORS: Record<string, string> = {
  fintech: "#4F7DF3",
  retail: "#EC4899",
  manufacturing: "#E6C75F",
  healthcare: "#22C55E",
  education: "#8B5CF6",
  logistics: "#62C5EB",
  other: "#71717A",
};

function SectionCard({
  icon,
  title,
  content,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  content: string | null | undefined;
  color: string;
}) {
  if (!content) return null;
  return (
    <div
      style={{
        background: DS.bgCard,
        borderRadius: 16,
        padding: "1.5rem",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontFamily: DS.heading,
            fontSize: 16,
            fontWeight: 700,
            color: DS.text,
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </h3>
      </div>
      <p style={{ fontSize: 14, color: DS.text3, lineHeight: 1.75 }}>{content}</p>
    </div>
  );
}

function RelatedCard({
  project,
  index,
  locale,
  t,
}: {
  project: ProjectRecord;
  index: number;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (...args: any[]) => any;
}) {
  const title = (project.title as string) ?? "Untitled";
  const image = (project.image as string | null) ?? "";
  const industry = project.industry as string | null | undefined;
  const primaryMetric = project.primaryMetric as string | null | undefined;
  const slug = (project.slug as string) ?? String(project.id ?? index);
  const key = industry ?? "other";
  const color = INDUSTRY_COLORS[key] ?? INDUSTRY_COLORS.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/${locale}/case-studies/${slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            background: DS.bgCard,
            border: "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          }}
        >
          <div
            style={{
              height: 140,
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
                background: "linear-gradient(to top, rgba(12,12,20,0.85) 0%, transparent 70%)",
              }}
            />
            {industry && (
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 600,
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
          <div style={{ padding: "0.875rem" }}>
            <h4
              style={{
                fontFamily: DS.heading,
                fontSize: 14,
                fontWeight: 700,
                color: DS.text,
                marginBottom: 6,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h4>
            {primaryMetric && (
              <p style={{ fontSize: 12, color: DS.pink, fontWeight: 600 }}>{primaryMetric}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CaseStudyDetailClient({
  locale,
  project,
  relatedProjects,
}: {
  locale: string;
  project: ProjectRecord;
  relatedProjects: ProjectRecord[];
}) {
  const t = useTranslations("CaseStudiesPage");
  const tSM = useTranslations("teamMember");

  const title = (project.title as string) ?? "Untitled";
  const description = (project.description as string) ?? "";
  const client = (project.client as string) ?? "";
  const year = (project.year as string) ?? "";
  const image = (project.image as string | null) ?? "";
  const industry = project.industry as string | null | undefined;
  const projectScope = (project.projectScope as string | null | undefined) ?? "";
  const teamSize = project.teamSize as number | null | undefined;
  const duration = project.duration as string | null | undefined;
  const challenge = project.challenge as string | null | undefined;
  const solution = project.solution as string | null | undefined;
  const results = project.results as string | null | undefined;
  const clientQuote = project.clientQuote as string | null | undefined;
  const clientRole = project.clientRole as string | null | undefined;
  const roiMetric = project.roiMetric as string | null | undefined;
  const primaryMetric = project.primaryMetric as string | null | undefined;
  const videoUrl = project.videoUrl as string | null | undefined;
  const galleryImages = (project.galleryImages as string[] | null | undefined) ?? [];
  const slug = (project.slug as string) ?? String(project.id ?? "");

  const industryColor = INDUSTRY_COLORS[industry ?? "other"] ?? INDUSTRY_COLORS.other;

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <div
        style={{
          height: "clamp(320px, 45vw, 520px)",
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
            background: "linear-gradient(to top, rgba(12,12,20,1) 0%, rgba(12,12,20,0.5) 50%, rgba(12,12,20,0.3) 100%)",
          }}
        />

        {/* Back button */}
        <div style={{ position: "absolute", top: 24, left: 24 }}>
          <Link
            href={`/${locale}/case-studies`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 9999,
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              transition: "color 0.2s, background 0.2s",
            }}
          >
            <ArrowLeft size={14} />
            <span>Case Studies</span>
          </Link>
        </div>

        {/* Industry badge */}
        {industry && (
          <div style={{ position: "absolute", top: 24, right: 24 }}>
            <span
              style={{
                padding: "5px 14px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                color: industryColor,
                background: `${industryColor}18`,
                border: `1px solid ${industryColor}35`,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {industry}
            </span>
          </div>
        )}

        {/* Title overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "2rem 2rem 2.5rem",
            maxWidth: 900,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {client && (
              <p
                style={{
                  fontSize: 13,
                  color: industryColor,
                  marginBottom: 8,
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {client}{year ? ` · ${year}` : ""}
              </p>
            )}
            <h1
              style={{
                fontFamily: DS.heading,
                fontSize: "clamp(22px, 4vw, 42px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.15,
                letterSpacing: "0.03em",
                marginBottom: description ? 12 : 0,
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.7,
                  maxWidth: 680,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{
          background: DS.bgCard,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "1.25rem 2rem",
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {industry && (
            <StatItem icon={<Target size={16} />} label={industry} color={industryColor} />
          )}
          {duration && (
            <StatItem icon={<Clock size={16} />} label={duration} color={DS.text3} />
          )}
          {teamSize != null && (
            <StatItem
              icon={<Users size={16} />}
              label={`${teamSize} ${t("people")}`}
              color={DS.text3}
            />
          )}
          {projectScope && (
            <StatItem icon={<BarChart2 size={16} />} label={projectScope} color={DS.text3} />
          )}
          {primaryMetric && (
            <StatItem
              icon={<TrendingUp size={16} />}
              label={primaryMetric}
              color={DS.pink}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem 4rem" }}>
        {/* Challenge / Solution / Results */}
        {(challenge || solution || results) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <SectionCard
              icon={<Lightbulb size={18} />}
              title={t("challenge")}
              content={challenge}
              color="#EF4444"
            />
            <SectionCard
              icon={<Target size={18} />}
              title={t("solution")}
              content={solution}
              color={DS.cosmicBlue}
            />
            <SectionCard
              icon={<BarChart2 size={18} />}
              title={t("results")}
              content={results}
              color={DS.green}
            />
          </div>
        )}

        {/* ROI metric highlight */}
        {roiMetric && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              marginBottom: 40,
              padding: "1.5rem 2rem",
              borderRadius: 16,
              background: GRD.gold,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {t("primaryMetric")}
            </p>
            <p
              style={{
                fontFamily: DS.heading,
                fontSize: 24,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              {roiMetric}
            </p>
          </motion.div>
        )}

        {/* Client quote */}
        {clientQuote && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              marginBottom: 40,
              padding: "2rem",
              borderRadius: 16,
              borderLeft: `3px solid ${DS.pink}`,
              background: DS.bgCard,
            }}
          >
            <Quote
              size={28}
              style={{ color: DS.pink, marginBottom: 12, opacity: 0.7 }}
            />
            <blockquote
              style={{
                fontSize: 17,
                color: DS.text2,
                lineHeight: 1.8,
                fontStyle: "italic",
                marginBottom: 16,
              }}
            >
              &ldquo;{clientQuote}&rdquo;
            </blockquote>
            {clientRole && (
              <div>
                <p style={{ fontSize: 13, color: DS.text3 }}>— {clientRole}</p>
                {client && (
                  <p style={{ fontSize: 12, color: DS.text4 }}>{client}</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Video embed */}
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 40 }}
          >
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                aspectRatio: "16/9",
                background: DS.bgCard,
                position: "relative",
              }}
            >
              <iframe
                src={videoUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
          </motion.div>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 40 }}
          >
            <h3
              style={{
                fontFamily: DS.heading,
                fontSize: 18,
                fontWeight: 700,
                color: DS.text,
                marginBottom: 16,
                letterSpacing: "0.04em",
              }}
            >
              Gallery
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    aspectRatio: "16/9",
                    background: `url(${img}) center/cover no-repeat ${GRD.cosmicBg2}`,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <div
          style={{
            padding: "2rem",
            borderRadius: 16,
            background: GRD.primary,
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: DS.heading,
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 12,
              letterSpacing: "0.04em",
            }}
          >
            Bắt đầu dự án của bạn
          </h3>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
            Liên hệ LOOP Solutions để nhận tư vấn miễn phí
          </p>
          <Link
            href={`/${locale}/dat-lich`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 9999,
              background: "#fff",
              color: DS.pink,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: GLOW.pink,
            }}
          >
            <span>Nhận báo giá</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Related projects */}
      {relatedProjects.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "3rem 2rem",
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h3
              style={{
                fontFamily: DS.heading,
                fontSize: 20,
                fontWeight: 700,
                color: DS.text,
                marginBottom: 24,
                letterSpacing: "0.04em",
              }}
            >
              {t("relatedProjects")}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {relatedProjects.map((p, i) => (
                <RelatedCard
                  key={p.id as string ?? i}
                  project={p}
                  index={i}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatItem({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ color, opacity: 0.8 }}>{icon}</div>
      <span style={{ fontSize: 13, color, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
