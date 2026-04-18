"use client";
/**
 * TestimonialsClient — Dedicated testimonials page
 * Dark cosmic theme
 */
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Star, ChevronLeft, ChevronRight, Quote, ArrowRight, User } from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  service?: string;
  delay: number;
}

function TestimonialCard({ name, role, company, avatar, rating, text, service, delay }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${hexRgba(DS.cosmicPurple, 0.15)}`,
        borderRadius: 20,
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        position: "relative",
      }}
    >
      <Quote size={32} style={{ color: DS.pink, opacity: 0.6, position: "absolute", top: "1.5rem", right: "1.5rem" }} />
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} style={{ color: i < rating ? DS.gold : DS.text4, fill: i < rating ? DS.gold : "transparent" }} />
        ))}
      </div>
      <p style={{ fontSize: "1rem", color: DS.text2, lineHeight: 1.7, fontStyle: "italic", flex: 1 }}>
        &ldquo;{text}&rdquo;
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingTop: "1rem", borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}` }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: GRD.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "1rem", color: DS.text,
          flexShrink: 0, overflow: "hidden",
        }}>
          {avatar ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} />}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: DS.text, fontSize: "0.9375rem" }}>{name}</div>
          <div style={{ fontSize: "0.8125rem", color: DS.text3 }}>{role} · {company}</div>
          {service && (
            <div style={{
              fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.05em", color: DS.cosmicCyan,
              marginTop: "0.25rem",
            }}>
              {service}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface CaseStudyCardProps {
  title: string;
  client: string;
  results: string;
  image: string;
  slug: string;
  delay: number;
}

function CaseStudyCard({ title, client, results, image, slug, delay }: CaseStudyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${hexRgba(DS.cosmicPurple, 0.15)}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{
        height: 160,
        background: GRD.primary,
        position: "relative",
        overflow: "hidden",
      }}>
        {image ? (
          <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, ${DS.cosmicPurple}60, ${DS.pink}40)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "3rem", fontWeight: 900, color: DS.text, opacity: 0.3 }}>{client.charAt(0)}</span>
          </div>
        )}
      </div>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: "0.75rem", color: DS.pink, fontWeight: 600, marginBottom: "0.375rem", textTransform: "uppercase" }}>{client}</div>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: DS.text, marginBottom: "0.5rem", lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: "0.8125rem", color: DS.text3, lineHeight: 1.5 }}>{results}</p>
        <Link href={`/${slug}`} style={{
          display: "inline-flex", alignItems: "center", gap: "0.25rem",
          color: DS.pink, fontSize: "0.8125rem", fontWeight: 600,
          marginTop: "0.75rem", textDecoration: "none",
        }}>
          Đọc case study <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function TestimonialsClient({
  locale,
  testimonials,
  caseStudyProjects,
}: {
  locale: string;
  testimonials: { id: string; name: string; role: string; company: string; avatar: string; rating: number; text: string }[];
  caseStudyProjects: { id: string; title: string; client: string; results: string; image: string; titleEn?: string | null; resultsEn?: string | null }[];
}) {
  const t = useTranslations("TestimonialsPage");
  const [activeFilter, setActiveFilter] = useState("all");

  const serviceFilters = [
    { key: "all", label: t("filterAllServices") },
    { key: "web", label: t("filterWeb") },
    { key: "mobile", label: t("filterMobile") },
    { key: "dashboard", label: t("filterDashboard") },
    { key: "seo", label: t("filterSeo") },
    { key: "media", label: t("filterMedia") },
  ];

  const changelogs = [
    { date: "2026-04-10", type: "feature", title: "Revenue Split System", description: "Hệ thống chia doanh thu theo role — PM, Dev, QA, Designer, SEO. Tự động tạo OffSystemSplit khi ghi nhận chi phí ngoài." },
    { date: "2026-04-07", type: "improvement", title: "Nâng cấp dashboard analytics", description: "Cập nhật biểu đồ doanh thu tháng, thêm filter theo phòng ban và dịch vụ." },
    { date: "2026-04-04", type: "feature", title: "Department System v4.0", description: "Mô hình 8 phòng ban hoàn chỉnh — Trưởng phòng, KPI, OrgChart 3 modes, bulk assign." },
    { date: "2026-04-01", type: "improvement", title: "RBAC redesign", description: "Phân quyền theo tab — mỗi tab = 1 permission riêng, CEO gán cho từng member." },
    { date: "2026-03-28", type: "bugfix", title: "Sửa lỗi SSE timeout", description: "Tăng heartbeat interval từ 15s lên 25s, giảm orphan connections." },
    { date: "2026-03-25", type: "security", title: "Audit log cho permission changes", description: "Ghi nhận tất cả thay đổi permissions — ai gán, gán gì, lúc nào." },
    { date: "2026-03-20", type: "feature", title: "Spring Festival Quest", description: "Quest event mùa xuân — ×2 LP bonus cho tất cả nhân viên." },
    { date: "2026-03-15", type: "improvement", title: "Video Gate 35%", description: "Cải tiến logic video gate — theo dõi % xem, tự động mở khóa bài tiếp theo." },
    { date: "2026-03-10", type: "feature", title: "LOOP Academy — 7 khóa học", description: "Hệ thống đào tạo nội bộ hoàn chỉnh: video, code exercise, certificate." },
    { date: "2026-03-01", type: "feature", title: "Customer VIP Tiers", description: "Hệ thống VIP 3 bậc cho khách hàng: regular → vip1 → vip2 → vip3." },
  ];

  const typeConfig: Record<string, { label: string; color: string }> = {
    feature: { label: "Tính năng mới", color: DS.cosmicCyan },
    improvement: { label: "Cải tiến", color: DS.cosmicBlue },
    bugfix: { label: "Sửa lỗi", color: DS.green },
    security: { label: "Bảo mật", color: DS.red || "#CC3344" },
  };

  return (
    <div style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        position: "relative",
        background: DS.bgDeep || "#0A0A14",
        padding: "7rem 2rem 4rem",
        textAlign: "center",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: GRD.cosmicBg1, opacity: 0.5 }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span style={{
              display: "inline-block",
              background: hexRgba(DS.pink, 0.1),
              border: `1px solid ${hexRgba(DS.pink, 0.3)}`,
              color: DS.pink,
              padding: "0.375rem 1rem",
              borderRadius: 9999,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "1.5rem",
            }}>
              Testimonials
            </span>
            <h1 style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              background: `linear-gradient(135deg, ${DS.text} 0%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1rem",
            }}>
              {t("heroTitle")}{" "}
              <span style={{
                background: `linear-gradient(135deg, ${DS.pink}, ${DS.cosmicPurple})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {t("heroHighlight")}
              </span>
            </h1>
            <p style={{ color: DS.text3, fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
              {t("heroDesc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {testimonials.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "1.25rem",
            }}>
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.id} {...t} delay={i * 0.05} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>
              Không có testimonial nào trong hệ thống.
            </div>
          )}
        </div>
      </section>

      {/* Case Studies from Real Projects */}
      {caseStudyProjects.length > 0 && (
        <section style={{
          padding: "4rem 2rem",
          background: hexRgba(DS.cosmicPurple, 0.04),
          borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}`,
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, color: DS.text, marginBottom: "0.5rem" }}>
                Case Studies thực tế
              </h2>
              <p style={{ color: DS.text3 }}>Những dự án đã được đo lường kết quả kinh doanh</p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}>
              {caseStudyProjects.map((p, i) => (
                <CaseStudyCard
                  key={p.id}
                  title={locale !== "vi" && p.titleEn ? p.titleEn : p.title}
                  client={p.client}
                  results={locale !== "vi" && p.resultsEn ? p.resultsEn : p.results}
                  image={p.image}
                  slug={`/${locale}/portfolio/${p.id}`}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Changelog Section */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: DS.text, marginBottom: "0.5rem" }}>
              Cập nhật sản phẩm
            </h2>
            <p style={{ color: DS.text3 }}>Những tính năng mới, cải tiến và sửa lỗi gần đây</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {changelogs.map((entry, i) => {
              const cfg = typeConfig[entry.type] || typeConfig.improvement;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    background: DS.bgCard,
                    border: `1px solid ${hexRgba(cfg.color, 0.15)}`,
                    borderRadius: 12,
                    padding: "1.25rem 1.5rem",
                  }}
                >
                  <div style={{ minWidth: 80, textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: DS.text4, fontWeight: 600 }}>{entry.date.split("-")[2]}</div>
                    <div style={{ fontSize: "0.6875rem", color: DS.text4 }}>{entry.date.split("-")[1]}/{entry.date.split("-")[0]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.375rem" }}>
                      <span style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: cfg.color,
                        background: hexRgba(cfg.color, 0.1),
                        border: `1px solid ${hexRgba(cfg.color, 0.25)}`,
                        padding: "0.125rem 0.5rem",
                        borderRadius: 9999,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.9375rem", fontWeight: 800, color: DS.text, marginBottom: "0.25rem" }}>
                      {entry.title}
                    </h4>
                    <p style={{ fontSize: "0.8125rem", color: DS.text3, lineHeight: 1.5 }}>
                      {entry.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href={`/${locale}/changelog`} style={{
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
              Xem đầy đủ changelog <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "5rem 2rem",
        background: GRD.primary,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 900, color: DS.text, marginBottom: "1rem" }}>
            Sẵn sàng bắt đầu?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "2rem", lineHeight: 1.7 }}>
            Trở thành một trong những khách hàng tiếp theo của LOOP Solutions.
          </p>
          <Link href={`/${locale}/thiet-ke-website`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem 2rem",
            background: DS.text,
            color: DS.cosmicPurple,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}>
            Bắt đầu dự án <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}