"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { Check, ArrowRight, ArrowLeft, Clock, Zap, Monitor, Eye, X } from "lucide-react";

type ServiceRecord = Record<string, unknown>;

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const fmtVND = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n);

interface DetailLabels {
  backLink: string;
  badge: string;
  priceFrom: string;
  lpReward: string;
  viewDemo: string;
  bookConsult: string;
  demoSection: string;
  close: string;
  demoProtected: string;
  overviewTitle: string;
  processTitle: string;
  relatedProjectsTitle: string;
  faqTitle: string;
  featuresIncluded: string;
  techStack: string;
  sidebarDemoTitle: string;
  sidebarDemoDesc: string;
  openDemo: string;
  lpInfoTitle: string;
  lpInfoDesc: string;
  ctaTitle: string;
  ctaSubtitle: string;
  demoDesc: string;
  lpPerMillion: string;
}

const DEFAULT_LABELS: DetailLabels = {
  backLink: "← Quay lại dịch vụ",
  badge: "DỊCH VỤ",
  priceFrom: "TỪ",
  lpReward: "THƯỞNG LP",
  viewDemo: "Xem Demo",
  bookConsult: "Đặt lịch tư vấn",
  demoSection: "DEMO BẢO VỆ",
  close: "Đóng",
  demoProtected: "URL được mã hóa · Không thể copy",
  overviewTitle: "Tổng quan dịch vụ",
  processTitle: "Quy trình triển khai",
  relatedProjectsTitle: "Dự án liên quan",
  faqTitle: "Câu hỏi thường gặp",
  featuresIncluded: "TÍNH NĂNG BAO GỒM",
  techStack: "CÔNG NGHỆ SỬ DỤNG",
  sidebarDemoTitle: "TRUY CẬP DEMO",
  sidebarDemoDesc: "Xem demo bảo vệ bằng URL mã hóa. Không thể copy hay share URL gốc.",
  openDemo: "Mở Demo ngay",
  lpInfoTitle: "THÔNG TIN LP",
  lpInfoDesc: "Mỗi 1M VNĐ giao dịch bạn nhận 50 LP. Tích lũy để đổi giảm giá dịch vụ tiếp theo.",
  ctaTitle: "Bắt đầu dự án ngay",
  ctaSubtitle: "Nhận tư vấn miễn phí trong 24h",
  demoDesc: "Demo được bảo vệ bằng mã hóa URL. Bạn có thể xem nhưng không thể copy hay chia sẻ URL gốc.",
  lpPerMillion: "50 LP / 1M VNĐ",
};

// ── Demo Preview Overlay ──────────────────────────────────────────────────────

