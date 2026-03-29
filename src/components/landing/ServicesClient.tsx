"use client";

/**
 * ServicesClient — Figma dark Services page with real DB data.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight, Rocket, Shield, Sparkles, Star, MousePointer,
  ChevronRight, ChevronDown, ChevronUp, ArrowUpRight, CheckCircle2,
  LayoutGrid, List, Sparkles as SparkAlt,
  Zap as ZapAlt, Clock as ClockAlt,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

const fmtVND = (n: number | null | undefined) =>
  n == null ? "Liên hệ" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

const ALL_PACKAGES = [
  {
    id: "nha-hang", industry: "Web Nhà hàng",
    icon: "🍜", color: "#F59E0B",
    gradFrom: "#F59E0B", gradTo: "#EF4444",
    tagline: "Thực đơn online · Đặt bàn · Giao hàng",
    description: "Website nhà hàng chuyên nghiệp với thực đơn đẹp, đặt bàn trực tuyến, tích hợp giao hàng.",
    trialDays: 5, trialPrice: 0, fullPrice: 7_900_000,
    activateTime: "2 giờ", badge: "PHỔ BIẾN NHẤT", badgeColor: "#F59E0B",
    features: ["Thực đơn dạng ảnh + mô tả", "Đặt bàn online (form + xác nhận", "Tích hợp Grab/ShopeeFood", "Gallery ảnh món ăn", "Review & Rating khách hàng", "Bản đồ & giờ mở cửa", "Fanpage tích hợp", "SEO tối ưu cho từ khóa địa phương"],
    previewImg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    category: "ăn uống", popular: true, lp: 395,
  },
  {
    id: "spa", industry: "Web Spa & Làm đẹp",
    icon: "💆", color: "#C084FC",
    gradFrom: "#C084FC", gradTo: "#818CF8",
    tagline: "Booking online · Gallery dịch vụ · Voucher",
    description: "Website spa sang trọng với bảng giá dịch vụ, đặt lịch trực tuyến, gallery before/after và hệ thống voucher ưu đãi.",
    trialDays: 5, trialPrice: 0, fullPrice: 8_500_000,
    activateTime: "2 giờ", badge: "HOT", badgeColor: "#EF4444",
    features: ["Booking online có nhắc nhở qua SMS", "Gallery before/after ấn tượng", "Bảng giá dịch vụ đẹp", "Hệ thống voucher & ưu đãi", "Đội ngũ chuyên viên", "Video giới thiệu", "Tích hợp Zalo OA", "Form tư vấn da miễn phí"],
    previewImg: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
    category: "sức khỏe", popular: true, lp: 425,
  },
  {
    id: "nha-thuoc", industry: "Web Nhà thuốc",
    icon: "💊", color: "#22C55E",
    gradFrom: "#22C55E", gradTo: "#14B8A6",
    tagline: "Tra cứu thuốc · Đặt hàng · Tư vấn dược sĩ",
    description: "Website nhà thuốc uy tín với hệ thống tra cứu thuốc, đặt hàng online, tư vấn từ dược sĩ.",
    trialDays: 3, trialPrice: 0, fullPrice: 9_900_000,
    activateTime: "4 giờ", features: ["Tra cứu thuốc thông minh (tên, hoạt chất)", "Đặt hàng online giao tận nhà", "Chat tư vấn với dược sĩ", "Hồ sơ bệnh nhân & nhắc uống thuốc", "Nhập xuất tồn kho", "Chứng nhận GPP & giấy phép", "Blog sức khỏe SEO", "Kết nối bảo hiểm y tế"],
    previewImg: "https://images.unsplash.com/photo-1585435557343-3b092cdfbb2a?auto=format&fit=crop&w=600&q=80",
    category: "sức khỏe", lp: 495,
  },
  {
    id: "cafe", industry: "Web Café & Trà sữa",
    icon: "☕", color: "#D97706",
    gradFrom: "#D97706", gradTo: "#F59E0B",
    tagline: "Menu digital · Không gian · Order online",
    description: "Website café trendy với menu digital đẹp, giới thiệu không gian, loyalty card tích điểm.",
    trialDays: 5, trialPrice: 0, fullPrice: 6_500_000,
    activateTime: "2 giờ", features: ["Menu digital với filter đồ uống", "Order takeaway & pickup", "Loyalty card tích điểm", "Gallery không gian check-in", "WiFi password thông minh", "Sự kiện & ưu đãi đặc biệt", "Review Google Maps tích hợp"],
    previewImg: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80",
    category: "ăn uống", lp: 325,
  },
  {
    id: "khach-san", industry: "Web Khách sạn & Resort",
    icon: "🏨", color: "#3B82F6",
    gradFrom: "#3B82F6", gradTo: "#06B6D4",
    tagline: "Đặt phòng · Gallery · Tiện nghi",
    description: "Website khách sạn sang trọng với hệ thống đặt phòng real-time, gallery 360°, giới thiệu tiện nghi và tích hợp OTA.",
    trialDays: 5, trialPrice: 0, fullPrice: 14_900_000,
    activateTime: "4 giờ", badge: "PREMIUM", badgeColor: "#3B82F6",
    features: ["Đặt phòng real-time với lịch availability", "Gallery 360° virtual tour", "Giới thiệu loại phòng & tiện nghi", "Tích hợp Booking.com, Agoda, AirBnB", "Bản đồ điểm tham quan xung quanh", "Đa ngôn ngữ (VI/EN/ZH)", "Chatbot 24/7 tư vấn", "CMS quản lý giá phòng theo ngày"],
    previewImg: "https://images.unsplash.com/photo-1566073771259-6a8c4a9b4e9c?auto=format&fit=crop&w=600&q=80",
    category: "lưu trú", popular: true, lp: 745,
  },
  {
    id: "gym", industry: "Web Gym & Fitness",
    icon: "💪", color: "#EF4444",
    gradFrom: "#EF4444", gradTo: "#F97316",
    tagline: "Lịch tập · Đăng ký thành viên · PT",
    description: "Website gym năng động với lịch tập hàng tuần, đăng ký gói thành viên, hồ sơ huấn luyện viên và tracking kết quả.",
    trialDays: 3, trialPrice: 0, fullPrice: 8_900_000,
    activateTime: "2 giờ", features: ["Lịch tập lớp nhóm hàng tuần", "Đăng ký thành viên online", "Hồ sơ huấn luyện viên", "Gallery thiết bị & không gian", "Tracking tiến độ tập luyện", "Blog dinh dưỡng & thể hình", "Chương trình referral", "App mobile companion (add-on)"],
    previewImg: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
    category: "sức khỏe", lp: 445,
  },
  {
    id: "bat-dong-san", industry: "Web Bất động sản",
    icon: "🏠", color: "#14B8A6",
    gradFrom: "#14B8A6", gradTo: "#818CF8",
    tagline: "Tìm kiếm BDS · Virtual tour · CRM",
    description: "Website bất động sản chuyên nghiệp với công cụ tìm kiếm thông minh, bản đồ tích hợp và CRM quản lý leads.",
    trialDays: 5, trialPrice: 0, fullPrice: 18_900_000,
    activateTime: "6 giờ", badge: "ENTERPRISE", badgeColor: "#14B8A6",
    features: ["Tìm kiếm BDS theo bộ lọc nâng cao", "Virtual tour 360° từng căn hộ", "Bản đồ tích hợp Google Maps", "CRM quản lý leads tự động", "Tính toán trả góp ngân hàng", "So sánh căn hộ side-by-side", "Form đặt cọc & hợp đồng online", "Dashboard báo cáo môi giới"],
    previewImg: "https://images.unsplash.com/photo-1560518883-ce09059ee634?auto=format&fit=crop&w=600&q=80",
    category: "bất động sản", popular: true, lp: 945,
  },
  {
    id: "web-ca-nhan", industry: "Web Cá nhân / Portfolio",
    icon: "👤", color: "#818CF8",
    gradFrom: "#818CF8", gradTo: "#7DD3FC",
    tagline: "Portfolio · CV online · Landing cá nhân",
    description: "Trang cá nhân chuyên nghiệp, portfolio ấn tượng, CV online tương tác.",
    trialDays: 3, trialPrice: 0, fullPrice: 3_500_000,
    activateTime: "1 giờ", features: ["Portfolio ấn tượng", "CV online tương tác", "Form liên hệ", "SEO cá nhân", "Responsive trên mọi thiết bị"],
    previewImg: "https://images.unsplash.com/photo-1497032628192-86dc8a19e13e?auto=format&fit=crop&w=600&q=80",
    category: "khác", lp: 175,
  },
];

const CATEGORIES = ["Tất cả", "ăn uống", "sức khỏe", "lưu trú", "bất động sản", "khác"];

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: "0.5625rem",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        letterSpacing: "0.1em",
        background: hexRgba(color, 0.12),
        border: `1px solid ${hexRgba(color, 0.3)}`,
        color,
      }}
    >
      {label}
    </span>
  );
}

function ProcessStep({
  n, title, desc, color,
}: { n: string; title: string; desc: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        padding: "1.25rem",
        borderRadius: 12,
        background: "rgba(15,23,42,0.6)",
        border: `1px solid ${DS.border}`,
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          fontSize: "4rem",
          fontFamily: "'Cinzel', serif",
          fontWeight: 900,
          color: hexRgba(color, 0.06),
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {n}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: hexRgba(color, 0.12),
          border: `1px solid ${hexRgba(color, 0.25)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.875rem",
        }}
      >
        <ClockAlt size={16} style={{ color }} />
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.5625rem",
          color,
          letterSpacing: "0.15em",
          marginBottom: "0.375rem",
          textTransform: "uppercase",
        }}
      >
        Step {n}
      </div>
      <div style={{ color: DS.text, fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ color: DS.text4, fontSize: "0.8125rem", lineHeight: 1.6 }}>{desc}</div>
    </motion.div>
  );
}

function PackageCard({ pkg, locale }: { pkg: typeof ALL_PACKAGES[0]; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const grad = `linear-gradient(135deg, ${pkg.gradFrom}, ${pkg.gradTo})`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        borderRadius: 16,
        background: "rgba(15,23,42,0.7)",
        border: `1px solid ${DS.border}`,
        backdropFilter: "blur(16px)",
        overflow: "hidden",
        cursor: "pointer",
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 }}}
    >
      {/* Header gradient banner */}
      <div
        style={{
          background: grad,
          padding: "1.5rem",
          position: "relative",
        }}
      >
        {pkg.badge && (
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <Badge label={pkg.badge} color={pkg.badgeColor} />
          </div>
        )}
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{pkg.icon}</div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.03em",
          }}
        >
          {pkg.industry}
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          {pkg.tagline}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.25rem" }}>
        {/* Pricing */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 2 }}>GIÁ WEBPACKAGE</div>
            <div style={{ color: pkg.color, fontSize: "1.25rem", fontWeight: 800, fontFamily: "'Cinzel', serif" }}>
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(pkg.fullPrice)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 2 }}>HOẶC TRIAL</div>
            <div style={{ color: pkg.color, fontSize: "1rem", fontWeight: 600 }}>
              {pkg.trialPrice === 0 ? "Miễn phí" : fmtVND(pkg.trialPrice)}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/${locale}/contact`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.5rem",
            borderRadius: 8,
            background: hexRgba(pkg.color, 0.1),
            border: `1px solid ${hexRgba(pkg.color, 0.25)}`,
            color: pkg.color,
            fontSize: "0.8125rem",
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: "0.875rem",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = hexRgba(pkg.color, 0.18); }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = hexRgba(pkg.color, 0.1); }}
        >
          <Rocket size={13} style={{ display: "inline", marginRight: 4 }} />
          Dùng thử {pkg.trialDays} ngày — {pkg.activateTime} kích hoạt
        </Link>

        <div style={{ borderTop: `1px solid ${DS.border}`, margin: "0.875rem 0" }} />

        {/* Features */}
        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>TÍNH NĂNG BAO GỒM</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {pkg.features.slice(0, expanded ? undefined : 5).map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: DS.text3 }}>
                <CheckCircle2 size={12} style={{ color: pkg.color, flexShrink: 0, marginTop: 2 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
          {pkg.features.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: pkg.color,
                fontSize: "0.75rem",
                cursor: "pointer",
                padding: "0.25rem 0",
                marginTop: "0.5rem",
              }}
            >
              {expanded ? "Thu gọn" : `+${pkg.features.length - 5} tính năng khác`}
              {expanded ? <ChevronUp style={{ color: pkg.color }} size={12} /> : <ChevronDown style={{ color: pkg.color }} size={12} />}
            </button>
          )}
        </div>

        {/* LP reward */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: hexRgba(pkg.color, 0.06),
            border: `1px solid ${hexRgba(pkg.color, 0.15)}`,
          }}
        >
          <ZapAlt size={12} style={{ color: pkg.color }} />
          <span style={{ color: DS.text3, fontSize: "0.75rem" }}>
            Đặt gói này nhận
          </span>
          <span style={{ color: DS.purple, fontWeight: 600, fontSize: "0.8125rem", fontFamily: "'JetBrains Mono', monospace" }}>
            +{fmtLP(pkg.lp)} LP
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ServicesClient({
  locale,
  services,
}: {
  locale: string;
  services: Record<string, unknown>[];
}) {
  const [activeCat, setActiveCat] = useState("Tất cả");
  const filtered = activeCat === "Tất cả"
    ? ALL_PACKAGES
    : ALL_PACKAGES.filter((p) => p.category === activeCat);

  return (
    <main style={{ background: DS.bg, minHeight: "100vh", paddingTop: 0 }}>
      {/* Hero */}
      <section
        style={{
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          background: `linear-gradient(180deg, rgba(59,130,246,0.07) 0%, transparent 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 1rem",
                borderRadius: 9999,
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: DS.blue,
                fontSize: "0.6875rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.18em",
                marginBottom: "1.5rem",
              }}
            >
              <Star size={10} style={{ color: DS.amber }} />
              WEBPACKAGES & DỊCH VỤ
            </div>
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 900,
                letterSpacing: "0.04em",
                background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "1rem",
                lineHeight: 1.1,
              }}
            >
              WEBPACKAGES & DỊCH VỤ TÙY CHỈNH
            </h1>
            <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.8, marginBottom: "2rem" }}>
              Chọn gói có sẵn để deploy nhanh trong vài giờ, hoặc liên hệ tùy chỉnh theo yêu cầu riêng.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
              <Link
                href={`/${locale}/contact`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: GRD.primary,
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  boxShadow: "0 0 30px rgba(129,140,248,0.4)",
                }}
              >
                <MousePointer size={16} />
                Báo giá tùy chỉnh
              </Link>
              <Link
                href={`/${locale}/portfolio`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  color: DS.text3,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 10,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Xem portfolio
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section style={{ padding: "0 1.5rem 2rem", display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => {
          const active = cat === activeCat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: 9999,
                fontSize: "0.8125rem",
                fontWeight: active ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: active ? GRD.primary : "transparent",
                border: active ? "none" : `1px solid ${DS.border}`,
                color: active ? "#fff" : DS.text3,
                boxShadow: active ? "0 0 16px rgba(129,140,248,0.35)" : "none",
              }}
            >
              {cat === "Tất cả" ? "Tất cả" : cat === "ăn uống" ? "🍜 Ăn uống" : cat === "sức khỏe" ? "💆 Sức khỏe" : cat === "lưu trú" ? "🏨 Lưu trú" : cat === "bất động sản" ? "🏠 BĐS" : cat === "khác" ? "📦 Khác" : cat}
            </button>
          );
        })}
      </section>

      {/* WebPackages grid */}
      <section style={{ padding: "0 1.5rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr)",
            gap: "1.25rem",
          }}
        >
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} locale={locale} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>
            Không có gói nào cho danh mục này.
          </div>
        )}
      </section>

      {/* Custom services */}
      {services.length > 0 && (
        <>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto 3rem",
              padding: "0 1.5rem",
            }}
          >
            <div
              style={{
                borderTop: `1px solid ${DS.border}`,
                paddingTop: "2rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: 9999,
                  background: "rgba(20,184,166,0.08)",
                  border: "1px solid rgba(20,184,166,0.2)",
                  color: DS.cyan,
                  fontSize: "0.6875rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.15em",
                  marginBottom: "1.5rem",
                }}
              >
                <SparkAlt size={10} />
                DỊCH VỤ TÙY CHỈNH
              </div>
              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(1.25rem, 3vw, 2rem",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: DS.text,
                  marginBottom: "0.5rem",
                }}
              >
                Dịch vụ tùy chỉnh theo yêu cầu riêng
              </h2>
              <p style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
                Ngoài các gói có sẵn, chúng tôi nhận dự án tùy chỉnh theo yêu cầu riêng.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr)",
                  gap: "1rem",
                }}
              >
                {services.map((svc: Record<string, unknown>) => (
                  <Link
                    key={svc.id as string}
                    href={`/${locale}/services/${svc.slug as string}`}
                    style={{
                      padding: "1.25rem",
                      borderRadius: 12,
                      background: "rgba(15,23,42,0.7)",
                      border: `1px solid ${DS.border}`,
                      textDecoration: "none",
                      display: "block",
                      transition: "border-color 0.2s ease, transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = DS.blue;
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = DS.border;
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ color: DS.blue, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                      {(svc.category as string)?.toUpperCase()}
                    </div>
                    <div style={{ color: DS.text, fontWeight: 600, fontSize: "1rem", marginBottom: "0.375rem" }}>
                      {(svc.title as string) ?? svc.titleEn ?? svc.titleVi ?? ""}
                    </div>
                    <div style={{ color: DS.text3, fontSize: "0.8125rem", marginBottom: "0.75rem", lineHeight: 1.6 }}>
                      {(svc.shortDescription as string) ?? (svc.shortDescriptionEn as string) ?? ""}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: DS.green, fontWeight: 700, fontSize: "0.875rem" }}>
                        {svc.startingPrice != null ? fmtVND(svc.startingPrice as number) : "Liên hệ"}
                      </div>
                      <ArrowRight size={14} style={{ color: DS.blue }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Process */}
      <section
        style={{
          padding: "4rem 1.5rem",
          background: "linear-gradient(180deg, rgba(15,23,42,0.4) 0%, transparent 100%)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: 9999,
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: DS.purple,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.18em",
              marginBottom: "1rem",
            }}
          >
            QUY TRÌNH LÀM VIỆC
          </div>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "3rem",
            }}
          >
            4 BƯỚC TRIỂN KHAI WEBSITE
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)",
              gap: "1rem",
            }}
          >
            <ProcessStep n="01" title="Liên hệ & Khảo sát" desc="Tư vấn 30 phút miễn phí. Phân tích nhu cầu, mục tiêu và ngân sách." color={DS.blue} />
            <ProcessStep n="02" title="Proposal & Timeline" desc="Gửi proposal chi tiết với tech stack, deliverables trong 24h." color={DS.purple} />
            <ProcessStep n="03" title="Thiết kế & Phát triển" desc="Agile sprint 2 tuần. Daily update. CI/CD tự động." color={DS.cyan} />
            <ProcessStep n="04" title="QA & Launch" desc="Kiểm tra chất lượng. Deploy production. Training & handover." color={DS.green} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          padding: "4rem 1.5rem",
          textAlign: "center",
          background: `radial-gradient(ellipse at 50% 50%, ${hexRgba(DS.blue, 0.08)} 0%, transparent 70%)`,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              color: DS.text,
              marginBottom: "1rem",
            }}
          >
            SẴN SÀNG BẮT ĐẦU?
          </h2>
          <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Đặt lịch tư vấn miễn phí 30 phút. Nhận ngay 500 LP điểm thưởng khi bắt đầu dự án.
          </p>
          <Link
            href={`/${locale}/contact`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 2rem",
              background: GRD.primary,
              color: "#fff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 0 40px rgba(129,140,248,0.4)",
            }}
          >
            <MousePointer size={18} />
            Đặt lịch tư vấn miễn phí
          </Link>
        </div>
      </section>
    </main>
  );
}
