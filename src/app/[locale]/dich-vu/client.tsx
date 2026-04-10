"use client";

/**
 * DichVuClient — Standalone pricing page at /dich-vu
 * Khách xem bảng giá + tích chọn tính năng mà không cần đặt lịch.
 * Fetches pricing config from /api/pricing/config — falls back to static data.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { FeatureToggleTable, type WizardFeature } from "@/components/landing/FeatureToggleTable";
import { Check, ArrowRight } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Local package shape (not the API type — simpler) ──────────────────────────

interface Package {
  id: string;
  slug?: string;
  name: string;
  price: number;
  marketPrice?: number;
  savingPct?: number;
  features: string[];   // feature NAME strings from DB
  lp: number;
  popular?: boolean;
  color: string;
  desc: string;
}

// ── Fallback: Static data (shown when API fails) ────────────────────────────

const FALLBACK_PACKAGES: Package[] = [
  {
    id: "basic", slug: "basic", name: "Cơ bản",
    price: 3_890_000, marketPrice: 5_500_000, savingPct: 29,
    features: ["Giao diện chuẩn responsive", "Tối đa 5 trang", "SEO cơ bản", "Bảo hành 1 tháng", "Hỗ trợ qua email"],
    lp: 100, color: DS.text3,
    desc: "Thiết kế chuẩn responsive, phù hợp website giới thiệu doanh nghiệp nhỏ",
  },
  {
    id: "business", slug: "business", name: "Doanh nghiệp",
    price: 5_890_000, marketPrice: 8_900_000, savingPct: 34,
    features: ["Thiết kế tùy chỉnh theo brand", "Tối đa 15 trang", "SEO nâng cao", "Animation & Mega Menu", "Bảo hành 3 tháng", "Không giới hạn chỉnh sửa"],
    lp: 180, popular: true, color: DS.blue,
    desc: "Thiết kế tùy chỉnh theo thương hiệu, tối ưu UX, doanh nghiệp vừa và lớn",
  },
  {
    id: "experience", slug: "experience", name: "Experience",
    price: 6_890_000, marketPrice: 12_000_000, savingPct: 43,
    features: ["Giao diện độc quyền NextJS", "Không giới hạn trang", "SEO toàn diện", "Dedicated PM riêng", "Bảo hành 6 tháng", "Support 24/7"],
    lp: 280, color: DS.purple,
    desc: "Giao diện độc quyền NextJS, tối ưu tốc độ cao, thương hiệu cao cấp",
  },
];

const FALLBACK_FEATURES: WizardFeature[] = [
  {
    id: "cms", label: "Tích hợp CMS", price: 5_000_000,
    category: "Nâng cao", tier: "add-on",
    description: "CMS (Hệ thống Quản trị Nội dung) cho phép bạn tự thêm/sửa/xóa nội dung website mà không cần biết code. Bạn có thể tự viết bài, thay hình ảnh, cập nhật giá sản phẩm — tất cả chỉ cần vài click chuột. Không cần thuê dev mỗi khi cần chỉnh sửa nhỏ.",
    benefit: "Tự quản lý website không cần biết code",
  },
  {
    id: "i18n", label: "Đa ngôn ngữ (i18n)", price: 3_000_000,
    category: "Nâng cao", tier: "add-on",
    description: "Website hiển thị đồng thời nhiều ngôn ngữ (Tiếng Việt, Tiếng Anh, Nhật, Hàn...). Khách hàng nước ngoài có thể đọc website bằng ngôn ngữ của họ. Người dùng tự chuyển ngôn ngữ bằng nút trên giao diện.",
    benefit: "Tiếp cận khách hàng quốc tế",
  },
  {
    id: "ecom", label: "E-commerce (Giỏ hàng & Thanh toán)", price: 12_000_000,
    category: "Nâng cao", tier: "add-on",
    description: "Biến website thành cửa hàng online — khách có thể xem sản phẩm, cho vào giỏ, thanh toán trực tiếp bằng VNPay, MoMo, ZaloPay hoặc chuyển khoản. Tích hợp quản lý đơn hàng, kho hàng, mã giảm giá. Phù hợp bán hàng online, boutique, shop nhỏ.",
    benefit: "Bán hàng online ngay trên website",
  },
  {
    id: "blog", label: "Blog & Content Module", price: 2_500_000,
    category: "Nội dung", tier: "add-on",
    description: "Trang tin tức riêng biệt trên website — bạn có thể viết bài chia sẻ, tin khuyến mãi, hướng dẫn sản phẩm. Mỗi bài viết đều được tối ưu SEO để khách hàng tìm thấy bạn trên Google. Không cần biết code để viết và đăng bài.",
    benefit: "Chia sẻ nội dung, thu hút khách tìm kiếm Google",
  },
  {
    id: "analytics", label: "Analytics Dashboard", price: 4_000_000,
    category: "Analytics", tier: "add-on",
    description: "Bảng điều khiển thống kê riêng — xem lượt truy cập, khách đến từ đâu, trang nào được xem nhiều nhất, khách ở lại bao lâu. Dữ liệu cập nhật real-time, giúp bạn hiểu hành vi khách hàng và đưa ra quyết định kinh doanh tốt hơn.",
    benefit: "Hiểu khách hàng qua dữ liệu thực tế",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export function DichVuClient({
  config,
  locale,
}: {
  config: import("@/lib/types/booking").PricingConfig | null;
  locale: string;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Derive data — use API config, fallback to static
  const packages: Package[] = config
    ? config.packages.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price ?? 0,
        marketPrice: p.marketPrice,
        savingPct: p.savingPct,
        features: p.features ?? [],
        lp: config.packageLps?.[p.id] ?? 50,
        popular: p.popular,
        color: p.color ?? DS.blue,
        desc: p.desc ?? "",
      }))
    : FALLBACK_PACKAGES;

  const allFeatures: WizardFeature[] = config ? config.features : FALLBACK_FEATURES;

  // Find selected package
  const selectedPkg = packages.find(p => p.id === selectedPkgId);
  const selectedPkgIdx = packages.findIndex(p => p.id === selectedPkgId);

  // Compute included feature IDs:
  // pkg.features = NAME strings → match against allFeatures[i].label → get IDs
  const includedFeatureIds: string[] = useMemo(() => {
    if (selectedPkgIdx < 0 || !selectedPkg) return [];
    // Cascade: all features from Basic + Business up to selected
    const pkgNames = new Set<string>();
    for (let i = 0; i <= selectedPkgIdx; i++) {
      packages[i]!.features.forEach(name => pkgNames.add(name));
    }
    // Match names → IDs from allFeatures
    return allFeatures
      .filter(f => pkgNames.has(f.label))
      .map(f => f.id);
  }, [selectedPkgIdx, packages, allFeatures]);

  // Compute prices
  const basePrice = selectedPkg?.price ?? 0;
  const extraFeatureTotal = allFeatures
    .filter(f => selectedFeatures.includes(f.id) && !includedFeatureIds.includes(f.id))
    .reduce((s, f) => s + f.price, 0);
  const subtotal = basePrice + extraFeatureTotal;

  const handleToggle = (featureId: string) => {
    // Cannot deselect features included in the base package
    if (includedFeatureIds.includes(featureId)) return;
    setSelectedFeatures(prev =>
      prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]
    );
  };

  // When switching packages, reset selectedFeatures (keep only non-included ones)
  const handleSelectPackage = (pkgId: string) => {
    setSelectedFeatures(prev =>
      prev.filter(id => !includedFeatureIds.includes(id))
    );
    setSelectedPkgId(pkgId);
  };

  const pkgColor = selectedPkg?.color ?? DS.blue;
  const pkgBorderColor = `${pkgColor}30`;
  const pkgBgColor = `${pkgColor}0C`;

  return (
    <main style={{ background: DS.bg, minHeight: "100vh", fontFamily: DS.body }}>
      {/* ── Hero ── */}
      <section style={{ background: GRD.hero, padding: "40px 0 0" }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.25)" }}
          >
            <span style={{ color: DS.pink, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.22em" }}>
              BẢNG GIÁ WEBSITE
            </span>
          </div>
          <h1 style={{
            fontFamily: DS.heading, fontSize: 36, fontWeight: 900, letterSpacing: "0.04em",
            background: GRD.heroText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 12,
          }}>
            Chọn gói Website phù hợp với bạn
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 20px" }}>
            Mỗi gói bao gồm đầy đủ tính năng cơ bản. Thêm tính năng bạn cần —
            tất cả đều có giải thích dễ hiểu. Không phí ẩn.
          </p>
        </div>
      </section>

      {/* ── Main content ── */}
      <section style={{ padding: "32px 0 80px" }}>
        <div className="max-w-5xl mx-auto px-6">

          {/* ── Price summary bar ── */}
          <div
            className="rounded-2xl mb-8 p-5 relative overflow-hidden"
            style={{
              background: "rgba(10,15,30,0.92)",
              border: `1px solid ${pkgColor}30`,
              boxShadow: `0 0 40px ${pkgColor}10`,
            }}
          >
            <div
              style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: `radial-gradient(circle, ${pkgColor}12 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Left: package info */}
              <div>
                <div style={{ color: pkgColor, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 4 }}>
                  {selectedPkg ? "GÓI ĐÃ CHỌN" : "CHỌN GÓI WEBSITE"}
                </div>
                {selectedPkg ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ color: DS.text, fontFamily: DS.heading, fontSize: 30, fontWeight: 900 }}>
                      {fmtVND(subtotal)}
                    </span>
                    <span style={{ color: pkgColor, fontSize: 13, fontFamily: DS.mono }}>
                      {selectedPkg.name}
                    </span>
                    {selectedPkg.savingPct && selectedPkg.savingPct > 0 && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: "rgba(34,197,94,0.12)",
                          color: DS.green,
                          fontFamily: DS.mono,
                        }}
                      >
                        −{selectedPkg.savingPct}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ color: DS.text4, fontSize: 15 }}>
                    Chọn gói bên dưới để xem báo giá
                  </div>
                )}
              </div>

              {/* Right: breakdown chips */}
              {selectedPkg && (
                <div className="flex flex-wrap gap-2">
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-mono"
                    style={{ background: `${pkgColor}10`, color: pkgColor, border: `1px solid ${pkgColor}25` }}
                  >
                    Gói: {fmtVND(basePrice)}
                  </div>
                  {extraFeatureTotal > 0 && (
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-mono"
                      style={{ background: `${DS.blue}10`, color: DS.blue, border: `1px solid ${DS.blue}25` }}
                    >
                      +Tính năng: {fmtVND(extraFeatureTotal)}
                    </div>
                  )}
                  <div
                    className="px-3 py-1.5 rounded-xl text-xs font-mono"
                    style={{ background: `${DS.purple}10`, color: DS.purple, border: `1px solid ${DS.purple}25` }}
                  >
                    ◈ +{selectedPkg.lp.toLocaleString()} LP
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Package cards ── */}
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: 3, height: 16, background: DS.pink, borderRadius: 2 }} />
            <h2 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.14em" }}>
              CHỌN GÓI WEBSITE
            </h2>
            <div style={{ flex: 1, height: 1, background: DS.border }} />
          </div>

          <div
            className="grid gap-4 mb-10"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
          >
            {packages.map(pkg => {
              const isSelected = selectedPkgId === pkg.id || pkg.slug === selectedPkgId;
              const isPopular = pkg.popular && !isSelected;
              const saving = (pkg.marketPrice ?? 0) - pkg.price;

              return (
                <motion.button
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="text-left relative overflow-hidden"
                  style={{
                    background: isSelected ? pkgBgColor : "rgba(15,23,42,0.7)",
                    border: isSelected ? `2px solid ${pkg.color}60` : `1px solid ${DS.border}`,
                    borderRadius: 16,
                    padding: "20px 18px",
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 0 24px ${pkg.color}18` : "none",
                    transition: "all 0.2s",
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Badge */}
                  {isPopular && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      padding: "2px", textAlign: "center",
                      background: GRD.primary, fontSize: 8, color: "#fff", fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                    }}>
                      ★ PHỔ BIẾN
                    </div>
                  )}
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      padding: "2px", textAlign: "center",
                      background: pkg.color, fontSize: 8, color: "#fff", fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                    }}>
                      ✓ ĐÃ CHỌN
                    </div>
                  )}

                  <div style={{ marginTop: isPopular || isSelected ? 14 : 0 }}>
                    <div style={{
                      color: pkg.color, fontSize: 9, fontFamily: DS.mono,
                      letterSpacing: "0.18em", marginBottom: 6,
                    }}>
                      {pkg.name.toUpperCase()}
                    </div>
                    {saving > 0 && (
                      <div style={{
                        color: DS.text5, fontSize: 11, fontFamily: DS.mono,
                        textDecoration: "line-through", lineHeight: 1, marginBottom: 2,
                      }}>
                        {fmtVND(pkg.marketPrice ?? 0)}
                      </div>
                    )}
                    <div style={{
                      color: DS.text, fontFamily: DS.heading, fontSize: 28, fontWeight: 900,
                      lineHeight: 1.1, marginBottom: 4,
                    }}>
                      {fmtVND(pkg.price)}
                    </div>
                    {pkg.savingPct && pkg.savingPct > 0 && (
                      <div
                        className="inline-block mb-3 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          background: "rgba(34,197,94,0.12)", color: DS.green, fontFamily: DS.mono,
                        }}
                      >
                        −{pkg.savingPct}%
                      </div>
                    )}
                    <p style={{ color: DS.text3, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>
                      {pkg.desc}
                    </p>
                    {pkg.features.length > 0 && (
                      <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                        {pkg.features.slice(0, 3).map((feat, i) => (
                          <li key={i} style={{ display: "flex", alignItems: "center", gap: 4, color: DS.text4, fontSize: 10, lineHeight: 1.4 }}>
                            <Check size={9} style={{ color: DS.green, flexShrink: 0 }} />
                            {feat}
                          </li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li style={{ color: DS.text5, fontSize: 10 }}>
                            +{pkg.features.length - 3} tính năng khác
                          </li>
                        )}
                      </ul>
                    )}
                    <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, marginTop: 8 }}>
                      ◈ +{pkg.lp.toLocaleString()} LP
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ── Feature Toggle Table (animate in when package selected) ── */}
          <AnimatePresence>
            {selectedPkgId && allFeatures.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <FeatureToggleTable
                  allFeatures={allFeatures}
                  selectedIds={selectedFeatures}
                  includedIds={includedFeatureIds}
                  onToggle={handleToggle}
                  packageName={selectedPkg?.name}
                  packageColor={pkgColor}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA ── */}
          <AnimatePresence>
            {selectedPkg && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-10"
              >
                {/* Summary */}
                <div className="text-center mb-6">
                  <p style={{ color: DS.text3, fontSize: 14, marginBottom: 6 }}>
                    Giá ước tính:{" "}
                    <strong style={{ color: DS.text, fontSize: 18, fontFamily: DS.heading }}>
                      {fmtVND(subtotal)}
                    </strong>
                  </p>
                  {extraFeatureTotal > 0 && (
                    <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                      (gói {fmtVND(basePrice)} + {selectedFeatures.filter(id => !includedFeatureIds.includes(id)).length} tính năng thêm)
                    </p>
                  )}
                  <p style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, marginTop: 4 }}>
                    ◈ Nhận +{selectedPkg.lp.toLocaleString()} LP khi hoàn thành dự án
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href={`/${locale}/booking?service=web&package=${selectedPkgId}`}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white"
                    style={{
                      background: GRD.primary,
                      fontFamily: DS.mono, fontSize: 14,
                      boxShadow: "0 4px 20px rgba(236,72,153,0.4)",
                      textDecoration: "none",
                    }}
                  >
                    Đặt dịch vụ này
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={`/${locale}/contact`}
                    className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold"
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      color: DS.text3,
                      border: `1px solid ${DS.border}`,
                      fontFamily: DS.mono, fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Liên hệ tư vấn
                  </Link>
                </div>

                <p style={{
                  color: DS.text5, fontSize: 11, fontFamily: DS.mono,
                  marginTop: 14, textAlign: "center",
                }}>
                  Không phí ẩn · Bảo hành{" "}
                  {selectedPkg.id === "basic" ? "1" : selectedPkg.id === "business" ? "3" : "6"} tháng ·
                  Thanh toán linh hoạt
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Trust strip ── */}
          <div
            className="mt-16 grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
          >
            {[
              { icon: "🛡", text: "Bảo hành 1–6 tháng", color: DS.green },
              { icon: "📱", text: "Responsive mọi thiết bị", color: DS.blue },
              { icon: "🔒", text: "SSL miễn phí trọn đời", color: DS.purple },
              { icon: "⚡", text: "Code sạch, dễ mở rộng", color: DS.cyan },
            ].map(item => (
              <div
                key={item.text}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}
              >
                <div
                  className="flex items-center justify-center text-sm flex-shrink-0 rounded-lg"
                  style={{
                    width: 32, height: 32,
                    background: `${item.color}15`,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.4 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
