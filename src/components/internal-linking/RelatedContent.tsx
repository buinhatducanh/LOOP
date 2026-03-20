"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowRight, TrendingUp } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import styles from "./RelatedContent.module.css";

/* ─── Types (imported from shared types file) ─────────────────────────────── */

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

/* ─── Relevance scoring ──────────────────────────────────────────────────── */

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
): number {
  return service.category === currentCategory ? 3 : 0;
}

/* ─── VND currency formatter ────────────────────────────────────────────── */

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function RelatedContent({
  variant,
  currentId,
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

  const title = variant === "service-detail"
    ? t("relatedTitle")
    : (t2("relatedService") || "Dịch vụ liên quan");
  const highlight = variant === "service-detail"
    ? t("relatedHighlight")
    : (t2("relatedServiceHighlight") || "cùng danh mục");

  const pool = variant === "service-detail"
    ? (relatedItems as RelatedProject[])
        .filter((p) => p.id !== currentId)
        .map((p) => ({ item: p, score: scoreProject(p, currentCategory, currentServiceId, currentTechStack) }))
        .sort((a, b) => b.score - a.score || 0)
        .slice(0, 4)
    : (relatedItems as RelatedService[])
        .filter((s) => s.id !== currentId)
        .map((s) => ({ item: s, score: scoreService(s, currentCategory) }))
        .sort((a, b) => b.score - a.score || 0)
        .slice(0, 3);

  const viewAllHref = variant === "service-detail"
    ? `/${locale}/portfolio`
    : `/${locale}/services`;
  const ctaHref = `/${locale}/contact`;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <FadeIn>
          <h2 className={styles.sectionTitle}>
            {title} <span className={styles.gradient}>{highlight}</span>
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
            {(pool as { item: RelatedProject; score: number }[]).map(({ item: project }, idx) => (
              <FadeIn key={project.id} delay={idx * 0.08}>
                <Link
                  href={`/portfolio/${project.slug}`}
                  className={styles.projectCard}
                  aria-label={`View project: ${project.title}`}
                >
                  <div className={styles.projectImage}>
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.projectBody}>
                    <p className={styles.projectClient}>{project.client}</p>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <p className={styles.projectResults}>
                      <TrendingUp size={13} />
                      {project.results}
                    </p>
                    <p className={styles.projectLink}>
                      {t("viewProject") || "Xem dự án"} <ArrowRight size={13} />
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        ) : (
          /* ── Related Services list ─────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>
            {(pool as { item: RelatedService; score: number }[]).map(({ item: service }, idx) => (
              <FadeIn key={service.id} delay={idx * 0.08}>
                <Link
                  href={`/services/${service.slug}`}
                  className={styles.serviceRow}
                  aria-label={`Explore service: ${service.title}`}
                >
                  <div className={styles.serviceIcon}>{service.icon}</div>
                  <div className={styles.serviceInfo}>
                    <h4 className={styles.serviceTitle}>{service.title}</h4>
                    <p className={styles.serviceDesc}>{service.shortDescription}</p>
                  </div>
                  <div className={styles.servicePricing}>
                    <span className={styles.servicePrice}>{formatVND(service.startingPrice)}</span>
                    <span className={styles.serviceDelivery}>{service.deliveryTime}</span>
                  </div>
                  <ArrowRight size={18} className={styles.serviceArrow} />
                </Link>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Global CTA */}
        <FadeIn delay={0.2}>
          <div className={styles.ctaRow}>
            <Link href={viewAllHref} className={styles.btnOutline}>
              {variant === "service-detail"
                ? (t("viewAllProjects") || "Xem tất cả dự án")
                : (t2("viewAllServices") || "Xem tất cả dịch vụ")}{" "}
              <ArrowRight size={14} />
            </Link>
            <Link href={ctaHref} className={styles.btnPrimary}>
              {t("requestQuote") || "Yêu cầu báo giá"} <ArrowRight size={14} />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
