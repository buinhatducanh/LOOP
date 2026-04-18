"use client";

/**
 * ServicesSection — Client Component
 *
 * Fetches services via React Query (requires QueryProvider).
 * Extracted from LandingPage to keep the main page structure clean.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Globe, Code2, BarChart3, Target,
  ArrowRight,
  MousePointer,
} from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { apiClient } from "@/lib/api/client";
import { QueryProvider } from "@/lib/query/provider";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  web: <Globe size={26} />,
  app: <Code2 size={26} />,
  dashboard: <BarChart3 size={26} />,
  seo: <Target size={26} />,
};

const FALLBACK_SERVICES = [
  {
    id: "1", slug: "web-design", title: "Thiết kế Website",
    description: "Website cao cấp, tối ưu chuyển đổi với React/Next.js. Từ landing page đến e-commerce phức tạp.",
    color: DS.blue,
    priceFrom: "1,980,000 VNĐ",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "2", slug: "app-saas", title: "Phát triển App & SaaS",
    description: "Từ MVP đến enterprise. Mobile app, web app và nền tảng SaaS scalable cho hàng triệu người dùng.",
    color: DS.purple,
    priceFrom: "19,980,000 VNĐ",
    tags: ["React Native", "Node.js", "AWS"],
  },
  {
    id: "3", slug: "tech-support", title: "Phần mềm hỗ trợ kỹ thuật",
    description: "Công cụ hỗ trợ nội bộ, quản lý dữ liệu, tự động hóa quy trình cho doanh nghiệp.",
    color: DS.cyan,
    priceFrom: "200,000 VNĐ/tháng",
    tags: ["Automation", "API", "Cloud"],
  },
  {
    id: "4", slug: "seo-marketing", title: "SEO & Digital Marketing",
    description: "Tăng trưởng organic bền vững. Technical SEO, content strategy và quảng cáo hiệu suất cao.",
    color: DS.green,
    priceFrom: "200,000 VNĐ",
    tags: ["SEO", "Google Ads", "Content"],
  },
  {
    id: "5", slug: "dashboard-analytics", title: "Dashboard & Analytics",
    description: "Trực quan hóa dữ liệu doanh nghiệp. Dashboard tùy chỉnh, báo cáo real-time, KPI tracking cho mọi ngành.",
    color: DS.amber,
    priceFrom: "5,000,000 VNĐ",
    tags: ["Data Viz", "React", "Charts"],
  },
];

function Badge({ label, color = DS.blue }: { label: string; color?: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.25rem",
        padding: "0.375rem 1rem",
        borderRadius: "9999px",
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span
        style={{
          color,
          fontSize: "0.625rem",
          fontFamily: DS.mono,
          letterSpacing: "0.22em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ServicesSectionInner({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const { data } = useQuery({
    queryKey: ["landing-services", locale],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{
          data: {
            services: Array<{
              id: string; slug: string;
              title: string | null; shortDescription: string | null;
              icon: string; startingPrice: number; technologies: string[];
            }>;
          };
        }>(`/api/v1/services`, { params: { lang: locale, limit: 4 }, throwOnError: false });
        return res;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const services = data?.data?.services?.length
    ? data.data.services.slice(0, 5).map((s, i) => {
        const colors = [DS.blue, DS.purple, DS.cyan, DS.green, DS.amber];
        return {
          id: s.id,
          slug: s.slug,
          title: s.title ?? s.id,
          description: s.shortDescription ?? "",
          color: colors[i % colors.length],
          priceFrom: s.startingPrice ? `${s.startingPrice.toLocaleString("vi-VN")} VNĐ` : "Liên hệ",
          tags: Array.isArray(s.technologies) && s.technologies.length > 0
            ? s.technologies.slice(0, 3)
            : ["React", "Next.js", "TypeScript"],
        };
      })
    : FALLBACK_SERVICES;

  return (
    <section style={{ padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <Badge label={t("servicesSectionBadge")} />
          <h2
            style={{
              fontFamily: DS.heading,
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "0.05em",
              background: "linear-gradient(135deg, #FFFFFF, #94A3B8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.875rem",
            }}
          >
            {t("servicesSectionTitle")}
          </h2>
          <p style={{ color: DS.text3, fontSize: "1rem", maxWidth: 540, margin: "0 auto", lineHeight: 1.8 }}>
            {t("servicesSectionDesc")}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {services.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                href={`/${locale}/services/${svc.slug}`}
                style={{ textDecoration: "none", display: "block", height: "100%" }}
              >
                <motion.div
                  style={{
                    height: "100%",
                    borderRadius: "1rem",
                    padding: "1.75rem",
                    background: "rgba(15,23,42,0.7)",
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${DS.border}`,
                    cursor: "pointer",
                  }}
                  whileHover={{
                    borderColor: `${svc.color}40`,
                    boxShadow: `0 8px 40px ${svc.color}15, 0 0 0 1px ${svc.color}15`,
                    y: -4,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${svc.color}15`,
                        border: `1px solid ${svc.color}30`,
                      }}
                    >
                      <span style={{ color: svc.color }}>
                        {SERVICE_ICONS[svc.id] ?? <Globe size={26} />}
                      </span>
                    </div>
                    <ArrowRight size={16} style={{ color: svc.color, marginTop: 4, opacity: 0.6 }} />
                  </div>

                  <h3
                    style={{
                      color: DS.text,
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      marginBottom: "0.625rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {svc.title}
                  </h3>
                  <p
                    style={{
                      color: DS.text3,
                      fontSize: "0.84375rem",
                      lineHeight: 1.8,
                      marginBottom: "1.125rem",
                    }}
                  >
                    {svc.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {svc.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          color: svc.color,
                          fontSize: "0.625rem",
                          fontFamily: DS.mono,
                          padding: "0.1875rem 0.5rem",
                          borderRadius: 4,
                          background: `${svc.color}10`,
                          border: `1px solid ${svc.color}20`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "1rem",
                      borderTop: `1px solid ${DS.border}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: DS.text5,
                          fontSize: "0.625rem",
                          fontFamily: DS.mono,
                          marginBottom: "0.125rem",
                        }}
                      >
                        {t("priceFrom")}
                      </div>
                      <div style={{ color: svc.color, fontSize: "0.875rem", fontWeight: 700 }}>
                        {svc.priceFrom}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: DS.text5,
                          fontSize: "0.625rem",
                          fontFamily: DS.mono,
                          marginBottom: "0.125rem",
                        }}
                      >
                        {t("lpRewardLabel")}
                      </div>
                      <div
                        style={{
                          color: DS.purple,
                          fontSize: "0.75rem",
                          fontFamily: DS.mono,
                        }}
                      >
                        {t("lpRewardPer", { amount: "500", threshold: "10M" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link
            href={`/${locale}/thiet-ke-website`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.625rem",
              background: GRD.primary,
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "0.75rem 1.75rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              boxShadow: GLOW.purple,
            }}
          >
            <MousePointer size={15} />
            {t("ctaBookingWizard")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ServicesSection({ locale }: { locale: string }) {
  return <ServicesSectionInner locale={locale} />;
}
