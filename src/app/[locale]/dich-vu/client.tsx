"use client";

/**
 * DichVuClient — Bảng Giá Dịch Vụ tất cả 4 dịch vụ × 3 cấp
 * /dich-vu
 * Fetches from /api/services/pricing (server component passes data).
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { ArrowRight, ChevronDown } from "lucide-react";

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

// ── Package Card ────────────────────────────────────────────────────────────────

function PackageCard({
  tier,
  serviceKey,
  locale,
  isPopular,
  onSelect,
}: {
  tier: ServiceTier;
  serviceKey: string;
  locale: string;
  isPopular: boolean;
  onSelect: () => void;
}) {
  const color = TIER_COLORS[serviceKey] ?? DS.blue;
  const tierLabel = locale === "vi" ? TIER_LABELS[tier.level] : TIER_LABELS_EN[tier.level];
  const name = tier.name || tierLabel;
  const shortDesc = tier.shortDesc ?? "";

  const savingPct = tier.marketPrice && tier.marketPrice > tier.basePrice
    ? Math.round((1 - tier.basePrice / tier.marketPrice) * 100)
    : 0;

  return (
    <motion.div
      onClick={onSelect}
      className="text-left relative overflow-hidden cursor-pointer"
      style={{
        background: isPopular ? `${color}0C` : "rgba(15,23,42,0.7)",
        border: `2px solid ${isPopular ? color + "50" : DS.border}`,
        borderRadius: 20,
        padding: "24px 20px",
        boxShadow: isPopular ? `0 0 30px ${color}15` : "none",
        transition: "all 0.2s",
      }}
      whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${color}20` }}
    >
      {/* Popular / Selected badge */}
      {isPopular && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "4px", textAlign: "center",
          background: GRD.primary,
          fontSize: 9, color: "#fff", fontFamily: DS.mono, letterSpacing: "0.1em",
        }}>
          ★ {locale === "vi" ? "PHỔ BIẾN NHẤT" : "MOST POPULAR"}
        </div>
      )}

      <div style={{ marginTop: isPopular ? 18 : 0 }}>
        {/* Tier + Price */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            color: color, fontSize: 10, fontFamily: DS.mono,
            letterSpacing: "0.18em", marginBottom: 6,
          }}>
            {name.toUpperCase()}
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

          {savingPct > 0 && (
            <div
              className="inline-block mb-3 px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", fontFamily: DS.mono }}
            >
              −{savingPct}%
            </div>
          )}

          <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
            {shortDesc}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/${locale}/booking?service=${serviceKey}&package=${tier.id}`}
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px", borderRadius: 12,
            background: isPopular ? GRD.primary : "rgba(255,255,255,0.06)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            textDecoration: "none", fontFamily: DS.mono,
            boxShadow: isPopular ? "0 4px 16px rgba(236,72,153,0.35)" : "none",
            transition: "all 0.2s",
          }}
        >
          {locale === "vi" ? "Chọn gói này" : "Select this plan"}
          <ArrowRight size={14} />
        </Link>

        {/* LP reward */}
        <div style={{
          textAlign: "center", marginTop: 10,
          color: DS.purple, fontSize: 11, fontFamily: DS.mono,
        }}>
          ◈ +{tier.lpReward.toLocaleString()} LP
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
  const [activeService, setActiveService] = useState<string>("web");

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

  return (
    <main style={{ background: DS.bg, minHeight: "100vh", fontFamily: DS.body }}>
      {/* ── Hero ── */}
      <section style={{
        background: GRD.hero,
        padding: "48px 0 32px",
        borderBottom: `1px solid ${DS.border}`,
      }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.25)" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>
              {locale === "vi" ? "BẢNG GIÁ 2026" : "PRICING 2026"}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            style={{
              fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: "0.03em",
              background: GRD.heroText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 14, lineHeight: 1.2,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {locale === "vi"
              ? "Giải Pháp Số Toàn Diện"
              : "Comprehensive Digital Solutions"}
          </motion.h1>

          <motion.p
            style={{ color: DS.text3, fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 28px" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {locale === "vi"
              ? "Website · App/SaaS · Dashboard · SEO — Basic đến Experience. Miễn phí SSL, bảo hành, bàn giao code nguồn."
              : "Website · App/SaaS · Dashboard · SEO — Basic to Experience. Free SSL, warranty, full source code handover."}
          </motion.p>

          {/* Service Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "inline-flex", gap: 6, padding: 6,
              background: "rgba(15,23,42,0.9)",
              borderRadius: 16, border: `1px solid ${DS.border}`,
            }}
          >
            {SERVICE_KEYS.map(key => {
              const svc = SERVICE_META[key];
              const isActive = activeService === key;
              const count = tiersByService[key]?.length ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveService(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 12,
                    background: isActive ? `${svc.color}18` : "transparent",
                    border: isActive ? `1px solid ${svc.color}40` : "1px solid transparent",
                    color: isActive ? svc.color : DS.text4,
                    cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 400,
                    fontFamily: DS.body, transition: "all 0.2s",
                  }}
                >
                  <span>{svc.icon}</span>
                  <span>{svc.label[locale] ?? svc.label.vi}</span>
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontFamily: DS.mono,
                      background: isActive ? `${svc.color}20` : DS.bg,
                      color: isActive ? svc.color : DS.text5,
                      padding: "1px 5px", borderRadius: 9999,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Package Cards ── */}
      <section style={{ padding: "36px 0 48px" }}>
        <div className="max-w-5xl mx-auto px-6">
          {/* Service headline */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: `${color}10`, border: `1px solid ${color}25`,
              borderRadius: 9999, padding: "4px 12px", marginBottom: 8,
            }}>
              <span>{meta.icon}</span>
              <span style={{ color, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>
                {meta.heroTitle[locale] ?? meta.heroTitle.vi}
              </span>
            </div>
            <h2 style={{
              color: DS.text2, fontSize: 14, fontFamily: DS.mono,
              letterSpacing: "0.05em",
            }}>
              {locale === "vi" ? "CHỌN GÓI PHÙ HỢP VỚI BẠN" : "CHOOSE THE RIGHT PLAN FOR YOU"}
            </h2>
          </div>

          {/* 3 tier cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeService}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {serviceTiers.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: DS.text4 }}>
                  {locale === "vi" ? "Đang cập nhật bảng giá..." : "Updating pricing..."}
                </div>
              ) : (
                serviceTiers.map(tier => (
                  <PackageCard
                    key={tier.id}
                    tier={tier}
                    serviceKey={activeService}
                    locale={locale}
                    isPopular={tier.id === popularTierId}
                    onSelect={() => {}}
                  />
                ))
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
              {locale === "vi" ? "Câu Hỏi Thường Gặp" : "Frequently Asked Questions"}
            </h2>
            <p style={{ color: DS.text4, fontSize: 13 }}>
              {locale === "vi"
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
              {locale === "vi"
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
                {locale === "vi" ? "Liên hệ tư vấn miễn phí" : "Get free consultation"}
                <ArrowRight size={14} />
              </Link>
              <Link
                href={`/${locale}/booking`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 24px", borderRadius: 12,
                  background: DS.bgCard, color: DS.text3,
                  border: `1px solid ${DS.border}`,
                  textDecoration: "none", fontSize: 14, fontFamily: DS.mono,
                }}
              >
                {locale === "vi" ? "Đặt dịch vụ ngay" : "Book a service now"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
