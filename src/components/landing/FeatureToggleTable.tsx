"use client";

/**
 * FeatureToggleTable — Reusable interactive feature selector
 * Used by: BookingWizardClient (step 1) + /thiet-ke-website page
 *
 * UX principles for non-tech customers:
 * 1. Every feature has a PLAIN-LANGUAGE description (visible by default, 2 lines)
 * 2. "Chi tiết" → expand full description with concrete examples
 * 3. Included features: clearly labeled "Đã có" — no confusing pricing
 * 4. Extra features: "+X,XXX,XXXđ" prominent, instant price feedback
 * 5. Visual cues (colors, icons, badges) reinforce meaning, not decoration
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { rgba } from "@/components/ui/utils";
import {
  Check, HelpCircle, ChevronDown, ChevronRight,
  Shield, Search, Globe, Code2, BarChart3, Layers, Zap, Package,
} from "lucide-react";

const fmtVND = (n: number | null | undefined) => {
  if (n == null || n === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
};

export interface WizardFeature {
  id: string;
  /** Tên hiển thị (tiếng Việt, dễ hiểu) */
  label: string;
  labelEn?: string;
  /** Giá bổ sung — 0 nếu đã bao gồm */
  price: number;
  category: string;
  xpPoints?: number;
  tier?: string;
  /** Mô tả thân thiện — cho khách hàng không biết kỹ thuật */
  description: string;
  /** Lợi ích ngắn gọn 1 dòng */
  benefit?: string;
  /** true = đã bao gồm trong gói đã chọn */
  includedInBase?: boolean;
  isUpgradeable?: boolean;
  parentId?: string | null;
  categoryEn?: string;
}

// ── Design tokens per category ──────────────────────────────────────────────────

interface CategoryStyle {
  color: string;
  bgLight: string;
  bgHover: string;
  border: string;
  icon: React.ReactNode;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Nâng cao": {
    color: "#4F7DF3", bgLight: "rgba(79,125,243,0.08)",
    bgHover: "rgba(79,125,243,0.14)", border: "rgba(79,125,243,0.25)",
    icon: <Layers size={14} />,
  },
  "SEO": {
    color: "#E6C75F", bgLight: "rgba(230,199,95,0.08)",
    bgHover: "rgba(230,199,95,0.14)", border: "rgba(230,199,95,0.25)",
    icon: <Search size={14} />,
  },
  "Bảo mật": {
    color: "#7CB5A0", bgLight: "rgba(124,181,160,0.08)",
    bgHover: "rgba(124,181,160,0.14)", border: "rgba(124,181,160,0.25)",
    icon: <Shield size={14} />,
  },
  "Tích hợp": {
    color: "#B07CC6", bgLight: "rgba(176,124,198,0.08)",
    bgHover: "rgba(176,124,198,0.14)", border: "rgba(176,124,198,0.25)",
    icon: <Zap size={14} />,
  },
  "Thiết kế": {
    color: "#EC4899", bgLight: "rgba(236,72,153,0.08)",
    bgHover: "rgba(236,72,153,0.14)", border: "rgba(236,72,153,0.25)",
    icon: <Code2 size={14} />,
  },
  "Nội dung": {
    color: "#62C5EB", bgLight: "rgba(98,197,235,0.08)",
    bgHover: "rgba(98,197,235,0.14)", border: "rgba(98,197,235,0.25)",
    icon: <Globe size={14} />,
  },
  "Analytics": {
    color: "#E6C75F", bgLight: "rgba(230,199,95,0.08)",
    bgHover: "rgba(230,199,95,0.14)", border: "rgba(230,199,95,0.25)",
    icon: <BarChart3 size={14} />,
  },
  "Khác": {
    color: "#94A3B8", bgLight: "rgba(148,163,184,0.06)",
    bgHover: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.2)",
    icon: <Package size={14} />,
  },
};

function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES["Khác"];
}

// ── FeatureRow ─────────────────────────────────────────────────────────────────

