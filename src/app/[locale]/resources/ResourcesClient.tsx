"use client";
/**
 * ResourcesClient — Content Hub for LOOP Solutions
 * Dark cosmic theme
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { BookOpen, FileText, CheckSquare, Download, ArrowRight, Search, Video, BarChart2, Code } from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface ResourceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
  readTime: string;
  href: string;
  color: string;
  type: string;
}

function ResourceCard({ icon, title, description, category, readTime, href, color, type }: ResourceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${hexRgba(color, 0.2)}`,
        borderRadius: 16,
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: hexRgba(color, 0.12),
          border: `1px solid ${hexRgba(color, 0.25)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{
          fontSize: "0.625rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color,
          background: hexRgba(color, 0.1),
          border: `1px solid ${hexRgba(color, 0.2)}`,
          padding: "0.25rem 0.625rem",
          borderRadius: 9999,
        }}>
          {type}
        </span>
      </div>
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: DS.text, marginBottom: "0.5rem", lineHeight: 1.3 }}>
          {title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: DS.text3, lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.75rem", borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}` }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: DS.text4, fontWeight: 600 }}>{category}</span>
          <span style={{ fontSize: "0.75rem", color: DS.text4 }}>·</span>
          <span style={{ fontSize: "0.75rem", color: DS.text4 }}>{readTime}</span>
        </div>
        <Link href={href} style={{
          color: color,
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          textDecoration: "none",
        }}>
          Xem <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

interface CategoryTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export default function ResourcesClient({ locale }: { locale: string }) {
  const t = useTranslations("ResourcesPage");

  const categories: CategoryTab[] = [
    { key: "all", label: "Tất cả", icon: <BookOpen size={14} />, color: DS.cosmicCyan },
    { key: "guide", label: "Hướng dẫn", icon: <FileText size={14} />, color: DS.cosmicBlue },
    { key: "checklist", label: "Checklist", icon: <CheckSquare size={14} />, color: DS.green },
    { key: "case-study", label: "Case Study", icon: <BarChart2 size={14} />, color: DS.pink },
    { key: "technical", label: "Kỹ thuật", icon: <Code size={14} />, color: DS.cosmicPurple },
    { key: "video", label: "Video", icon: <Video size={14} />, color: DS.gold },
  ];

  const resources = [
    {
      icon: <CheckSquare size={22} />,
      title: "Checklist chuyển đổi số cho doanh nghiệp SME",
      description: "20 bước cần làm để bắt đầu hành trình chuyển đổi số toàn diện — từ cơ sở hạ tầng đến văn hóa làm việc.",
      category: "Checklist",
      readTime: "15 phút đọc",
      href: `/${locale}/resources/checklist-digital-transformation`,
      color: DS.green,
      type: "PDF",
    },
    {
      icon: <FileText size={22} />,
      title: "Hướng dẫn chọn nền tảng thương mại điện tử: Shopify vs WooCommerce vs Custom",
      description: "So sánh chi tiết 3 nền tảng phổ biến nhất — giúp doanh nghiệp Việt chọn đúng giải pháp cho quy mô và ngân sách.",
      category: "Hướng dẫn",
      readTime: "12 phút đọc",
      href: `/${locale}/resources/ecommerce-platform-guide`,
      color: DS.cosmicBlue,
      type: "Article",
    },
    {
      icon: <BarChart2 size={22} />,
      title: "Case Study: Tăng 300% conversion rate sau khi redesign website",
      description: "Phân tích chi tiết dự án cải thiện website B2B — từ UX audit đến kết quả kinh doanh đo lường được.",
      category: "Case Study",
      readTime: "8 phút đọc",
      href: `/${locale}/case-studies`,
      color: DS.pink,
      type: "Case Study",
    },
    {
      icon: <Code size={22} />,
      title: "Next.js Performance Checklist — Core Web Vitals 2026",
      description: "Technical checklist 40 điểm để đạt Core Web Vitals xuất sắc trên Lighthouse. Bao gồm LCP, CLS, FID tối ưu.",
      category: "Kỹ thuật",
      readTime: "20 phút đọc",
      href: `/${locale}/resources/nextjs-performance-checklist`,
      color: DS.cosmicPurple,
      type: "Technical",
    },
    {
      icon: <Video size={22} />,
      title: "Workshop: Cách xây dựng dashboard KPI trong 60 phút",
      description: "Recording buổi workshop nội bộ LOOP — hướng dẫn từ thiết kế data model đến visualization với React + Recharts.",
      category: "Video",
      readTime: "60 phút",
      href: `/${locale}/resources/webinar-kpi-dashboard`,
      color: DS.gold,
      type: "Video",
    },
    {
      icon: <CheckSquare size={22} />,
      title: "Checklist bảo mật website: 25 điểm cần kiểm tra",
      description: "Security audit checklist cho website — từ SSL, CSP headers, XSS protection đến backup strategy và incident response.",
      category: "Checklist",
      readTime: "10 phút đọc",
      href: `/${locale}/resources/website-security-checklist`,
      color: DS.red || "#CC3344",
      type: "PDF",
    },
  ];

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
              background: hexRgba(DS.cosmicCyan, 0.1),
              border: `1px solid ${hexRgba(DS.cosmicCyan, 0.3)}`,
              color: DS.cosmicCyan,
              padding: "0.375rem 1rem",
              borderRadius: 9999,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "1.5rem",
            }}>
              Resources
            </span>
            <h1 style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              background: `linear-gradient(135deg, ${DS.text} 0%, ${DS.cosmicCyan} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1rem",
            }}>
              Trung tâm kiến thức
            </h1>
            <p style={{ color: DS.text3, fontSize: "1.0625rem", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 2rem" }}>
              Hướng dẫn chuyên sâu, checklist và case study giúp doanh nghiệp Việt Nam chuyển đổi số hiệu quả hơn.
            </p>
            <div style={{
              display: "flex",
              maxWidth: 480,
              margin: "0 auto",
              background: DS.bgCard,
              border: `1px solid ${hexRgba(DS.cosmicPurple, 0.3)}`,
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", padding: "0 1rem", color: DS.text4 }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: DS.text,
                  fontSize: "0.9375rem",
                  padding: "0.875rem 0.5rem",
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category filters */}
      <section style={{ padding: "2rem 2rem 0", position: "sticky", top: 0, zIndex: 10, background: `linear-gradient(180deg, ${DS.bg} 80%, transparent)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                borderRadius: 9999,
                border: `1px solid ${hexRgba(cat.color, 0.3)}`,
                background: cat.key === "all" ? hexRgba(cat.color, 0.12) : "transparent",
                color: cat.key === "all" ? cat.color : DS.text3,
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Resources grid */}
      <section style={{ padding: "3rem 2rem 5rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}>
            {resources.map((r, i) => (
              <ResourceCard key={i} {...r} />
            ))}
          </div>

          {/* Newsletter CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              marginTop: "4rem",
              background: DS.bgCard,
              border: `1px solid ${hexRgba(DS.cosmicPurple, 0.2)}`,
              borderRadius: 20,
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: DS.text, marginBottom: "0.75rem" }}>
              Nhận bài viết mới nhất
            </h2>
            <p style={{ color: DS.text3, marginBottom: "1.5rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
              Đăng ký nhận newsletter để cập nhật những bài viết chuyên sâu mới nhất về chuyển đổi số.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", maxWidth: 420, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
              <input
                type="email"
                placeholder="email@doanhnghiep.com"
                style={{
                  flex: 1,
                  minWidth: 200,
                  background: hexRgba(DS.cosmicPurple, 0.08),
                  border: `1px solid ${hexRgba(DS.cosmicPurple, 0.3)}`,
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  color: DS.text,
                  fontSize: "0.9375rem",
                  outline: "none",
                }}
              />
              <button style={{
                padding: "0.75rem 1.5rem",
                background: GRD.primary,
                color: DS.text,
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}>
                Đăng ký
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
