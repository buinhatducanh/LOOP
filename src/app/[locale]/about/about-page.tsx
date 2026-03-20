"use client";

import { useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Users,
  Award,
  Globe,
  Zap,
  Target,
  Heart,
  TrendingUp,
  Star,
  ShieldCheck,
  Code2,
} from "lucide-react";

import Link from "next/link";

interface StatsData {
  projects?: string;
  satisfaction?: string;
  teamSize?: string;
  years?: string;
}

const getStats = (tStat: any, data?: StatsData) => [
  { value: data?.projects || "150+", label: tStat("projects_label"), icon: TrendingUp },
  { value: data?.satisfaction || "98%", label: tStat("satisfaction_label"), icon: Star },
  { value: data?.teamSize || "50+", label: tStat("team_label"), icon: Users },
  { value: data?.years || "8+", label: tStat("years_label"), icon: Award },
];

const getValues = (t: any) => [
  {
    icon: Target,
    title: t("val1Title"),
    desc: t("val1Desc"),
  },
  {
    icon: Heart,
    title: t("val2Title"),
    desc: t("val2Desc"),
  },
  {
    icon: Zap,
    title: t("val3Title"),
    desc: t("val3Desc"),
  },
  {
    icon: ShieldCheck,
    title: t("val4Title"),
    desc: t("val4Desc"),
  },
];

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

const defaultTechStack = [
  "React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js",
  "PostgreSQL", "Redis", "Docker", "AWS", "Vercel",
  "Prisma", "Stripe", "Shopify", "Figma", "Framer Motion",
];

export function AboutPage({ team = [], stats: statsData, techStack }: { team?: any[]; stats?: StatsData; techStack?: string[] }) {
  const techItems = techStack && techStack.length > 0 ? techStack : defaultTechStack;
  const router = useRouter();
  const t = useTranslations("AboutPage");
  const tStats = useTranslations("Stats");

  const stats = useMemo(() => getStats(tStats, statsData), [tStats, statsData]);
  const values = useMemo(() => getValues(t), [t]);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "80px 24px 60px",
          background: "linear-gradient(to bottom, rgba(59,130,246,0.05), transparent)",
          borderBottom: "1px solid #1F2937",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-pulse-slow"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div
            className="animate-fade-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "40px",
              padding: "6px 16px 6px 10px",
              marginBottom: "24px",
            }}
          >
            <Globe size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
              {t("badge")}
            </span>
          </div>
          <h1
            className="animate-fade-in"
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-2px",
              marginBottom: "20px",
              animationDelay: "0.1s",
            }}
          >
            {t("heroTitle1")} <GradientText>{t("heroHighlight")}</GradientText>
          </h1>
          <p
            className="animate-fade-in"
            style={{
              color: "#94A3B8",
              fontSize: "18px",
              lineHeight: 1.7,
              maxWidth: "640px",
              margin: "0 auto",
              animationDelay: "0.2s",
            }}
          >
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "60px 24px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div
                style={{
                  background: "#0F172A",
                  border: "1px solid #1F2937",
                  borderRadius: "16px",
                  padding: "28px",
                  textAlign: "center",
                }}
              >
                <stat.icon size={28} color="#6366F1" style={{ marginBottom: "12px" }} />
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#94A3B8", fontSize: "14px", marginTop: "4px" }}>
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <FadeIn>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: 800,
                letterSpacing: "-1px",
                textAlign: "center",
                marginBottom: "40px",
              }}
            >
              {t("storyTitle")} <GradientText>{t("storyHighlight")}</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8, marginBottom: "20px" }}>
              {t("storyP1")}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8, marginBottom: "20px" }}>
              {t("storyP2")}
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8 }}>
              {t("storyP3")}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
                {t("valuesTitle")} <GradientText>{t("valuesHighlight")}</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                {t("valuesSub")}
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {values.map((value, i) => (
              <FadeIn key={value.title} delay={i * 0.1}>
                <div
                  className="card-hover"
                  style={{
                    background: "#0F172A",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "32px",
                    transition: "border-color 0.3s, transform 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))",
                      border: "1px solid rgba(99,102,241,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <value.icon size={24} color="#6366F1" />
                  </div>
                  <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
                    {value.title}
                  </h3>
                  <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6 }}>
                    {value.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
                {t("teamTitle")} <GradientText>{t("teamHighlight")}</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                {t("teamSub")}
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {team.map((member, i) => (
              <FadeIn key={member.id} delay={i * 0.1}>
                <Link href={`/team/${member.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="card-hover"
                    style={{
                      background: "#020617",
                      border: "1px solid #1F2937",
                      borderRadius: "16px",
                      padding: "32px",
                      textAlign: "center",
                      transition: "border-color 0.3s, transform 0.3s",
                      height: "100%"
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        margin: "0 auto 16px",
                        overflow: "hidden",
                        border: "2px solid rgba(99,102,241,0.3)",
                      }}
                    >
                      <img
                        src={member.image || undefined}
                        alt={member.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                      {member.name}
                    </h3>
                    <p style={{ color: "#6366F1", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
                      {member.role}
                    </p>
                    <p style={{ color: "#94A3B8", fontSize: "14px" }}>{member.shortBio}</p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
                {t("techTitle")} <GradientText>{t("techHighlight")}</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                {t("techSub")}
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              {techItems.map((tech) => (
                <span
                  key={tech}
                  className="tech-item-hover"
                  style={{
                    background: "#0F172A",
                    color: "#94A3B8",
                    border: "1px solid #1F2937",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "default",
                    transition: "background 0.2s, color 0.2s, transform 0.2s",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          textAlign: "center",
        }}
      >
        <FadeIn>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <Code2 size={40} color="#6366F1" style={{ marginBottom: "20px" }} />
            <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>
              {t("ctaTitle")}
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
              {t("ctaSub")}
            </p>
            <button
              className="btn-hover-scale"
              onClick={() => router.push("/contact")}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#fff",
                border: "none",
                padding: "14px 32px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                transition: "transform 0.2s",
              }}
            >
              {t("btnContact")} <ArrowRight size={16} />
            </button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
