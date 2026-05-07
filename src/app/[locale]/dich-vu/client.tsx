"use client";

/**
 * DichVuClient — Bảng Giá Dịch Vụ tất cả 4 dịch vụ × 3 cấp
 * /dich-vu
 * Fetches from /api/services/pricing (server component passes data).
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { rgba } from "@/components/ui/utils";
import { ArrowRight, ChevronDown, Eye, X, Check, Minus, ArrowUpDown, Zap } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ServiceTier = {
  id: string;
  serviceKey: string;
  level: number;
  name: string;
  nameEn: string | null;
  shortDesc: string | null;
  basePrice: number;
  marketPrice: number | null;
  lpReward: number;
  sortOrder: number;
  isActive: boolean;
};

type ServiceAttribute = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  category: string;
  categoryEn: string | null;
  price: number;
  tier: string;
  serviceKey: string | null;
  includedInBase: boolean;
};

type PricingData = {
  tiers: ServiceTier[];
  features: Record<string, ServiceAttribute[]>;
  meta: { locale: string; cached: boolean; revalidateSeconds: number };
};

type Props = {
  data: PricingData | null;
  locale: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_KEYS = ["web", "app", "dashboard", "seo"] as const;

const SERVICE_META: Record<string, {
  icon: string;
  label: Record<string, string>;
  labelEn: Record<string, string>;
  color: string;
  heroTitle: Record<string, string>;
  heroTitleEn: Record<string, string>;
}> = {
  web: {
    icon: "🌐",
    color: "#3B82F6",
    label: { vi: "Website", en: "Website", ja: "ウェブサイト", ko: "웹사이트", zh: "网站" },
    labelEn: { vi: "Website", en: "Website", ja: "Website", ko: "Website", zh: "Website" },
    heroTitle: { vi: "Thiết Kế Website Chuyên Nghiệp", en: "Professional Web Design", ja: "プロフェッショナルウェブサイト制作", ko: "전문 웹사이트 제작", zh: "专业网页设计" },
    heroTitleEn: { vi: "Professional Web Design", en: "Professional Web Design", ja: "Professional Web Design", ko: "Professional Web Design", zh: "Professional Web Design" },
  },
  app: {
    icon: "📱",
    color: "#8B5CF6",
    label: { vi: "App / SaaS", en: "App / SaaS", ja: "アプリ/SaaS", ko: "앱/SaaS", zh: "应用/SaaS" },
    labelEn: { vi: "App / SaaS", en: "App / SaaS", ja: "App / SaaS", ko: "App / SaaS", zh: "App / SaaS" },
    heroTitle: { vi: "Ứng Dụng Di Động & SaaS", en: "Mobile App & SaaS Development", ja: "モバイルアプリ&SaaS開発", ko: "모바일 앱 및 SaaS 개발", zh: "移动应用和SaaS开发" },
    heroTitleEn: { vi: "Mobile App & SaaS Development", en: "Mobile App & SaaS Development", ja: "Mobile App & SaaS Development", ko: "Mobile App & SaaS Development", zh: "Mobile App & SaaS Development" },
  },
  dashboard: {
    icon: "📊",
    color: "#EC4899",
    label: { vi: "Dashboard", en: "Dashboard", ja: "ダッシュボード", ko: "대시보드", zh: "仪表盘" },
    labelEn: { vi: "Dashboard", en: "Dashboard", ja: "Dashboard", ko: "Dashboard", zh: "Dashboard" },
    heroTitle: { vi: "Dashboard Quản Lý & Phân Tích", en: "Management Dashboard & Analytics", ja: "管理与分析ダッシュボード", ko: "관리 대시보드 및 분석", zh: "管理仪表盘和分析" },
    heroTitleEn: { vi: "Management Dashboard & Analytics", en: "Management Dashboard & Analytics", ja: "Management Dashboard & Analytics", ko: "Management Dashboard & Analytics", zh: "Management Dashboard & Analytics" },
  },
  seo: {
    icon: "🔍",
    color: "#F59E0B",
    label: { vi: "SEO", en: "SEO", ja: "SEO", ko: "SEO", zh: "SEO" },
    labelEn: { vi: "SEO", en: "SEO", ja: "SEO", ko: "SEO", zh: "SEO" },
    heroTitle: { vi: "Dịch Vụ SEO Chuyên Nghiệp", en: "Professional SEO Services", ja: "プロフェッショナルSEOサービス", ko: "전문 SEO 서비스", zh: "专业SEO服务" },
    heroTitleEn: { vi: "Professional SEO Services", en: "Professional SEO Services", ja: "Professional SEO Services", ko: "Professional SEO Services", zh: "Professional SEO Services" },
  },
};

const TIER_LABELS: Record<number, string> = { 1: "Cơ Bản", 2: "Doanh Nghiệp", 3: "Chuyên Nghiệp" };
const TIER_LABELS_EN: Record<number, string> = { 1: "Basic", 2: "Business", 3: "Experience" };
const TIER_COLORS: Record<string, string> = {
  web: "#3B82F6",
  app: "#8B5CF6",
  dashboard: "#EC4899",
  seo: "#F59E0B",
};

// Fallback static data (when API fails)
const FALLBACK_TIERS: ServiceTier[] = [
  { id: "fb-web-1", serviceKey: "web", level: 1, name: "Cơ Bản", nameEn: "Basic", shortDesc: "Phù hợp khởi nghiệp", basePrice: 3_890_000, marketPrice: 5_500_000, lpReward: 50, sortOrder: 1, isActive: true },
  { id: "fb-web-2", serviceKey: "web", level: 2, name: "Doanh Nghiệp", nameEn: "Business", shortDesc: "Doanh nghiệp vừa và lớn", basePrice: 5_890_000, marketPrice: 8_900_000, lpReward: 80, sortOrder: 2, isActive: true },
  { id: "fb-web-3", serviceKey: "web", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience", shortDesc: "Giải pháp toàn diện", basePrice: 9_890_000, marketPrice: 12_000_000, lpReward: 120, sortOrder: 3, isActive: true },
  { id: "fb-app-1", serviceKey: "app", level: 1, name: "Cơ Bản", nameEn: "Basic", shortDesc: "MVP nhanh chóng", basePrice: 19_980_000, marketPrice: 25_000_000, lpReward: 200, sortOrder: 1, isActive: true },
  { id: "fb-app-2", serviceKey: "app", level: 2, name: "Doanh Nghiệp", nameEn: "Business", shortDesc: "Tính năng đầy đủ", basePrice: 39_800_000, marketPrice: 49_000_000, lpReward: 400, sortOrder: 2, isActive: true },
  { id: "fb-app-3", serviceKey: "app", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience", shortDesc: "SaaS độc quyền, AI, multi-tenant", basePrice: 79_800_000, marketPrice: 99_000_000, lpReward: 800, sortOrder: 3, isActive: true },
  { id: "fb-dashboard-1", serviceKey: "dashboard", level: 1, name: "Cơ Bản", nameEn: "Basic", shortDesc: "Biểu đồ & báo cáo cơ bản", basePrice: 9_900_000, marketPrice: 15_000_000, lpReward: 100, sortOrder: 1, isActive: true },
  { id: "fb-dashboard-2", serviceKey: "dashboard", level: 2, name: "Doanh Nghiệp", nameEn: "Business", shortDesc: "Multi-user, role-based", basePrice: 19_900_000, marketPrice: 29_000_000, lpReward: 200, sortOrder: 2, isActive: true },
  { id: "fb-dashboard-3", serviceKey: "dashboard", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience", shortDesc: "Enterprise, AI analytics, SLA", basePrice: 49_900_000, marketPrice: 69_000_000, lpReward: 500, sortOrder: 3, isActive: true },
  { id: "fb-seo-1", serviceKey: "seo", level: 1, name: "Cơ Bản", nameEn: "Basic", shortDesc: "10 bài chuẩn SEO", basePrice: 2_000_000, marketPrice: 3_000_000, lpReward: 20, sortOrder: 1, isActive: true },
  { id: "fb-seo-2", serviceKey: "seo", level: 2, name: "Doanh Nghiệp", nameEn: "Business", shortDesc: "30 bài/tháng, Google Search Console", basePrice: 6_000_000, marketPrice: 9_000_000, lpReward: 60, sortOrder: 2, isActive: true },
  { id: "fb-seo-3", serviceKey: "seo", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience", shortDesc: "SEO toàn diện: content, link building, AI", basePrice: 36_000_000, marketPrice: 48_000_000, lpReward: 360, sortOrder: 3, isActive: true },
];

// Features comparison data per service (mock — in production comes from API)
const SERVICE_FEATURES: Record<string, Array<{
  label: string;
  labelEn: string;
  basic: string | boolean;
  business: string | boolean;
  experience: string | boolean;
}>> = {
  web: [
    { label: "Số trang", labelEn: "Pages", basic: "5 trang", business: "15 trang", experience: "Không giới hạn" },
    { label: "Bản đồ site (Sitemap)", labelEn: "Sitemap XML", basic: true, business: true, experience: true },
    { label: "Google Analytics", labelEn: "Google Analytics", basic: true, business: true, experience: true },
    { label: "Tối ưu SEO", labelEn: "SEO Optimization", basic: "Cơ bản", business: "Nâng cao", experience: "AI-powered SEO" },
    { label: "SSL miễn phí", labelEn: "Free SSL", basic: true, business: true, experience: true },
    { label: "Responsive", labelEn: "Mobile Responsive", basic: true, business: true, experience: true },
    { label: "Blog / Tin tức", labelEn: "Blog / News", basic: false, business: true, experience: true },
    { label: "Form liên hệ", labelEn: "Contact Forms", basic: "1 form", business: "3 forms", experience: "Không giới hạn" },
    { label: "Tích hợp API", labelEn: "API Integration", basic: false, business: true, experience: true },
    { label: "Tốc độ tải", labelEn: "Page Load Speed", basic: "Trung bình", business: "Nhanh", experience: "≤1.5s" },
    { label: "Bảo hành", labelEn: "Warranty", basic: "1 tháng", business: "3 tháng", experience: "6 tháng" },
    { label: "Hỗ trợ ưu tiên", labelEn: "Priority Support", basic: false, business: "Email", experience: "24/7" },
    { label: "Code nguồn", labelEn: "Source Code", basic: true, business: true, experience: true },
    { label: "Thiết kế độc quyền", labelEn: "Custom Design", basic: "Template", business: "Bán custom", experience: "100% custom" },
    { label: "Multi-language", labelEn: "Multi-language", basic: false, business: "2 ngôn ngữ", experience: "5+ ngôn ngữ" },
  ],
  app: [
    { label: "Platform", labelEn: "Platform", basic: "Web App", business: "Web + Mobile Web", experience: "Web + iOS + Android" },
    { label: "Người dùng", labelEn: "Users", basic: "50 người", business: "500 người", experience: "Không giới hạn" },
    { label: "API endpoints", labelEn: "API Endpoints", basic: "10 endpoints", business: "50 endpoints", experience: "Không giới hạn" },
    { label: "Database", labelEn: "Database", basic: "Shared DB", business: "Dedicated DB", experience: "Distributed DB" },
    { label: "Auth & Roles", labelEn: "Auth & Roles", basic: "Email/Pass", business: "OAuth + Roles", experience: "SSO + MFA + Roles" },
    { label: "Payment gateway", labelEn: "Payment Gateway", basic: false, business: true, experience: true },
    { label: "Analytics dashboard", labelEn: "Analytics Dashboard", basic: false, business: true, experience: true },
    { label: "AI features", labelEn: "AI Features", basic: false, business: false, experience: true },
    { label: "Email marketing", labelEn: "Email Marketing", basic: false, business: true, experience: true },
    { label: "Bảo hành", labelEn: "Warranty", basic: "1 tháng", business: "3 tháng", experience: "6 tháng" },
    { label: "Hosting & Domain", labelEn: "Hosting & Domain", basic: "1 năm", business: "1 năm", experience: "Trọn đời" },
    { label: "Code nguồn", labelEn: "Source Code", basic: true, business: true, experience: true },
  ],
  dashboard: [
    { label: "Biểu đồ & Báo cáo", labelEn: "Charts & Reports", basic: "10 charts", business: "30 charts", experience: "Không giới hạn" },
    { label: "Người dùng", labelEn: "Users", basic: "5 users", business: "50 users", experience: "Không giới hạn" },
    { label: "Xuất dữ liệu", labelEn: "Data Export", basic: "CSV", business: "CSV + PDF + Excel", experience: "CSV + PDF + Excel + API" },
    { label: "Real-time data", labelEn: "Real-time Data", basic: false, business: true, experience: true },
    { label: "Custom KPIs", labelEn: "Custom KPIs", basic: false, business: true, experience: true },
    { label: "Cảnh báo tự động", labelEn: "Auto Alerts", basic: false, business: true, experience: true },
    { label: "AI Analytics", labelEn: "AI Analytics", basic: false, business: false, experience: true },
    { label: "Multi-branch", labelEn: "Multi-branch", basic: false, business: true, experience: true },
    { label: "Mobile app", labelEn: "Mobile App", basic: false, business: false, experience: true },
    { label: "Bảo hành", labelEn: "Warranty", basic: "1 tháng", business: "3 tháng", experience: "6 tháng" },
  ],
  seo: [
    { label: "Bài viết chuẩn SEO", labelEn: "SEO Articles", basic: "10 bài/tháng", business: "30 bài/tháng", experience: "60 bài/tháng" },
    { label: "Từ khóa", labelEn: "Keywords", basic: "5 keywords", business: "15 keywords", experience: "40 keywords" },
    { label: "Backlink", labelEn: "Backlinks", basic: "10 backlinks", business: "50 backlinks", experience: "200 backlinks" },
    { label: "Google Search Console", labelEn: "GSC Integration", basic: false, business: true, experience: true },
    { label: "Google Analytics", labelEn: "GA Integration", basic: false, business: true, experience: true },
    { label: "Local SEO", labelEn: "Local SEO", basic: false, business: true, experience: true },
    { label: "Technical SEO audit", labelEn: "Technical SEO Audit", basic: "1 lần", business: "Hàng quý", experience: "Hàng tháng" },
    { label: "Schema markup", labelEn: "Schema Markup", basic: false, business: true, experience: true },
    { label: "Video SEO", labelEn: "Video SEO", basic: false, business: false, experience: true },
    { label: "Báo cáo", labelEn: "Reports", basic: "Hàng quý", business: "Hàng tháng", experience: "Hàng tuần + realtime" },
    { label: "AI content", labelEn: "AI Content", basic: false, business: false, experience: true },
  ],
};

const FAQ_ITEMS = [
  {
    q: { vi: "Gói Basic và Business khác nhau thế nào?", en: "What is the difference between Basic and Business?" },
    a: { vi: "Gói Basic bao gồm các tính năng cốt lõi để bạn có thể khởi động nhanh với chi phí thấp. Gói Business bổ sung thêm các tính năng nâng cao như SEO toàn diện, analytics, tích hợp API và hỗ trợ ưu tiên.", en: "The Basic plan includes essential features for a quick, low-cost start. The Business plan adds advanced features like comprehensive SEO, analytics, API integrations, and priority support." },
  },
  {
    q: { vi: "Tôi có thể nâng cấp gói sau không?", en: "Can I upgrade my plan later?" },
    a: { vi: "Có! Bạn có thể nâng cấp gói bất kỳ lúc nào. Chúng tôi sẽ tính phí chênh lệch và kích hoạt tính năng mới ngay lập tức. Không cần làm lại từ đầu.", en: "Yes! You can upgrade at any time. We will calculate the price difference and activate new features immediately. No rework required." },
  },
  {
    q: { vi: "Thanh toán như thế nào?", en: "How do I pay?" },
    a: { vi: "Chúng tôi hỗ trợ chuyển khoản ngân hàng, quét mã QR VietQR, thanh toán qua ví điện tử (VNPay, MoMo, ZaloPay). Đặt cọc 50%, thanh toán 50% còn lại khi bàn giao.", en: "We accept bank transfer, VietQR QR scanning, and e-wallets (VNPay, MoMo, ZaloPay). 50% deposit to start, 50% upon handover." },
  },
  {
    q: { vi: "Bảo hành bao lâu?", en: "How long is the warranty?" },
    a: { vi: "Gói Basic: 1 tháng. Gói Business: 3 tháng. Gói Experience: 6 tháng. Tất cả đều bao gồm sửa lỗi miễn phí trong thời gian bảo hành.", en: "Basic: 1 month. Business: 3 months. Experience: 6 months. All include free bug fixes during the warranty period." },
  },
  {
    q: { vi: "Có hỗ trợ sau bảo hành không?", en: "Is there support after warranty?" },
    a: { vi: "Có! Gói Experience bao gồm hỗ trợ 24/7. Tất cả gói đều có thể mua gói bảo trì riêng (hosting, domain, maintenance) với chi phí hợp lý.", en: "Yes! The Experience plan includes 24/7 support. All plans can add a maintenance package (hosting, domain, maintenance) at a reasonable cost." },
  },
];

const TRUST_ITEMS = [
  { icon: "🛡", textVi: "Bảo hành 1–6 tháng", textEn: "1–6 month warranty", color: "#22C55E" },
  { icon: "📱", textVi: "Responsive mọi thiết bị", textEn: "Responsive on all devices", color: "#3B82F6" },
  { icon: "🔒", textVi: "SSL miễn phí trọn đời", textEn: "Free lifetime SSL", color: "#8B5CF6" },
  { icon: "⚡", textVi: "Code sạch, dễ mở rộng", textEn: "Clean code, easy to scale", color: "#62C5EB" },
  { icon: "🎯", textVi: "Giao hàng đúng hạn", textEn: "On-time delivery", color: "#F59E0B" },
  { icon: "💬", textVi: "Hỗ trợ 24/7 (Experience)", textEn: "24/7 support (Experience)", color: "#EC4899" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function getLocaleText(vi: string | null | undefined, en: string | null | undefined, locale: string): string {
  if (!locale || locale === "vi") return (vi ?? "") as string;
  return ((en ?? vi ?? "") as string);
}

// ── Comparison Modal ────────────────────────────────────────────────────────────

function ComparisonModal({
  serviceKey,
  tiers,
  locale,
  color,
  onClose,
}: {
  serviceKey: string;
  tiers: ServiceTier[];
  locale: string;
  color: string;
  onClose: () => void;
}) {
  const features = SERVICE_FEATURES[serviceKey] ?? [];
  const meta = SERVICE_META[serviceKey];
  const isVi = locale === "vi";

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "24px 16px",
          overflowY: "auto",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            background: DS.bg,
            border: `1px solid ${DS.border}`,
            borderRadius: 24,
            width: "100%",
            maxWidth: 960,
            overflow: "hidden",
            boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${color}20`,
            position: "relative",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "24px 28px 20px",
            borderBottom: `1px solid ${DS.border}`,
            background: `linear-gradient(135deg, ${color}12, transparent)`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>
                {meta.icon}
              </div>
              <div>
                <h2 style={{
                  fontFamily: DS.heading, fontSize: 20, fontWeight: 800,
                  color: DS.text,
                }}>
                  {isVi ? "SO SÁNH CHI TIẾT" : "DETAILED COMPARISON"}
                </h2>
                <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                  {meta.heroTitle[locale] ?? meta.heroTitle.vi}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: DS.bgCard, border: `1px solid ${DS.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: DS.text3, transition: "all 0.2s",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tier headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(3, minmax(160px, 1fr))",
            borderBottom: `1px solid ${DS.border}`,
            background: "rgba(15,23,42,0.5)",
          }}>
            {/* Empty top-left corner */}
            <div style={{ padding: "20px 20px" }} />

            {tiers.map((tier, idx) => {
              const tierColor = idx === 1 ? color : DS.text4;
              const tierLabel = isVi ? TIER_LABELS[tier.level] : TIER_LABELS_EN[tier.level];
              const savingPct = tier.marketPrice && tier.marketPrice > tier.basePrice
                ? Math.round((1 - tier.basePrice / tier.marketPrice) * 100)
                : 0;

              return (
                <div
                  key={tier.id}
                  style={{
                    padding: "20px 16px",
                    borderLeft: `1px solid ${DS.border}`,
                    textAlign: "center",
                    background: idx === 1 ? `${tierColor}08` : "transparent",
                  }}
                >
                  <div style={{
                    fontSize: 10, fontFamily: DS.mono,
                    color: tierColor, letterSpacing: "0.15em",
                    marginBottom: 8,
                  }}>
                    {tier.name.toUpperCase()}
                  </div>

                  {tier.marketPrice && tier.marketPrice > tier.basePrice && (
                    <div style={{
                      color: DS.text5, fontSize: 11, fontFamily: DS.mono,
                      textDecoration: "line-through",
                    }}>
                      {fmtVND(tier.marketPrice)}
                    </div>
                  )}

                  <div style={{
                    fontFamily: DS.heading, fontSize: 22, fontWeight: 900,
                    color: tierColor, lineHeight: 1.1,
                  }}>
                    {fmtVND(tier.basePrice)}
                  </div>

                  {savingPct > 0 && (
                    <div style={{
                      marginTop: 6, display: "inline-block",
                      padding: "2px 8px", borderRadius: 9999,
                      background: "rgba(34,197,94,0.12)",
                      color: "#22C55E", fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
                    }}>
                      −{savingPct}%
                    </div>
                  )}

                  <Link
                    href={`/${locale}/thiet-ke-website?service=${serviceKey}&package=${tier.id}`}
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      marginTop: 12, padding: "8px 10px",
                      borderRadius: 10,
                      background: idx === 1
                        ? `linear-gradient(135deg, ${tierColor}, ${color})`
                        : "rgba(255,255,255,0.06)",
                      color: "#fff", fontWeight: 700, fontSize: 12,
                      textDecoration: "none", fontFamily: DS.mono,
                      boxShadow: idx === 1 ? `0 4px 16px ${tierColor}40` : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {isVi ? "Chọn gói" : "Select"}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Feature rows */}
          <div style={{ overflowY: "auto", maxHeight: "calc(90vh - 260px)" }}>
            {features.map((feature, rowIdx) => {
              const values = [feature.basic, feature.business, feature.experience] as Array<string | boolean>;

              return (
                <div
                  key={rowIdx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr repeat(3, minmax(160px, 1fr))",
                    borderBottom: `1px solid ${DS.border}40`,
                    transition: "background 0.15s",
                  }}
                >
                  {/* Feature label */}
                  <div style={{
                    padding: "13px 20px",
                    display: "flex", alignItems: "center",
                    borderRight: `1px solid ${DS.border}40`,
                  }}>
                    <span style={{ color: DS.text3, fontSize: 13, lineHeight: 1.4 }}>
                      {isVi ? feature.label : feature.labelEn}
                    </span>
                  </div>

                  {/* Values per tier */}
                  {values.map((val, colIdx) => {
                    const isHighlighted = colIdx === 1;
                    const valColor = isHighlighted ? color : DS.text4;

                    return (
                      <div
                        key={colIdx}
                        style={{
                          padding: "13px 16px",
                          borderLeft: `1px solid ${DS.border}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isHighlighted ? `${color}06` : "transparent",
                          textAlign: "center",
                        }}
                      >
                        {typeof val === "boolean" ? (
                          val ? (
                            <div style={{
                              width: 24, height: 24, borderRadius: 7,
                              background: isHighlighted ? `${valColor}20` : "rgba(255,255,255,0.06)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Check size={14} color={valColor} strokeWidth={2.5} />
                            </div>
                          ) : (
                            <div style={{
                              width: 24, height: 24, borderRadius: 7,
                              background: "rgba(255,255,255,0.03)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Minus size={14} color={DS.text5} strokeWidth={2} />
                            </div>
                          )
                        ) : (
                          <span style={{
                            color: isHighlighted ? valColor : DS.text3,
                            fontSize: 12, fontFamily: DS.mono,
                            fontWeight: isHighlighted ? 700 : 400,
                            lineHeight: 1.3,
                          }}>
                            {val}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div style={{
            padding: "20px 28px",
            borderTop: `1px solid ${DS.border}`,
            background: "rgba(15,23,42,0.6)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <p style={{ color: DS.text4, fontSize: 12 }}>
              {isVi
                ? "Giá đã bao gồm VAT. Thanh toán linh hoạt 50/50."
                : "Prices include VAT. Flexible 50/50 payment available."}
            </p>
            <Link
              href={`/${locale}/thiet-ke-website?service=${serviceKey}`}
              onClick={onClose}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 12,
                background: GRD.primary, color: "#fff", fontWeight: 700,
                textDecoration: "none", fontSize: 13, fontFamily: DS.mono,
                boxShadow: GLOW.pink,
              }}
            >
              <Zap size={14} />
              {isVi ? "Đặt dịch vụ ngay" : "Book Now"}
              <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Package Card (Enhanced) ────────────────────────────────────────────────────

function PackageCard({
  tier,
  serviceKey,
  locale,
  isPopular,
  onSelect,
  onViewDetail,
}: {
  tier: ServiceTier;
  serviceKey: string;
  locale: string;
  isPopular: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
}) {
  const color = TIER_COLORS[serviceKey] ?? DS.blue;
  const tierLabel = locale === "vi" ? TIER_LABELS[tier.level] : TIER_LABELS_EN[tier.level];
  const name = tier.name || tierLabel;
  const shortDesc = tier.shortDesc ?? "";
  const isVi = locale === "vi";

  const savingPct = tier.marketPrice && tier.marketPrice > tier.basePrice
    ? Math.round((1 - tier.basePrice / tier.marketPrice) * 100)
    : 0;

  return (
    <motion.div
      className="text-left relative overflow-hidden cursor-pointer"
      style={{
        background: isPopular
          ? `linear-gradient(160deg, ${color}10, rgba(15,23,42,0.8))`
          : "rgba(15,23,42,0.7)",
        border: `2px solid ${isPopular ? color + "50" : DS.border}`,
        borderRadius: 20,
        padding: "24px 20px",
        boxShadow: isPopular ? `0 0 40px ${color}12, 0 0 0 1px ${color}20` : "none",
        transition: "all 0.25s",
        position: "relative",
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 30px ${color}25, 0 8px 32px rgba(0,0,0,0.3)`,
        borderColor: isPopular ? `${color}80` : `${DS.border}`,
      }}
    >
      {/* Popular / Selected badge */}
      {isPopular && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "4px 8px", textAlign: "center",
          background: `linear-gradient(90deg, ${color}, ${color}CC)`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          fontSize: 9, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.12em",
        }}>
          <Zap size={9} />
          {isVi ? "PHỔ BIẾN NHẤT" : "MOST POPULAR"}
        </div>
      )}

      <div style={{ marginTop: isPopular ? 18 : 0 }}>
        {/* Tier + Price */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <div style={{
              color: color, fontSize: 10, fontFamily: DS.mono,
              letterSpacing: "0.18em",
            }}>
              {name.toUpperCase()}
            </div>
            {/* View detail button */}
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
              title={isVi ? "Xem chi tiết" : "View details"}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 8px", borderRadius: 8,
                background: `${color}10`,
                border: `1px solid ${color}25`,
                color: color, fontSize: 11, fontFamily: DS.mono,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <Eye size={11} />
              {isVi ? "So sánh" : "Compare"}
            </button>
          </div>

          {tier.marketPrice && tier.marketPrice > tier.basePrice && (
            <div style={{
              color: DS.text5, fontSize: 12, fontFamily: DS.mono,
              textDecoration: "line-through", lineHeight: 1, marginBottom: 4,
            }}>
              {fmtVND(tier.marketPrice)}
            </div>
          )}

          <div style={{
            color: DS.text, fontFamily: DS.heading,
            fontSize: tier.basePrice >= 1_000_000 ? 28 : 32,
            fontWeight: 900, lineHeight: 1.1, marginBottom: 2,
          }}>
            {fmtVND(tier.basePrice)}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {savingPct > 0 && (
              <div
                style={{
                  padding: "2px 8px", borderRadius: 9999,
                  background: "rgba(34,197,94,0.12)",
                  color: "#22C55E", fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
                }}
              >
                −{savingPct}%
              </div>
            )}
            <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
              {isVi ? "Giá từ" : "From"}
            </span>
          </div>

          <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5, marginTop: 8 }}>
            {shortDesc}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/${locale}/thiet-ke-website?service=${serviceKey}&package=${tier.id}`}
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 12,
            background: isPopular ? `linear-gradient(135deg, ${color}, ${color}CC)` : "rgba(255,255,255,0.06)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            textDecoration: "none", fontFamily: DS.mono,
            boxShadow: isPopular ? `0 4px 16px ${color}35` : "none",
            transition: "all 0.2s",
          }}
        >
          {isVi ? "Chọn gói này" : "Select this plan"}
          <ArrowRight size={14} />
        </Link>

        {/* LP reward */}
        <div style={{
          textAlign: "center", marginTop: 10,
          color: DS.purple, fontSize: 11, fontFamily: DS.mono,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <span style={{ fontSize: 12 }}>◈</span>
          +{tier.lpReward.toLocaleString()} LP
        </div>
      </div>
    </motion.div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqItem({ item, locale }: { item: typeof FAQ_ITEMS[0]; locale: string }) {
  const [open, setOpen] = useState(false);
  const q = getLocaleText(item.q.vi, item.q.en, locale);
  const a = getLocaleText(item.a.vi, item.a.en, locale);

  return (
    <div style={{
      background: DS.bgCard, border: `1px solid ${open ? DS.pink + "40" : DS.border}`,
      borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s",
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", padding: "16px 18px", background: "none", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, textAlign: "left",
        }}
      >
        <span style={{ color: DS.text, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: DS.text4, flexShrink: 0 }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 18px 16px",
              color: DS.text3, fontSize: 13, lineHeight: 1.7,
              borderTop: `1px solid ${DS.border}`,
              paddingTop: 12,
            }}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Trust Strip ───────────────────────────────────────────────────────────────

function TrustStrip({ locale }: { locale: string }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 12,
    }}>
      {TRUST_ITEMS.map(item => (
        <div
          key={item.textVi}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: `${item.color}06`,
            border: `1px solid ${item.color}18`,
            borderRadius: 12,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${item.color}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>
            {item.icon}
          </div>
          <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.4 }}>
            {locale === "vi" ? item.textVi : item.textEn}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DichVuClient({ data, locale }: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeService, setActiveService] = useState<string>("web");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isVi = locale === "vi";

  // Derive tiers from API or fallback
  const allTiers: ServiceTier[] = data?.tiers ?? FALLBACK_TIERS;

  // Group by serviceKey
  const tiersByService = useMemo(() => {
    const map: Record<string, ServiceTier[]> = {};
    for (const key of SERVICE_KEYS) {
      map[key] = allTiers
        .filter(t => t.serviceKey === key && t.isActive)
        .sort((a, b) => a.level - b.level);
    }
    return map;
  }, [allTiers]);

  const serviceTiers = tiersByService[activeService] ?? [];
  const meta = SERVICE_META[activeService];
  const color = TIER_COLORS[activeService] ?? DS.blue;

  // Find the "popular" tier (level 2)
  const popularTierId = serviceTiers.find(t => t.level === 2)?.id;

  const handleViewComparison = useCallback((tierId: string) => {
    setSelectedTier(tierId);
    setShowComparison(true);
  }, []);

  const handleCloseComparison = useCallback(() => {
    setShowComparison(false);
    setSelectedTier(null);
  }, []);

  if (!mounted) return <main style={{ background: DS.bg, minHeight: "100vh" }} />;

  return (
    <main style={{ background: DS.bg, minHeight: "100vh", fontFamily: DS.body }}>
      {/* ── Hero ── */}
      <section style={{
        background: `radial-gradient(circle at 50% -20%, ${color}15, transparent 70%), ${DS.bg}`,
        padding: "80px 0 60px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Animated background blobs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ position: "absolute", top: "-10%", left: "20%", width: "40%", height: "40%", background: `${color}10`, filter: "blur(80px)", borderRadius: "50%", zIndex: 0 }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          style={{ position: "absolute", top: "10%", right: "10%", width: "35%", height: "35%", background: `${DS.pink}08`, filter: "blur(100px)", borderRadius: "50%", zIndex: 0 }}
        />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${DS.border}`,
              backdropFilter: "blur(10px)"
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.pink, boxShadow: GLOW.pink }} />
            <span style={{ color: DS.text2, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.25em", fontWeight: 700 }}>
              {isVi ? "BẢNG GIÁ NIÊM YẾT 2026" : "OFFICIAL PRICING 2026"}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            style={{
              fontFamily: DS.heading, fontSize: 52, fontWeight: 900, letterSpacing: "-0.02em",
              background: `linear-gradient(180deg, ${DS.text} 0%, ${rgba(DS.text, 0.6)} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 18, lineHeight: 1.1,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {isVi ? "Giải Pháp Số Toàn Diện" : "Comprehensive Digital Solutions"}
          </motion.h1>

          <motion.p
            style={{ color: DS.text3, fontSize: 16, lineHeight: 1.6, maxWidth: 600, margin: "0 auto 40px", opacity: 0.8 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isVi
              ? "Tối ưu hóa quy trình kinh doanh và hiện diện thương hiệu với hệ sinh thái công nghệ Loop Solutions."
              : "Optimize business processes and brand presence with the Loop Solutions technology ecosystem."}
          </motion.p>

          {/* Service Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "inline-flex", gap: 4, padding: 6,
              background: rgba(DS.bgCosmic, 0.4),
              backdropFilter: "blur(20px)",
              borderRadius: 20, border: `1px solid ${rgba(DS.text, 0.08)}`,
              boxShadow: `0 10px 40px ${rgba(DS.text, 0.08)}`,
            }}
          >
            {SERVICE_KEYS.map(key => {
              const svc = SERVICE_META[key];
              const isActive = activeService === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveService(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 16,
                    background: isActive ? `${svc.color}20` : "transparent",
                    border: isActive ? `1px solid ${svc.color}40` : "1px solid transparent",
                    color: isActive ? "#fff" : DS.text4,
                    cursor: "pointer", fontSize: 14, fontWeight: isActive ? 700 : 500,
                    fontFamily: DS.heading, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isActive ? `0 0 20px ${svc.color}20` : "none",
                  }}
                >
                  <span style={{ fontSize: 18, filter: isActive ? "grayscale(0)" : "grayscale(1)" }}>{svc.icon}</span>
                  <span>{svc.label[locale] ?? svc.label.vi}</span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Package Cards ── */}
      <section style={{ padding: "60px 0 100px", background: `linear-gradient(180deg, ${DS.bg} 0%, ${DS.bgCosmic} 100%)` }}>
        <div className="max-w-6xl mx-auto px-6">
          {/* Service headline */}
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <motion.div
              key={activeService + "-headline"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: `${color}15`, border: `1px solid ${color}30`,
                borderRadius: 9999, padding: "6px 16px", marginBottom: 12,
                boxShadow: `0 0 20px ${color}10`,
              }}
            >
              <span style={{ fontSize: 20 }}>{meta.icon}</span>
              <span style={{ color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700, letterSpacing: "0.05em" }}>
                {meta.heroTitle[locale] ?? meta.heroTitle.vi}
              </span>
            </motion.div>
            <h2 style={{
              color: DS.text, fontSize: 32, fontFamily: DS.heading, fontWeight: 800,
              letterSpacing: "-0.01em", marginBottom: 12
            }}>
              {isVi ? "Bảng giá so sánh chi tiết" : "Detailed Price Comparison"}
            </h2>
            <p style={{ color: DS.text4, fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
              {isVi ? "Lựa chọn gói dịch vụ tối ưu nhất cho quy mô và mục tiêu của doanh nghiệp bạn." : "Select the optimal service package for your business scale and goals."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeService}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {serviceTiers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "6rem", color: DS.text4 }}>
                  <Zap className="animate-spin mx-auto mb-4" size={40} style={{ color }} />
                  {isVi ? "Đang chuẩn bị dữ liệu..." : "Preparing data..."}
                </div>
              ) : (
                <div style={{
                  background: rgba(DS.bgCosmic, 0.3),
                  backdropFilter: "blur(30px)",
                  border: `1px solid ${DS.border}`,
                  borderRadius: 32,
                  overflow: "hidden",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}>
                  {/* Dynamic Table Header based on tier count */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: `1.4fr repeat(${serviceTiers.length}, 1fr)`,
                    borderBottom: `2px solid ${DS.border}`,
                    background: rgba(DS.bgCosmic, 0.6),
                  }}>
                    <div style={{
                      padding: "32px 24px",
                      display: "flex", alignItems: "flex-end",
                      borderRight: `1px solid ${DS.border}50`,
                    }}>
                      <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", fontWeight: 700 }}>
                        {isVi ? "TÍNH NĂNG DỊCH VỤ" : "SERVICE FEATURES"}
                      </div>
                    </div>

                    {serviceTiers.map((tier, idx) => {
                      const isPopular = tier.id === popularTierId;
                      const tierColor = idx === 0 ? DS.text4 : idx === 1 ? color : DS.pink;
                      const isExperience = tier.level === 3;

                      return (
                        <div
                          key={tier.id}
                          style={{
                            padding: "32px 16px",
                            borderLeft: idx === 0 ? "none" : `1px solid ${DS.border}50`,
                            background: isPopular ? `${color}08` : isExperience ? `${DS.pink}05` : "transparent",
                            textAlign: "center",
                            position: "relative",
                            transition: "all 0.3s",
                          }}
                        >
                          {isPopular && (
                            <div style={{
                              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                              padding: "4px 12px", borderRadius: 99,
                              background: GRD.primary,
                              fontSize: 9, color: "#fff", fontFamily: DS.mono,
                              fontWeight: 800, display: "flex", alignItems: "center", gap: 4,
                              boxShadow: GLOW.pink,
                            }}>
                              <Zap size={10} fill="currentColor" />
                              {isVi ? "PHỔ BIẾN" : "POPULAR"}
                            </div>
                          )}

                          <div style={{ marginTop: isPopular ? 12 : 0 }}>
                            <h3 style={{
                              fontSize: 12, fontFamily: DS.mono,
                              color: tierColor, letterSpacing: "0.1em", marginBottom: 10,
                              fontWeight: 800,
                            }}>
                              {tier.name.toUpperCase()}
                            </h3>

                            <div style={{ height: 20 }}>
                              {tier.marketPrice && tier.marketPrice > tier.basePrice && (
                                <span style={{
                                  color: DS.text5, fontSize: 12, fontFamily: DS.mono,
                                  textDecoration: "line-through",
                                }}>
                                  {fmtVND(tier.marketPrice)}
                                </span>
                              )}
                            </div>

                            <div style={{
                              fontFamily: DS.heading,
                              fontSize: 32,
                              fontWeight: 900,
                              color: DS.text,
                              lineHeight: 1,
                              margin: "4px 0",
                              background: isExperience ? GRD.primary : "none",
                              WebkitBackgroundClip: isExperience ? "text" : "initial",
                              WebkitTextFillColor: isExperience ? "transparent" : "initial",
                            }}>
                              {fmtVND(tier.basePrice)}
                            </div>

                            <div style={{
                              marginBottom: 20, color: DS.text5, fontSize: 11,
                              fontFamily: DS.body, fontWeight: 500, fontStyle: "italic"
                            }}>
                              {tier.shortDesc}
                            </div>

                            <Link
                              href={`/${locale}/thiet-ke-website?service=${activeService}&package=${tier.id}`}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: "12px 16px",
                                borderRadius: 14,
                                background: isPopular ? color : isExperience ? GRD.primary : "rgba(255,255,255,0.06)",
                                color: "#fff", fontWeight: 800, fontSize: 13,
                                textDecoration: "none", fontFamily: DS.heading,
                                boxShadow: isPopular ? `0 8px 24px ${color}30` : isExperience ? GLOW.pink : "none",
                                transition: "all 0.3s ease",
                              }}
                            >
                              {isVi ? "Đăng ký" : "Register"}
                              <ArrowRight size={14} strokeWidth={3} />
                            </Link>

                            <div style={{
                              marginTop: 12, color: DS.purple, fontSize: 11,
                              fontFamily: DS.mono, fontWeight: 700,
                              background: "rgba(167,139,250,0.08)",
                              padding: "4px 8px", borderRadius: 8,
                              display: "inline-flex", alignItems: "center", gap: 4
                            }}>
                              <Zap size={11} fill="currentColor" />
                              +{tier.lpReward.toLocaleString()} LP REWARD
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feature Rows */}
                  <div style={{ maxHeight: 600, overflowY: "auto" }}>
                    {(SERVICE_FEATURES[activeService] ?? []).map((feature, rowIdx) => {
                      return (
                        <motion.div
                          key={rowIdx}
                          whileHover={{ background: "rgba(255,255,255,0.03)" }}
                          style={{
                            display: "grid",
                            gridTemplateColumns: `1.4fr repeat(${serviceTiers.length}, 1fr)`,
                            borderBottom: `1px solid ${DS.border}30`,
                            transition: "background 0.2s",
                          }}
                        >
                          <div style={{
                            padding: "16px 24px",
                            borderRight: `1px solid ${DS.border}30`,
                            display: "flex", alignItems: "center",
                          }}>
                            <span style={{ color: DS.text3, fontSize: 14, fontWeight: 500 }}>
                              {isVi ? feature.label : feature.labelEn}
                            </span>
                          </div>

                          {serviceTiers.map((tier, colIdx) => {
                            // Map feature value based on tier level
                            let val: string | boolean = false;
                            if (tier.level === 1) val = feature.basic;
                            else if (tier.level === 2) val = feature.business;
                            else if (tier.level === 3) val = feature.experience;
                            else val = isVi ? "Tùy chỉnh" : "Custom"; // Fallback for level 4+ (Theo yêu cầu)

                            const isSpecial = tier.level >= 2;
                            const tierColor = tier.level === 1 ? DS.text4 : tier.level === 2 ? color : DS.pink;

                            return (
                              <div
                                key={tier.id}
                                style={{
                                  padding: "16px 12px",
                                  borderLeft: `1px solid ${DS.border}30`,
                                  background: tier.level === 2 ? `${color}04` : tier.level === 3 ? `${DS.pink}04` : "transparent",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  textAlign: "center",
                                }}
                              >
                                {typeof val === "boolean" ? (
                                  val ? (
                                    <div style={{
                                      width: 24, height: 24, borderRadius: 8,
                                      background: `${tierColor}20`,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                      <Check size={14} color={tierColor} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <Minus size={14} color={DS.text5} strokeWidth={2} />
                                  )
                                ) : (
                                  <span style={{
                                    color: isSpecial ? DS.text : DS.text3,
                                    fontSize: 13, fontFamily: DS.mono,
                                    fontWeight: isSpecial ? 700 : 500,
                                  }}>
                                    {val}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Footer Action Strip */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: `1.4fr repeat(${serviceTiers.length}, 1fr)`,
                    background: rgba(DS.bgCosmic, 0.8),
                    borderTop: `1px solid ${DS.border}`,
                  }}>
                    <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Link
                        href={`/${locale}/contact`}
                        className="group"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          color: DS.text4, fontSize: 13, fontWeight: 600,
                          textDecoration: "none", transition: "color 0.2s"
                        }}
                      >
                        {isVi ? "Cần giải pháp tùy chỉnh?" : "Need custom solution?"}
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                    {serviceTiers.map((tier, idx) => (
                      <div key={tier.id} style={{ padding: "24px 12px", textAlign: "center", borderLeft: `1px solid ${DS.border}30` }}>
                        <Link
                          href={`/${locale}/thiet-ke-website?service=${activeService}&package=${tier.id}`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "10px 20px", borderRadius: 12,
                            background: idx === 0 ? "transparent" : idx === 1 ? color : GRD.primary,
                            border: idx === 0 ? `1px solid ${DS.border}` : "none",
                            color: "#fff", fontWeight: 700, fontSize: 13,
                            textDecoration: "none",
                            boxShadow: idx === 1 ? `0 4px 12px ${color}30` : idx === 2 ? GLOW.pink : "none"
                          }}
                        >
                          {isVi ? "Bắt đầu" : "Get Started"}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section style={{ padding: "0 0 60px" }}>
        <div className="max-w-5xl mx-auto px-6">
          <TrustStrip locale={locale} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{
        padding: "0 0 80px",
        borderTop: `1px solid ${DS.border}`,
      }}>
        <div className="max-w-3xl mx-auto px-6">
          <div style={{ textAlign: "center", marginBottom: 28, marginTop: 48 }}>
            <h2 style={{
              fontFamily: DS.heading, fontSize: 26, fontWeight: 800,
              background: GRD.heroText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}>
              {isVi ? "Câu Hỏi Thường Gặp" : "Frequently Asked Questions"}
            </h2>
            <p style={{ color: DS.text4, fontSize: 13 }}>
              {isVi
                ? "Trả lời nhanh những thắc mắc phổ biến nhất"
                : "Quick answers to the most common questions"}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} item={item} locale={locale} />
            ))}
          </div>

          {/* CTA after FAQ */}
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <p style={{ color: DS.text4, fontSize: 13, marginBottom: 16 }}>
              {isVi
                ? "Không tìm thấy câu trả lời bạn cần?"
                : "Didn't find the answer you're looking for?"}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href={`/${locale}/contact`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 24px", borderRadius: 12,
                  background: GRD.primary, color: "#fff", fontWeight: 700,
                  textDecoration: "none", fontSize: 14, fontFamily: DS.mono,
                  boxShadow: GLOW.pink,
                }}
              >
                {isVi ? "Liên hệ tư vấn miễn phí" : "Get free consultation"}
                <ArrowRight size={14} />
              </Link>
              <Link
                href={`/${locale}/thiet-ke-website`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 24px", borderRadius: 12,
                  background: DS.bgCard, color: DS.text3,
                  border: `1px solid ${DS.border}`,
                  textDecoration: "none", fontSize: 14, fontFamily: DS.mono,
                }}
              >
                {isVi ? "Đặt dịch vụ ngay" : "Book a service now"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Modal ── */}
      <AnimatePresence>
        {showComparison && (
          <ComparisonModal
            serviceKey={activeService}
            tiers={serviceTiers}
            locale={locale}
            color={color}
            onClose={handleCloseComparison}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
