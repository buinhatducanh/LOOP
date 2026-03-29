"use client";

/**
 * ServicesSection — Client Component
 *
 * Fetches services via React Query (requires QueryProvider).
 * Extracted from LandingPage to keep the main page structure clean.
 */

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Globe, Code2, BarChart3, Target,
  ArrowRight,
  MousePointer,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
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
    id: "1", slug: "web-design", title: "Thiết kế & Phát triển Web",
    description: "Website cao cấp, tối ưu chuyển đổi với React/Next.js. Từ landing page đến e-commerce phức tạp.",
    color: DS.blue,
    priceFrom: "15,000,000 VNĐ",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "2", slug: "app-saas", title: "Phát triển App & SaaS",
    description: "Từ MVP đến enterprise. Mobile app, web app và nền tảng SaaS scalable cho hàng triệu người dùng.",
    color: DS.purple,
    priceFrom: "80,000,000 VNĐ",
    tags: ["React Native", "Node.js", "AWS"],
  },
  {
    id: "3", slug: "dashboard", title: "Dashboard & Analytics",
    description: "Biến dữ liệu thành insight. Real-time dashboard, báo cáo tự động và data visualization.",
    color: DS.cyan,
    priceFrom: "25,000,000 VNĐ",
    tags: ["React", "D3.js", "BigQuery"],
  },
  {
    id: "4", slug: "seo-marketing", title: "SEO & Digital Marketing",
    description: "Tăng trưởng organic bền vững. Technical SEO, content strategy và quảng cáo hiệu suất cao.",
    color: DS.green,
    priceFrom: "8,000,000 VNĐ/tháng",
    tags: ["SEO", "Google Ads", "Analytics"],
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
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.22em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ServicesSectionInner({ locale }: { locale: string }) {
  const { data } = useQuery({
    queryKey: ["landing-services", locale],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{
          data: Array<{
            id: string; slug: string;
            titleVi: string; titleEn: string;
            descriptionVi: string; descriptionEn: string;
            icon: string; basePrice: number;
          }>;
        }>(`/api/v1/services`, { params: { lang: locale, limit: 4 }, throwOnError: false });
        return res;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const services = data?.data?.length
    ? data.data.map((s, i) => {
        const colors = [DS.blue, DS.purple, DS.cyan, DS.green];
        return {
          id: s.id,
          slug: s.slug,
          title: s.titleVi ?? s.titleEn ?? s.id,
          description: s.descriptionVi ?? s.descriptionEn ?? "",
          color: colors[i % colors.length],
          priceFrom: s.basePrice ? `${s.basePrice.toLocaleString("vi-VN")} VNĐ` : "Liên hệ",
          tags: ["React", "Next.js", "TypeScript"],
        };
      })
    : FALLBACK_SERVICES;

  return (
    <section style={{ padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <Badge label="DỊCH VỤ CHUYÊN NGHIỆP" />
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
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
            GIẢI PHÁP TOÀN DIỆN
          </h2>
          <p style={{ color: DS.text3, fontSize: "1rem", maxWidth: 540, margin: "0 auto", lineHeight: 1.8 }}>
            Mọi dịch vụ đều được thanh toán bằng VNĐ. Tích lũy LP điểm thưởng và nhận ưu đãi ngay từ dự án đầu tiên.
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
                          fontFamily: "'JetBrains Mono', monospace",
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
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: "0.125rem",
                        }}
                      >
                        GIÁ TỪ (VNĐ)
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
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: "0.125rem",
                        }}
                      >
                        ĐIỂM THƯỞNG LP
                      </div>
                      <div
                        style={{
                          color: DS.purple,
                          fontSize: "0.75rem",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        ◈ 500 LP / 10M
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
            href={`/${locale}/dat-lich`}
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
              boxShadow: "0 0 30px rgba(129,140,248,0.35)",
            }}
          >
            <MousePointer size={15} />
            Đặt lịch tư vấn miễn phí — 8 bước dễ dàng
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Public export: wraps ServicesSection with QueryProvider
 * so React Query works without needing provider at page level.
 */
export default function ServicesSection({ locale }: { locale: string }) {
  return (
    <QueryProvider>
      <ServicesSectionInner locale={locale} />
    </QueryProvider>
  );
}
