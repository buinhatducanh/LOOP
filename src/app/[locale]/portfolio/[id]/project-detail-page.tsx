"use client";

import { useRouter } from "@/i18n/routing";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Calendar, Code2, Layers, CheckCircle, Zap, Building2, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
interface Project {
  id: string;
  title: string;
  category: string;
  client: string;
  year: string;
  image: string;
  description: string;
  techStack: string[];
  features: string[];
  results: string;
  screenshots: string[];
  serviceId: string;
}

interface RelatedService {
  id: string;
  title: string;
}

interface TeamMemberInfo {
  id: string;
  name: string;
  role: string;
  image: string;
}

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
  return <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>{children}</div>;
}

export function ProjectDetailPage({ project, relatedService, teamMember }: { project: Project; relatedService?: RelatedService; teamMember?: TeamMemberInfo }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ProjectDetailPage");
  const bc = useTranslations("Breadcrumbs");

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero Image */}
      <div style={{ width: "100%", height: "60vh", minHeight: "400px", position: "relative", overflow: "hidden" }}>
        <Image
          src={project.image}
          alt={`${project.title} - Image`}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #020617 0%, rgba(2,6,23,0.4) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "24px",
            right: "24px",
            maxWidth: "1280px",
            margin: "0 auto",
          }}
        >
          <Breadcrumbs
            locale={locale}
            items={[
              { label: bc("home"), href: `/${locale}` },
              { label: bc("portfolio"), href: `/${locale}/portfolio` },
              { label: project.title }
            ]}
          />
          <div
            style={{
              display: "inline-block",
              background: "rgba(99,102,241,0.9)",
              color: "#FFFFFF",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
              marginLeft: "16px",
            }}
          >
            {project.category}
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-1.5px",
            }}
          >
            {project.title}
          </h1>
        </div>
      </div>

      {/* Project Info */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Meta Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "32px",
              marginBottom: "48px",
              paddingBottom: "32px",
              borderBottom: "1px solid #1F2937",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building2 size={18} color="#6366F1" />
              <div>
                <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("client")}</p>
                <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600 }}>{project.client}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={18} color="#6366F1" />
              <div>
                <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("year")}</p>
                <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600 }}>{project.year}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <TrendingUp size={18} color="#22C55E" />
              <div>
                <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("results")}</p>
                <p style={{ color: "#22C55E", fontSize: "15px", fontWeight: 600 }}>{project.results}</p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
            }}
          >
            {/* Left: Description */}
            <div>
              <FadeIn>
                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>
                  {t("aboutTitle")} <GradientText>{t("aboutHighlight")}</GradientText>
                </h2>
                <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.8 }}>
                  {project.description}
                </p>
              </FadeIn>

              {/* Tech Stack */}
              <FadeIn delay={0.1}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "36px", marginBottom: "16px" }}>
                  {t("techStack")}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        color: "#6366F1",
                        border: "1px solid rgba(99,102,241,0.3)",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>

            {/* Right: Features */}
            <div>
              <FadeIn delay={0.1}>
                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>
                  {t("keyFeatures")} <GradientText>{t("keyFeaturesHighlight")}</GradientText>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {project.features.map((feature) => (
                    <div key={feature} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "rgba(34,197,94,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle size={13} color="#22C55E" />
                      </div>
                      <span style={{ color: "#FFFFFF", fontSize: "15px" }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Team Member */}
      {teamMember && (
        <section
          style={{
            padding: "60px 24px",
            background: "#0F172A",
            borderTop: "1px solid #1F2937",
          }}
        >
          <FadeIn>
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "8px" }}>
                {t("teamMember") || "Thành viên thực hiện"}
              </p>
              <Link href={`/team/${teamMember.id}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    padding: "20px",
                    background: "rgba(99,102,241,0.05)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "16px",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={teamMember.image}
                    alt={teamMember.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ textAlign: "left" }}>
                    <p style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "16px" }}>
                      {teamMember.name}
                    </p>
                    <p style={{ color: "#818CF8", fontSize: "14px" }}>{teamMember.role}</p>
                  </div>
                  <ArrowRight size={20} color="#818CF8" />
                </div>
              </Link>
            </div>
          </FadeIn>
        </section>
      )}

      {/* Related Service CTA */}
      {relatedService && (
        <section
          style={{
            padding: "60px 24px",
            background: "#0F172A",
            borderTop: "1px solid #1F2937",
            textAlign: "center",
          }}
        >
          <FadeIn>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "8px" }}>
                {t("ctaInterested")}
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "20px" }}>
                {t.rich("ctaExplore", {
                  service: relatedService.title,
                  highlight: (chunks) => <GradientText>{chunks}</GradientText>,
                })}
              </h3>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => router.push(`/services/${relatedService.id}`)}
                  className="transition-transform hover:scale-104 active:scale-97"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    color: "#3B82F6",
                    border: "1px solid rgba(59,130,246,0.3)",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {t("viewService")} <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => router.push(`/contact?service=${relatedService.id}`)}
                  className="transition-transform hover:scale-104 active:scale-97"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    color: "#fff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                  }}
                >
                  {t("getQuote")} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </FadeIn>
        </section>
      )}
    </div>
  );
}