function FeatureRow({
  feature,
  isSelected,
  isIncluded,
  isDisabled,
  onToggle,
}: {
  feature: WizardFeature;
  isSelected: boolean;
  isIncluded: boolean;
  isDisabled: boolean;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const catStyle = getCategoryStyle(feature.category);

  // States:
  // INCLUDED: green bg, green checkbox, "✓ Đã có" badge, disabled checkbox
  // SELECTED (extra): category-color bg, category-color checkbox, "+Xđ" badge
  // DEFAULT (extra, not selected): dark bg, empty checkbox, "+Xđ" badge
  // DISABLED: reduced opacity

  const rowBg = isIncluded
    ? "rgba(34,197,94,0.08)"
    : isSelected
      ? catStyle.bgLight
      : rgba(DS.bgCosmic, 0.6);

  const rowBorder = isIncluded
    ? `1px solid ${rgba("#22C55E", 0.2)}`
    : isSelected
      ? `1px solid ${catStyle.border}`
      : `1px solid ${rgba(DS.text, 0.08)}`;

  return (
    <motion.div
      layout
      style={{
        background: rowBg,
        border: rowBorder,
        borderRadius: 14,
        overflow: "hidden",
        opacity: isDisabled ? 0.45 : 1,
        transition: "background 0.2s, border 0.2s",
      }}
      whileHover={!isDisabled ? {
        background: isIncluded ? "rgba(34,197,94,0.12)" : isSelected ? catStyle.bgHover : rgba(DS.text, 0.04),
      } : {}}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={() => !isDisabled && onToggle(feature.id)}
          disabled={isDisabled}
          aria-label={`${isIncluded ? "Đã có: " : isSelected ? "Bỏ chọn: " : "Chọn: "}${feature.label}`}
          className="flex-shrink-0 mt-0.5 rounded-lg flex items-center justify-center transition-all"
          style={{
            width: 22, height: 22,
            background: isIncluded
              ? "rgba(34,197,94,0.15)"
              : isSelected
                ? catStyle.color
                : rgba(DS.text, 0.04),
            border: isIncluded
              ? `1.5px solid ${rgba("#22C55E", 0.4)}`
              : isSelected
                ? "none"
                : `1.5px solid ${rgba(DS.text, 0.12)}`,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {(isIncluded || isSelected) && (
            <Check size={11} strokeWidth={3} style={{ color: isIncluded ? "#22C55E" : "#fff" }} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Label + Badge + Price */}
          <div className="flex items-start justify-between gap-3 mb-2">
            {/* Label + category icon */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span style={{ color: catStyle.color, opacity: 0.85, flexShrink: 0 }}>
                {catStyle.icon}
              </span>
              <span style={{
                color: isIncluded ? "#22C55E" : DS.text,
                fontSize: 14, fontWeight: 600, lineHeight: 1.4,
              }}>
                {feature.label}
              </span>
            </div>

            {/* Price or included badge */}
            <div className="flex-shrink-0">
              {isIncluded ? (
                /* Included badge — no price shown, reassuring green */
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: "#22C55E",
                    border: "1px solid rgba(34,197,94,0.25)",
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  <Check size={10} strokeWidth={3} />
                  Đã có
                </span>
              ) : (
                /* Extra price badge — prominent for non-tech */
                <span
                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: `${catStyle.color}14`,
                    color: catStyle.color,
                    border: `1px solid ${catStyle.border}`,
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  +{fmtVND(feature.price)}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Benefit badge */}
          {feature.benefit && (
            <div
              className="mb-2"
              style={{ paddingLeft: 22 }}
            >
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: `${catStyle.color}10`,
                  color: catStyle.color,
                  border: `1px solid ${catStyle.color}20`,
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                }}
              >
                ✦ {feature.benefit}
              </span>
            </div>
          )}

          {/* Row 3: Plain-language description (always visible, 2 lines) */}
          <p
            style={{
              color: "#64748B",
              fontSize: 12.5,
              lineHeight: 1.65,
              paddingLeft: 22,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: feature.description ? 0 : 4,
            }}
          >
            {feature.description}
          </p>

          {/* Row 4: "Chi tiết" expand button */}
          {feature.description && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 mt-1.5 transition-opacity"
              style={{
                color: "#475569",
                fontSize: 11.5,
                fontFamily: "monospace",
                padding: "2px 0",
                opacity: 0.75,
                paddingLeft: 22,
                cursor: "pointer",
              }}
            >
              <HelpCircle size={11} />
              {expanded ? "Thu gọn" : "Giải thích thêm"}
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded: full description + concrete examples */}
      <AnimatePresence>
        {expanded && feature.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                borderTop: `1px solid ${isIncluded ? rgba("#22C55E", 0.12) : rgba(DS.text, 0.06)}`,
                padding: "14px 16px 14px 58px",
                background: isIncluded
                  ? "rgba(34,197,94,0.05)"
                  : rgba(DS.bgCosmic, 0.8),
              }}
            >
              {/* Full description */}
              <p style={{ color: DS.text3, fontSize: 12.5, lineHeight: 1.75, marginBottom: 8 }}>
                {feature.description}
              </p>

              {/* English label if available */}
              {feature.labelEn && (
                <div
                  className="inline-flex items-center"
                  style={{
                    color: "#475569",
                    fontSize: 11,
                    fontFamily: "monospace",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                >
                  EN: {feature.labelEn}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ChevronUp helper (not in lucide-react — inline SVG)
function ChevronUp({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// ── CategorySection ─────────────────────────────────────────────────────────────

function CategorySection({
  category,
  features,
  selectedIds,
  includedIds,
  disabledIds,
  onToggle,
}: {
  category: string;
  features: WizardFeature[];
  selectedIds: string[];
  includedIds: string[];
  disabledIds?: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const catStyle = getCategoryStyle(category);

  const includedCount = features.filter(f => includedIds.includes(f.id)).length;
  const extraSelectedCount = features.filter(
    f => !includedIds.includes(f.id) && selectedIds.includes(f.id)
  ).length;
  const extraCount = features.filter(f => !includedIds.includes(f.id)).length;

  return (
    <div className="mb-5">
      {/* Category header — collapsible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 mb-3 rounded-xl p-2 -mx-1 transition-colors"
        style={{ cursor: "pointer" }}
        aria-label={`${open ? "Thu gọn" : "Mở rộng"} ${category}`}
      >
        {/* Category icon + color dot */}
        <span
          className="flex items-center justify-center flex-shrink-0 rounded-lg"
          style={{
            width: 30, height: 30,
            background: catStyle.bgLight,
            color: catStyle.color,
            border: `1px solid ${catStyle.border}`,
          }}
        >
          {catStyle.icon}
        </span>

        {/* Category name */}
        <span style={{
          color: DS.text,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.06em",
          fontFamily: "monospace",
        }}>
          {category.toUpperCase()}
        </span>

        {/* Feature count badges */}
        <span className="flex items-center gap-1.5">
          {/* Included count */}
          {includedCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#22C55E",
                border: "1px solid rgba(34,197,94,0.2)",
                fontFamily: "monospace",
              }}
            >
              {includedCount} đã có
            </span>
          )}
          {/* Extra available count */}
          {extraCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: catStyle.bgLight,
                color: catStyle.color,
                border: `1px solid ${catStyle.border}`,
                fontFamily: "monospace",
              }}
            >
              {extraSelectedCount > 0 ? `${extraSelectedCount}/${extraCount}` : extraCount} thêm
            </span>
          )}
        </span>

        {/* Chevron */}
        <span className="ml-auto" style={{ color: "#64748B" }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {/* Features list — collapsible */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-2 pl-1">
              {features.map(feature => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  isSelected={selectedIds.includes(feature.id)}
                  isIncluded={includedIds.includes(feature.id)}
                  isDisabled={disabledIds?.includes(feature.id) ?? false}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export interface FeatureToggleTableProps {
  /** Tất cả features khả dụng cho dịch vụ này */
  allFeatures: WizardFeature[];
  /** Feature IDs đang được chọn (included + user-ticked extra) */
  selectedIds: string[];
  /** Feature IDs BAO GỒM trong gói đã chọn (không bỏ được) */
  includedIds: string[];
  /** Feature IDs bị cấm hoàn toàn (không chọn được) */
  disabledIds?: string[];
  onToggle: (featureId: string) => void;
  /** Tên gói đang chọn (hiển thị trong header) */
  packageName?: string;
  /** Màu accent của gói (dùng cho header + selected state) */
  packageColor?: string;
}

export function FeatureToggleTable({
  allFeatures,
  selectedIds,
  includedIds,
  disabledIds = [],
  onToggle,
  packageName,
  packageColor = "#4F7DF3",
}: FeatureToggleTableProps) {
  // Group features by category
  const grouped = allFeatures.reduce<Record<string, WizardFeature[]>>((acc, f) => {
    const cat = f.category || "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(f);
    return acc;
  }, {});

  // Sort categories: "Nâng cao" first, then alphabetically
  const categoryOrder = ["Nâng cao", "SEO", "Bảo mật", "Tích hợp", "Thiết kế", "Nội dung", "Analytics"];
  const categories = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });

  // Stats
  const includedCount = includedIds.length;
  const extraCount = selectedIds.filter(id => !includedIds.includes(id)).length;
  const extraTotal = allFeatures
    .filter(f => selectedIds.includes(f.id) && !includedIds.includes(f.id))
    .reduce((s, f) => s + f.price, 0);

  return (
    <div>
      {/* ── Section Header ── */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: rgba(DS.bgCosmic, 0.6),
          border: `1px solid ${rgba(DS.text, 0.08)}`,
          boxShadow: `0 4px 20px ${rgba(DS.text, 0.02)}`,
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          {/* Title + package badge */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              {packageName && (
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider"
                  style={{
                    background: `${packageColor}18`,
                    color: packageColor,
                    border: `1px solid ${packageColor}35`,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  {packageName.toUpperCase()}
                </span>
              )}
              <h4 style={{
                color: DS.text,
                fontFamily: "Cinzel, serif",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}>
                Tùy chỉnh tính năng
              </h4>
            </div>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, maxWidth: 520 }}>
              Những tính năng <strong style={{ color: "#22C55E" }}>đã bao gồm</strong> trong gói
              không thể bỏ. Tích thêm tính năng bạn cần — giá sẽ tăng tương ứng.
            </p>
          </div>

          {/* Stats: Đã có + Thêm + Giá thêm */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Đã có */}
            <div
              className="text-center px-3 py-2 rounded-xl min-w-[56px]"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <div style={{
                color: "#22C55E",
                fontFamily: "Cinzel, serif",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
              }}>
                {includedCount}
              </div>
              <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>
                Đã có
              </div>
            </div>

            {/* Thêm */}
            {extraCount > 0 && (
              <div
                className="text-center px-3 py-2 rounded-xl min-w-[56px]"
                style={{
                  background: `${packageColor}0A`,
                  border: `1px solid ${packageColor}22`,
                }}
              >
                <div style={{
                  color: packageColor,
                  fontFamily: "Cinzel, serif",
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  +{extraCount}
                </div>
                <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>
                  Thêm
                </div>
              </div>
            )}

            {/* Giá thêm */}
            {extraTotal > 0 && (
              <div
                className="text-center px-3 py-2 rounded-xl"
                style={{
                  background: `${packageColor}08`,
                  border: `1px solid ${packageColor}20`,
                }}
              >
                <div style={{
                  color: packageColor,
                  fontFamily: "monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  +{fmtVND(extraTotal)}
                </div>
                <div style={{ color: "#475569", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>
                  Giá thêm
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual: included vs extra breakdown bar */}
        <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
          {/* Green = included, category-color = extra selected */}
          <div
            className="h-full"
            style={{
              background: `linear-gradient(90deg, #22C55E ${includedCount > 0 ? 50 : 0}%, ${packageColor} ${includedCount > 0 ? 50 : 0}%, ${packageColor} 100%)`,
              width: "100%",
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* ── Empty state ── */}
      {categories.length === 0 && (
        <div
          className="text-center py-12 rounded-2xl"
          style={{
            background: "rgba(15,23,42,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ color: "#475569", fontSize: 14, marginBottom: 4 }}>
            Chưa có tính năng nào cho gói này
          </div>
          <div style={{ color: "#334155", fontSize: 12, fontFamily: "monospace" }}>
            Chọn dịch vụ khác hoặc liên hệ tư vấn
          </div>
        </div>
      )}

      {/* ── Category sections ── */}
      {categories.map(cat => (
        <CategorySection
          key={cat}
          category={cat}
          features={grouped[cat]!}
          selectedIds={selectedIds}
          includedIds={includedIds}
          disabledIds={disabledIds}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
