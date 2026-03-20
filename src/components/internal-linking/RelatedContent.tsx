"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowRight, TrendingUp, CheckCircle } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface RelatedProject {
  id: string;
  slug: string;
  title: string;
  client: string;
  image: string;
  results: string;
  category: string;
  serviceId: string | null;
  techStack: string[];
}

export interface RelatedService {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string;
  shortDescription: string;
  startingPrice: number;
  deliveryTime: string;
  techStack?: string[];
}

interface RelatedContentProps {
  variant: "service-detail" | "project-detail";
  currentId: string;
  currentSlug: string;
  currentCategory: string;
  currentServiceId?: string | null;
  currentTechStack?: string[];
  relatedItems: RelatedProject[] | RelatedService[];
}

/* ─── Scoring helpers ────────────────────────────────────────────────── */

function scoreProject(
  project: RelatedProject,
  currentCategory: string,
  currentServiceId: string | null | undefined,
  currentTechStack: string[],
): number {
  let score = 0;
  if (project.category === currentCategory) score += 3;
  if (project.serviceId && project.serviceId === currentServiceId) score += 5;
  const currentSet = new Set(currentTechStack.map((t) => t.toLowerCase()));
  for (const tech of project.techStack) {
    if (currentSet.has(tech.toLowerCase())) score += 1;
  }
  return score;
}

function scoreService(
  service: RelatedService,
  currentCategory: string,
  currentTechStack: string[],
): number {
  let score = 0;
  if (service.category === currentCategory) score += 3;
  const currentSet = new Set(currentTechStack.map((t) => t.toLowerCase()));
  for (const tech of service.techStack ?? []) {
    if (currentSet.has(tech.toLowerCase())) score += 1;
  }
  return score;
}

/* ─── Gradient text ─────────────────────────────────────────────────── */

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

/* ─── Main component ────────────────────────────────────────────────── */

export function RelatedContent({
  variant,
  currentId,
  currentSlug,
  currentCategory,
  currentServiceId,
  currentTechStack = [],
  relatedItems,
}: RelatedContentProps) {
  const locale = useLocale();
  const t = useTranslations("ServiceDetailPage");
  const t2 = useTranslations("ProjectDetailPage");
  const router = useRouter();

  if (!relatedItems.length) return null;

  const title = variant === "service-detail" ? t("relatedTitle") : t2("relatedService");
  const highlight = variant === "service-detail" ? t("relatedHighlight") : t2("relatedServiceHighlight");

  /* ── Rank items by relevance score ─────────────────────────────── */
  const ranked =
    variant === "service-detail"
      ? (relatedItems as RelatedProject[])
          .filter((p) => p.id !== currentId)
          .map((p) => ({ item: p, score: scoreProject(p, currentCategory, currentServiceId, currentTechStack) }))
          .sort((a, b) => b.score - a.score || 0)
          .slice(0, 4)
      : (relatedItems as RelatedService[])
          .filter((s) => s.id !== currentId)
          .map((s) => ({ item: s, score: scoreService(s, currentCategory, currentTechStack) }))
          .sort((a, b) => b.score - a.score || 0)
          .slice(0, 3);

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "#0F172A",
        borderTop: "1px solid #1F2937",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <FadeIn>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-1px",
              marginBottom: "32px",
            }}
          >
            {title} <GradientText>{highlight}</GradientText>
          </h2>
        </FadeIn>

        {variant === "service-detail" ? (
          /* ── Related Projects grid ─────────────────────────────── */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {ranked.map(({ item: project }, idx) => (
              <FadeIn key={project.id} delay={idx * 0.08}>
                <Link
                  href={`/portfolio/${project.slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                  aria-label={`View project: ${project.title}`}
                >
                  <div
                    className="related-project-card"
                    style={{
                      background: "#020617",
                      border: "1px solid #1F2937",
                      borderRadius: "16px",
                      overflow: "hidden",
                      transition: "border-color 0.3s, transform 0.3s, box-shadow 0.3s",
                      cursor: "pointer",
                      height: "100%",
                    }}
                  >
                    <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover", transition: "transform 0.4s" }}
                      />
                    </div>
                    <div style={{ padding: "20px" }}>
                      <p
                        style={{
                          color: "#94A3B8",
                          fontSize: "12px",
                          marginBottom: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {project.client}
                      </p>
                      <h3
                        style={{
                          color: "#FFFFFF",
                          fontSize: "17px",
                          fontWeight: 700,
                          marginBottom: "8px",
                          lineHeight: 1.3,
                        }}
                      >
                        {project.title}
                      </h3>
                      <p
                        style={{
                          color: "#22C55E",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <TrendingUp size={13} />
                        {project.results}
                      </p>
                      <div
                        style={{
                          marginTop: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#6366F1",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {t("viewProject") || "View project"} <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        ) : (
          /* ── Related Services list ────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>
            {ranked.map(({ item: service }, idx) => (
              <FadeIn key={service.id} delay={idx * 0.08}>
                <Link
                  href={`/services/${service.slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                  aria-label={`Explore service: ${service.title}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "20px 24px",
                      background: "#020617",
                      border: "1px solid #1F2937",
                      borderRadius: "14px",
                      transition: "border-color 0.3s, transform 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#6366F1";
                      (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#1F2937";
                      (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "22px",
                      }}
                    >
                      {service.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          color: "#FFFFFF",
                          fontSize: "16px",
                          fontWeight: 700,
                          marginBottom: "2px",
                        }}
                      >
                        {service.title}
                      </h4>
                      <p
                        style={{
                          color: "#94A3B8",
                          fontSize: "13px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {service.shortDescription}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                      <span style={{ color: "#3B82F6", fontSize: "16px", fontWeight: 700 }}>
                        ${service.startingPrice.toLocaleString()}
                      </span>
                      <span style={{ color: "#94A3B8", fontSize: "11px" }}>
                        {service.deliveryTime}
                      </span>
                    </div>
                    <ArrowRight size={18} color="#6366F1" />
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Global CTA */}
        <FadeIn delay={0.2}>
          <div
            style={{
              marginTop: "48px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => router.push(`/${locale}/portfolio`)}
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
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.2)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              {variant === "service-detail"
                ? t("viewAllProjects") || "View all projects"
                : t2("viewAllServices") || "View all services"}{" "}
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => router.push(`/${locale}/contact`)}
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
                boxShadow: "0 0 24px rgba(99,102,241,0.25)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 36px rgba(99,102,241,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(99,102,241,0.25)";
              }}
            >
              {t("requestQuote") || "Request a quote"} <ArrowRight size={14} />
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
