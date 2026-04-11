"use client";
/**
 * AboutClient — LOOP Solutions About Page
 * Rewritten 2026-04-11: Full redesign with DS design tokens + cosmic dark theme
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Target, Lightbulb, Handshake, Globe2,
  ChevronRight, ArrowRight, Star,
  Users, TrendingUp, Award, Clock,
  MapPin, Calendar, CheckCircle2,
} from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  return <>{to.toLocaleString("vi-VN")}{suffix}</>;
}

interface StatProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ value, label, icon, color }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${hexRgba(DS.cosmicPurple, 0.2)}`,
        borderRadius: 16,
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0, right: 0,
          width: 120, height: 120,
          background: `radial-gradient(circle, ${hexRgba(color, 0.12)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ color, opacity: 0.9 }}>{icon}</div>
      <div>
        <div style={{
          fontSize: "2.25rem",
          fontWeight: 900,
          color: DS.text,
          lineHeight: 1,
          marginBottom: "0.25rem",
        }}>
          {value}
        </div>
        <div style={{ fontSize: "0.875rem", color: DS.text3 }}>{label}</div>
      </div>
    </motion.div>
  );
}

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}

function ValueCard({ icon, title, description, color, delay }: ValueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${hexRgba(color, 0.25)}`,
        borderRadius: 16,
        padding: "1.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: hexRgba(color, 0.12),
        border: `1px solid ${hexRgba(color, 0.3)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, marginBottom: "1rem",
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: "1rem", fontWeight: 800,
        color: DS.text, marginBottom: "0.5rem",
      }}>
        {title}
      </h3>
      <p style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.6 }}>
        {description}
      </p>
    </motion.div>
  );
}

interface TimelineItemProps {
  year: string;
  title: string;
  description: string;
  isLast?: boolean;
}

function TimelineItem({ year, title, description, isLast }: TimelineItemProps) {
  return (
    <div style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: GRD.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "0.75rem", color: DS.text,
          flexShrink: 0,
        }}>
          {year}
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1,
            background: `linear-gradient(180deg, ${DS.cosmicPurple}40, transparent)`,
            marginTop: 8, minHeight: 60,
          }} />
        )}
      </div>
      <div style={{ paddingBottom: "2rem" }}>
        <h4 style={{
          fontSize: "1rem", fontWeight: 800,
          color: DS.text, marginBottom: "0.375rem",
        }}>
          {title}
        </h4>
        <p style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.7 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

interface TeamMemberProps {
  name: string;
  role: string;
  department: string;
  avatar: string;
  deptColor: string;
}

function TeamPreviewCard({ name, role, department, avatar, deptColor }: TeamMemberProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${hexRgba(DS.cosmicPurple, 0.15)}`,
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        textAlign: "center",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: `linear-gradient(135deg, ${deptColor}, ${DS.cosmicPurple})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.25rem", fontWeight: 800, color: DS.text,
        overflow: "hidden",
      }}>
        {avatar ? (
          <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : name.charAt(0)}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: DS.text, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
          {name}
        </div>
        <div style={{ fontSize: "0.75rem", color: DS.text3, marginBottom: "0.25rem" }}>{role}</div>
        <div style={{
          fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: deptColor,
          background: hexRgba(deptColor, 0.1),
          border: `1px solid ${hexRgba(deptColor, 0.25)}`,
          padding: "0.125rem 0.5rem",
          borderRadius: "9999px",
        }}>
          {department}
        </div>
      </div>
    </motion.div>
  );
}

// ── DB Section helper ───────────────────────────────────────────────────────────
type DbSection = {
  sectionType: string;
  locale: string;
  badge?: string | null;
  title?: string | null;
  titleHighlight?: string | null;
  subtitle?: string | null;
  description?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  cta2Text?: string | null;
  cta2Link?: string | null;
  stats?: unknown;
  story?: unknown;
  timeline?: unknown;
  values?: unknown;
  teamPreview?: unknown;
  ctaSectionTitle?: string | null;
  ctaSectionSub?: string | null;
};

function db<T>(arr: unknown[], key: string, fallback: T): T {
  const item = arr.find((s: DbSection) => s.sectionType === key);
  if (!item || !item.stats) return fallback;
  return item.stats as T;
}

type AboutClientProps = { locale: string; dbSections?: DbSection[] };

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AboutClient({ locale, dbSections = [] }: AboutClientProps) {
  const t = useTranslations("AboutPage");

  // Use DB data when available, fallback to i18n defaults
  const stats: StatProps[] = (() => {
    const raw = db<Array<{value: string; label: string; icon: string; color: string}>>(
      dbSections, "stats", []
    );
    if (raw.length > 0) {
      return raw.map((s, i) => ({
        value: s.value,
        label: s.label,
        color: s.color || DS.cosmicCyan,
        icon: <TrendingUp size={20} />,
      }));
    }
    return [
      { value: "50+", label: t("statsProjects") || "Dự án hoàn thành", icon: <TrendingUp size={20} />, color: DS.cosmicCyan },
      { value: "200+", label: t("statsClients") || "Khách hàng", icon: <Users size={20} />, color: DS.cosmicPurple },
      { value: "27+", label: t("statsMembers") || "Thành viên", icon: <Award size={20} />, color: DS.pink },
      { value: "2+", label: t("statsYears") || "Năm hoạt động", icon: <Clock size={20} />, color: DS.gold },
    ];
  })();

  const values = (() => {
    const raw = db<Array<{icon: string; title: string; description: string; color: string}>>(dbSections, "values", []);
    if (raw.length > 0) {
      return raw.map((v, i) => ({
        icon: <Target size={24} />, // icon mapped by key if needed
        title: v.title,
        description: v.description,
        color: v.color || DS.cosmicCyan,
        delay: i * 0.1,
      }));
    }
    return [
      { icon: <Target size={24} />, title: t("val1Title"), description: t("val1Desc"), color: DS.cosmicCyan, delay: 0 },
      { icon: <Lightbulb size={24} />, title: t("val2Title"), description: t("val2Desc"), color: DS.cosmicPurple, delay: 0.1 },
      { icon: <Handshake size={24} />, title: t("val3Title"), description: t("val3Desc"), color: DS.pink, delay: 0.2 },
      { icon: <Globe2 size={24} />, title: t("val4Title"), description: t("val4Desc"), color: DS.gold, delay: 0.3 },
    ];
  })();

  const timeline = (() => {
    const raw = db<Array<{year: string; title: string; description: string}>>(dbSections, "timeline", []);
    if (raw.length > 0) {
      return raw.map(t => ({ year: t.year, title: t.title, description: t.description }));
    }
    return [
      { year: "2024", title: "Khởi đầu", description: "LOOP Solutions được thành lập với sứ mệnh mang chuyển đổi số đến gần hơn với doanh nghiệp Việt Nam." },
      { year: "2024", title: "10 dự án đầu tiên", description: "Hoàn thành 10 dự án đầu tiên trong năm đầu tiên, xây dựng danh tiếng trong ngành." },
      { year: "2025", title: "Mở rộng quy mô", description: "Tăng trưởng 200% — đội ngũ mở rộng lên 27 thành viên với 4 phòng ban chuyên môn." },
      { year: "2025", title: "Hệ thống LP & Rank", description: "Ra mắt hệ thống LP (Loop Points) và Rank nội bộ, tạo động lực cho nhân viên." },
      { year: "2026", title: "LOOP Academy", description: "Khởi động học viện đào tạo nội bộ với 7 khóa học chuyên sâu cho nhân viên." },
      { year: "2026", title: "Mở rộng dịch vụ", description: "Ra mắt thêm Dashboard Analytics, SEO Services và Media Production." },
    ];
  })();

  const teamPreview: TeamMemberProps[] = [
    { name: "CEO", role: "Chief Executive Officer", department: "Management", avatar: "", deptColor: DS.gold },
    { name: "CTO", role: "Chief Technology Officer", department: "Engineering", avatar: "", deptColor: DS.cosmicBlue },
    { name: "COO", role: "Chief Operations Officer", department: "Management", avatar: "", deptColor: DS.pink },
  ];

  return (
    <div style={{ background: DS.bg, minHeight: "100vh" }}>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: "relative",
        background: DS.bgDeep || "#0A0A14",
        padding: "7rem 2rem 5rem",
        textAlign: "center",
        overflow: "hidden",
      }}>
        {/* Background gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: GRD.cosmicBg1,
          opacity: 0.6,
        }} />
        {/* Nebula orbs */}
        <div style={{
          position: "absolute",
          top: "20%", left: "10%",
          width: 300, height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexRgba(DS.cosmicPurple, 0.2)} 0%, transparent 70%)`,
          animation: "pulse-glow 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "20%", right: "10%",
          width: 250, height: 250,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexRgba(DS.pink, 0.15)} 0%, transparent 70%)`,
          animation: "pulse-glow 5s ease-in-out infinite 2s",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span style={{
              display: "inline-block",
              background: hexRgba(DS.cosmicPurple, 0.15),
              border: `1px solid ${hexRgba(DS.cosmicPurple, 0.35)}`,
              color: DS.cosmicCyan,
              padding: "0.375rem 1.25rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              {(dbSections.find((s: DbSection) => s.sectionType === "hero")?.badge) ?? t("badge")}
            </span>
            <h1 style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              background: `linear-gradient(135deg, ${DS.text} 0%, ${DS.cosmicCyan} 40%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {(dbSections.find((s: DbSection) => s.sectionType === "hero")?.title) ?? t("heroTitle1")}{" "}
              <span style={{
                background: `linear-gradient(135deg, ${DS.cosmicPurple}, ${DS.pink})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {(dbSections.find((s: DbSection) => s.sectionType === "hero")?.titleHighlight) ?? t("heroHighlight")}
              </span>
            </h1>
            <p style={{
              fontSize: "1.125rem",
              color: DS.text3,
              maxWidth: 600,
              margin: "0 auto 2rem",
              lineHeight: 1.7,
            }}>
              {(dbSections.find((s: DbSection) => s.sectionType === "hero")?.subtitle) ?? t("heroDesc")}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href={`/${locale}/contact`} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 2rem",
                background: GRD.primary,
                color: DS.text,
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
                boxShadow: GLOW.pink,
                transition: "all 0.2s ease",
              }}>
                {t("btnContact")}
                <ArrowRight size={16} />
              </Link>
              <Link href={`/${locale}/case-studies`} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 2rem",
                background: "transparent",
                color: DS.text,
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
                border: `1px solid ${hexRgba(DS.cosmicPurple, 0.4)}`,
                transition: "all 0.2s ease",
              }}>
                {t("viewCaseStudies") || "Xem Case Studies"}
                <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "4rem 2rem", background: DS.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}>
            {stats.map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{
              color: DS.pink,
              fontWeight: 700,
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "0.75rem",
              display: "block",
            }}>
              {t("storyTitle")}
            </span>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: 900,
              background: `linear-gradient(135deg, ${DS.text} 0%, ${DS.cosmicPurple} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {t("storyHighlight")}
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {(() => {
              const raw = db<string[]>(dbSections, "story", []);
              const paragraphs = raw.length > 0 ? raw : [t("storyP1"), t("storyP2"), t("storyP3")];
              return paragraphs.map((p, i) => (
                <p key={i} style={{ color: DS.text3, fontSize: "1.0625rem", lineHeight: 1.8 }}>{p}</p>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section style={{
        padding: "5rem 2rem",
        background: hexRgba(DS.cosmicPurple, 0.04),
        borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}`,
        borderBottom: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}`,
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: DS.text,
            }}>
              Hành trình phát triển
            </h2>
            <p style={{ color: DS.text3, marginTop: "0.5rem" }}>
              Từ một ý tưởng nhỏ đến công ty chuyển đổi số hàng đầu
            </p>
          </div>
          <div>
            {timeline.map((item, i) => (
              <TimelineItem key={i} {...item} isLast={i === timeline.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={{ padding: "5rem 2rem", background: DS.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: DS.text,
              marginBottom: "0.5rem",
            }}>
              Giá trị cốt lõi
            </h2>
            <p style={{ color: DS.text3 }}>
              4 giá trị định hướng mọi quyết định của LOOP Solutions
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}>
            {values.map((v, i) => (
              <ValueCard key={i} {...v} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Team Preview ── */}
      <section style={{
        padding: "5rem 2rem",
        background: DS.bgDeep || "#0A0A14",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, color: DS.text, marginBottom: "0.5rem" }}>
                Đội ngũ của chúng tôi
              </h2>
              <p style={{ color: DS.text3 }}>
                27+ thành viên tài năng từ nhiều chuyên ngành khác nhau
              </p>
            </div>
            <Link href={`/${locale}/team`} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              color: DS.pink,
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}>
              Xem tất cả thành viên <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1rem",
          }}>
            {teamPreview.map((m, i) => (
              <TeamPreviewCard key={i} {...m} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href={`/${locale}/careers`} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              border: `1px solid ${hexRgba(DS.cosmicPurple, 0.35)}`,
              borderRadius: 8,
              color: DS.text2,
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}>
              <Star size={14} />
              Gia nhập đội ngũ LOOP
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "5rem 2rem",
        background: GRD.cosmicBg2 || GRD.cosmicPurple,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "2rem",
            fontWeight: 900,
            color: DS.text,
            marginBottom: "1rem",
          }}>
            {(dbSections.find((s: DbSection) => s.sectionType === "cta")?.ctaSectionTitle) ?? t("ctaTitle")}
          </h2>
          <p style={{ color: DS.text3, marginBottom: "2rem", lineHeight: 1.7 }}>
            {(dbSections.find((s: DbSection) => s.sectionType === "cta")?.ctaSectionSub) ?? t("ctaSub")}
          </p>
          <Link href={`/${locale}/contact`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 2.5rem",
            background: DS.text,
            color: DS.cosmicPurple,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: "0.9375rem",
            textDecoration: "none",
            boxShadow: GLOW.pinkCosmic,
          }}>
            {t("btnContact")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