function DemoPreviewOverlay({
  previewImg,
  serviceName,
  color,
  onClick,
}: {
  previewImg?: string;
  serviceName: string;
  color: string;
  onClick: () => void;
}) {
  const img =
    previewImg ||
    `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80`;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "1rem",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        border: `1px solid ${DS.border}`,
        height: 320,
      }}
    >
      <img
        src={img}
        alt={serviceName}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          background: "rgba(2,6,23,0.5)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "1rem",
            background: hexRgba(color, 0.5),
            boxShadow: `0 0 30px ${hexRgba(color, 0.25)}`,
            border: `1px solid ${hexRgba(color, 0.38)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Monitor size={28} style={{ color: "#fff" }} />
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Xem Demo
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "6px 12px",
            borderRadius: "0.5rem",
            background: "rgba(2,6,23,0.8)",
            border: `1px solid ${hexRgba(color, 0.19)}`,
            backdropFilter: "blur(8px)",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke={DS.green}
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span
            style={{
              color: DS.green,
              fontSize: 10,
              fontFamily: DS.mono,
            }}
          >
            URL được mã hóa · Không thể copy
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Demo Section ───────────────────────────────────────────────────────────────

function DemoSection({
  previewImg,
  serviceName,
  color,
  labels,
}: {
  previewImg?: string;
  serviceName: string;
  color: string;
  labels: DetailLabels;
}) {
  const [showDemo, setShowDemo] = useState(false);
  const img =
    previewImg ||
    `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80`;

  return (
    <div>
      <AnimatePresence mode="wait">
        {showDemo ? (
          <motion.div
            key="demo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Monitor size={15} style={{ color }} />
                <span
                  style={{
                    color,
                    fontSize: 12,
                    fontFamily: DS.mono,
                    letterSpacing: "0.15em",
                  }}
                >
                  {labels.demoSection}
                </span>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                style={{
                  color: DS.text4,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${DS.border}`,
                  borderRadius: 8,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <X size={12} />
                {labels.close}
              </button>
            </div>

            {/* DemoViewer iframe */}
            <div
              style={{
                borderRadius: "1rem",
                overflow: "hidden",
                border: `1px solid ${hexRgba(color, 0.25)}`,
                background: DS.bgCard,
              }}
            >
              <div
                style={{
                  background: DS.bgCard2,
                  borderBottom: `1px solid ${DS.border}`,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: DS.bg,
                    borderRadius: 6,
                    padding: "4px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DS.green} strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                    demo.loop-solutions.vn
                  </span>
                </div>
              </div>
              <div style={{ height: 360, position: "relative" }}>
                <img
                  src={img}
                  alt={serviceName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${hexRgba(color, 0.3)}`,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    color: DS.text4,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: "inline", marginRight: 4 }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  LOOP Solutions · Protected Preview
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                background: hexRgba(color, 0.04),
                border: `1px solid ${hexRgba(color, 0.1)}`,
              }}
            >
              <Monitor size={13} style={{ color, flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>
                {labels.demoDesc}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <DemoPreviewOverlay
              previewImg={previewImg}
              serviceName={serviceName}
              color={color}
              onClick={() => setShowDemo(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ServiceDetailClient({
  locale,
  service,
  relatedServices,
  tNav,
}: {
  locale: string;
  service: ServiceRecord;
  relatedServices: ServiceRecord[];
  tNav: Record<string, string>;
}) {
  const labels: DetailLabels = {
    backLink: tNav?.home ? `${tNav.home}` : "← Quay lại",
    badge: tNav?.home ? "DỊCH VỤ" : "DỊCH VỤ",
    priceFrom: "TỪ",
    lpReward: "THƯỞNG LP",
    viewDemo: "Xem Demo",
    bookConsult: tNav?.home ? tNav.home : "Đặt lịch tư vấn",
    demoSection: "DEMO BẢO VỆ",
    close: "Đóng",
    demoProtected: "URL được mã hóa · Không thể copy",
    overviewTitle: "Tổng quan dịch vụ",
    processTitle: "Quy trình triển khai",
    relatedProjectsTitle: "Dự án liên quan",
    faqTitle: "Câu hỏi thường gặp",
    featuresIncluded: "TÍNH NĂNG BAO GỒM",
    techStack: "CÔNG NGHỆ SỬ DỤNG",
    sidebarDemoTitle: "TRUY CẬP DEMO",
    sidebarDemoDesc: "Xem demo bảo vệ bằng URL mã hóa. Không thể copy hay share URL gốc.",
    openDemo: "Mở Demo ngay",
    lpInfoTitle: "THÔNG TIN LP",
    lpInfoDesc: "Mỗi 1M VNĐ giao dịch bạn nhận 50 LP. Tích lũy để đổi giảm giá dịch vụ tiếp theo.",
    ctaTitle: "Bắt đầu dự án ngay",
    ctaSubtitle: "Nhận tư vấn miễn phí trong 24h",
    demoDesc: "Demo được bảo vệ bằng mã hóa URL. Bạn có thể xem nhưng không thể copy hay chia sẻ URL gốc.",
    lpPerMillion: "50 LP / 1M VNĐ",
  };

  const title = (service.title as string) ?? "Dịch vụ";
  const category = (service.category as string) ?? "";
  const shortDesc = (service.shortDescription as string) ?? "";
  const longDesc = (service.longDescription as string) ?? "";
  const startingPrice = (service.startingPrice as number) ?? 0;
  const deliveryTime = (service.deliveryTime as string) ?? "";
  const features = Array.isArray(service.features) ? (service.features as string[]) : [];
  const technologies = Array.isArray(service.technologies) ? (service.technologies as string[]) : [];

  const color = DS.blue;

  // Build process steps from FE design
  const processSteps = [
    { title: "Discovery & Wireframe", desc: "Phân tích brand, UX research và tạo wireframe chi tiết." },
    { title: "UI Design & Prototype", desc: "Thiết kế Figma hoàn chỉnh, interactive prototype để review." },
    { title: "Development Sprint", desc: "Code React/Next.js với CI/CD, code review từng PR." },
    { title: "QA & Performance", desc: "Test đa thiết bị, lighthouse audit và tối ưu tốc độ." },
    { title: "Launch & Handover", desc: "Deploy, training, bàn giao source và nhận LP điểm thưởng." },
  ];

  const faqs = [
    { q: "Thời gian hoàn thành thường là bao lâu?", a: "Tùy dự án: Landing page 2-3 tuần, website đầy đủ 4-8 tuần, platform phức tạp 3-6 tháng." },
    { q: "Tôi có nhận được source code không?", a: "Có, bạn nhận full source code, tài liệu kỹ thuật và quyền sở hữu hoàn toàn sau khi thanh toán." },
    { q: "LP điểm thưởng được tính như thế nào?", a: "Mỗi 1M VNĐ giao dịch bạn nhận 50 LP. LP là điểm thưởng nội bộ, có thể dùng để giảm giá dịch vụ tiếp theo (max 20%)." },
  ];

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 60%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-14">
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              fontSize: 13,
              color: DS.text4,
            }}
          >
            <Link
              href={`/${locale}`}
              style={{
                color: DS.blue,
                textDecoration: "none",
                fontFamily: DS.mono,
              }}
            >
              {tNav?.home ?? "Trang chủ"}
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link
              href={`/${locale}/services`}
              style={{
                color: DS.blue,
                textDecoration: "none",
                fontFamily: DS.mono,
              }}
            >
              {tNav?.services ?? "Dịch vụ"}
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {category && (
              <span
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: DS.blue,
                  padding: "4px 14px",
                  borderRadius: 9999,
                  fontSize: 11,
                  fontFamily: DS.mono,
                  fontWeight: 700,
                }}
              >
                {category.toUpperCase()}
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: DS.heading,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              color: DS.text,
              marginBottom: 14,
              letterSpacing: "0.04em",
            }}
          >
            {title}
          </h1>
          {shortDesc && (
            <p
              style={{
                color: DS.text3,
                fontSize: 17,
                lineHeight: 1.8,
                maxWidth: 640,
                marginBottom: 24,
              }}
            >
              {shortDesc}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {startingPrice > 0 && (
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}
                >
                  <Zap size={13} style={{ color: DS.amber }} />
                  <span
                    style={{
                      color: DS.text4,
                      fontSize: 11,
                      fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {labels.priceFrom}
                  </span>
                </div>
                <p style={{ color: DS.amber, fontSize: 20, fontWeight: 800, fontFamily: DS.mono }}>
                  {fmtVND(startingPrice)}
                </p>
              </div>
            )}
            {deliveryTime && (
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}
                >
                  <Clock size={13} style={{ color: DS.cyan }} />
                  <span
                    style={{
                      color: DS.text4,
                      fontSize: 11,
                      fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                    }}
                  >
                    THỜI GIAN
                  </span>
                </div>
                <p style={{ color: DS.cyan, fontSize: 20, fontWeight: 800, fontFamily: DS.mono }}>
                  {deliveryTime}
                </p>
              </div>
            )}
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}
              >
                <Zap size={13} style={{ color: DS.purple }} />
                <span
                  style={{
                    color: DS.text4,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    letterSpacing: "0.1em",
                  }}
                >
                  {labels.lpReward}
                </span>
              </div>
              <p style={{ color: DS.purple, fontSize: 20, fontWeight: 800, fontFamily: DS.mono }}>
                {labels.lpPerMillion}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href={`/${locale}/contact`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 24px",
                  background: GRD.primary,
                  color: "#fff",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {labels.bookConsult} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Section ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <DemoSection
          previewImg={undefined}
          serviceName={title}
          color={color}
          labels={labels}
        />
      </div>

      {/* ── Content grid ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "2rem",
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Overview */}
            {longDesc && (
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: DS.bgCard,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 20,
                    padding: 32,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: DS.heading,
                      fontSize: 22,
                      fontWeight: 800,
                      color: DS.text,
                      marginBottom: 16,
                    }}
                  >
                    {labels.overviewTitle}
                  </h2>
                  <div style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>
                    {longDesc.split("\n").map((p, i) =>
                      p.trim() ? <p key={i} style={{ marginBottom: 12 }}>{p}</p> : null
                    )}
                  </div>
                </motion.div>
              </section>
            )}

            {/* Process */}
            <section>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  background: DS.bgCard,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 20,
                  padding: 32,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 4,
                      height: 20,
                      background: GRD.primary,
                      borderRadius: 2,
                    }}
                  />
                  <h2
                    style={{
                      fontFamily: DS.heading,
                      fontSize: 20,
                      fontWeight: 800,
                      color: DS.text,
                    }}
                  >
                    {labels.processTitle}
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {processSteps.map((step, i) => (
                    <div
                      key={step.title}
                      style={{
                        display: "flex",
                        gap: "1.25rem",
                        padding: "1rem",
                        borderRadius: "1rem",
                        background: "rgba(15,23,42,0.6)",
                        border: `1px solid ${DS.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: GRD.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontFamily: DS.mono,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div>
                        <div
                          style={{
                            color: DS.text,
                            fontSize: 15,
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {step.title}
                        </div>
                        <div
                          style={{
                            color: DS.text3,
                            fontSize: 13,
                            lineHeight: 1.7,
                          }}
                        >
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* Related services */}
            {relatedServices.length > 0 && (
              <section>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 20,
                      background: GRD.primary,
                      borderRadius: 2,
                    }}
                  />
                  <h2
                    style={{
                      fontFamily: DS.heading,
                      fontSize: 20,
                      fontWeight: 800,
                      color: DS.text,
                    }}
                  >
                    {labels.relatedProjectsTitle}
                  </h2>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {relatedServices.map((s) => (
                    <Link
                      key={s.id as string}
                      href={`/${locale}/services/${s.slug as string}`}
                      style={{
                        display: "block",
                        padding: "16px 20px",
                        background: DS.bgCard,
                        border: `1px solid ${DS.border}`,
                        borderRadius: 14,
                        textDecoration: "none",
                        color: "inherit",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          color: DS.text,
                          fontSize: 15,
                          marginBottom: 4,
                        }}
                      >
                        {s.title as string}
                      </p>
                      {(s.shortDescription as string) && (
                        <p
                          style={{
                            fontSize: 13,
                            color: DS.text4,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {(s.shortDescription as string).slice(0, 100)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: DS.bgCard,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 20,
                    padding: 32,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <div
                      style={{
                        width: 4,
                        height: 20,
                        background: GRD.primary,
                        borderRadius: 2,
                      }}
                    />
                    <h2
                      style={{
                        fontFamily: DS.heading,
                        fontSize: 20,
                        fontWeight: 800,
                        color: DS.text,
                      }}
                    >
                      {labels.faqTitle}
                    </h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {faqs.map((faq, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "1.25rem",
                          borderRadius: "1rem",
                          background: "rgba(15,23,42,0.6)",
                          border: `1px solid ${DS.border}`,
                        }}
                      >
                        <div
                          style={{
                            color: DS.blue,
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          Q: {faq.q}
                        </div>
                        <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>
                          {faq.a}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* Back */}
            <div>
              <Link
                href={`/${locale}/services`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: DS.blue,
                  textDecoration: "none",
                  fontFamily: DS.mono,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={14} /> Quay lại danh sách dịch vụ
              </Link>
            </div>
          </div>

          {/* Right sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Features */}
            {features.length > 0 && (
              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "1.25rem",
                  background: "rgba(15,23,42,0.8)",
                  border: `1px solid ${DS.border}`,
                }}
              >
                <div
                  style={{
                    color: DS.text3,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    letterSpacing: "0.15em",
                    marginBottom: 14,
                  }}
                >
                  {labels.featuresIncluded}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <Check
                        size={13}
                        style={{ color: DS.cyan, flexShrink: 0, marginTop: 1.5 }}
                      />
                      <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech stack */}
            {technologies.length > 0 && (
              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "1.25rem",
                  background: "rgba(15,23,42,0.8)",
                  border: `1px solid ${DS.border}`,
                }}
              >
                <div
                  style={{
                    color: DS.text3,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    letterSpacing: "0.15em",
                    marginBottom: 14,
                  }}
                >
                  {labels.techStack}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {technologies.map((tech, i) => (
                    <span
                      key={i}
                      style={{
                        color: DS.purple,
                        fontSize: 10,
                        fontFamily: DS.mono,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: `${DS.purple}1A`,
                        border: `1px solid ${hexRgba(DS.purple, 0.25)}`,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Demo access */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1.25rem",
                background: hexRgba(color, 0.05),
                border: `1px solid ${hexRgba(color, 0.15)}`,
              }}
            >
              <div
                style={{
                  color: color,
                  fontSize: 11,
                  fontFamily: DS.mono,
                  letterSpacing: "0.12em",
                  marginBottom: 10,
                }}
              >
                <Monitor
                  size={12}
                  style={{ display: "inline", marginRight: 6 }}
                />
                {labels.sidebarDemoTitle}
              </div>
              <p
                style={{
                  color: DS.text4,
                  fontSize: 12,
                  lineHeight: 1.6,
                  marginBottom: 12,
                }}
              >
                {labels.sidebarDemoDesc}
              </p>
            </div>

            {/* LP Info */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1.25rem",
                background: "rgba(129,140,248,0.08)",
                border: "1px solid rgba(129,140,248,0.25)",
              }}
            >
              <div
                style={{
                  color: DS.purple,
                  fontSize: 11,
                  fontFamily: DS.mono,
                  letterSpacing: "0.15em",
                  marginBottom: 10,
                }}
              >
                {labels.lpInfoTitle}
              </div>
              <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7 }}>
                {labels.lpInfoDesc}
              </p>
            </div>

            {/* CTA */}
            <Link
              href={`/${locale}/contact`}
              style={{
                display: "block",
                background: GRD.primary,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 20px",
                borderRadius: 14,
                textDecoration: "none",
                textAlign: "center",
                boxShadow: "0 0 30px rgba(129,140,248,0.35)",
              }}
            >
              {labels.ctaTitle}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  marginTop: 4,
                  opacity: 0.8,
                }}
              >
                {labels.ctaSubtitle}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
