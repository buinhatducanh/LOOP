"use client";

/**
 * WebPackageFeatureTable — User-facing website package feature matrix table
 * Displays: 4 columns (Landing | Bán Hàng | Doanh Nghiệp | Tùy Chỉnh) × rows = features
 * Same pattern as SEOPackageFeatureTable but for website packages
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { Check, ChevronDown, ChevronUp, Layers } from "lucide-react";

const fmtVND = (n: number | null | undefined) => {
    if (n == null || n === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WebPackageFeature {
    id: string;
    label: string;
    labelEn?: string;
    description: string;
    category: string;
    /** price shown in table cell */
    extraPrice?: number;
    /** tiers that include this feature. LandingPage=1, BanHang=2, DoanhNghiep=3, YeuCau=4 */
    includedTiers: number[];
}

export interface WebPackageTier {
    id?: string;
    slug?: string;
    level: number;
    name: string;
    shortDesc: string;
    basePrice: number;
    marketPrice?: number;
    savingPct?: number;
    color: string;
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    "Giao diện": { color: "#6EB1A8", bg: "rgba(110,177,168,0.08)", border: "rgba(110,177,168,0.25)" },
    "Tính năng cốt lõi": { color: "#4F7DF3", bg: "rgba(79,125,243,0.08)", border: "rgba(79,125,243,0.25)" },
    "Quản trị": { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
    "SEO & Marketing": { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    "Thương mại": { color: "#EC4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)" },
    "Nâng cao": { color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
    "Khác": { color: "#94A3B8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)" },
};

const TIER_COLORS = ["#94A3B8", "#6EB1A8", "#4F7DF3", "#8B5CF6", "#EC4899"];
const TIER_NAMES = ["", "Landing Page", "Bán Hàng Cơ Bản", "Doanh Nghiệp", "Theo Yêu Cầu"];

function getCategoryStyle(cat: string) {
    return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["Khác"];
}

// ── Feature Row ────────────────────────────────────────────────────────────────

function FeatureRow({
    feature,
    selectedTier,
}: {
    feature: WebPackageFeature;
    selectedTier: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const catStyle = getCategoryStyle(feature.category);
    const isIncluded = feature.includedTiers.includes(selectedTier);

    return (
        <>
            <tr
                onClick={() => setExpanded(v => !v)}
                style={{
                    cursor: "pointer",
                    background: expanded ? catStyle.bg : "transparent",
                    borderBottom: `1px solid ${DS.border}`,
                    transition: "background 0.15s",
                }}
            >
                {/* Feature name + badge — width matches header th width: 40% */}
                <td style={{ 
                    padding: "10px 14px", 
                    width: 220,
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                    background: expanded ? catStyle.bg : DS.bg,
                }}>
                    <div className="flex items-center gap-2">
                        <span style={{ color: catStyle.color, flexShrink: 0 }}>
                            <Layers size={12} />
                        </span>
                        <div className="min-w-0">
                            <p style={{ color: DS.text, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{feature.label}</p>
                            {!!feature.labelEn && feature.labelEn !== feature.label && (
                                <p style={{ color: DS.text5, fontSize: 9.5, fontFamily: DS.mono }}>{feature.labelEn}</p>
                            )}
                        </div>
                        {typeof feature.extraPrice === 'number' && feature.extraPrice > 0 ? (
                            <span
                                className="px-1.5 py-0.5 rounded-md flex-shrink-0"
                                style={{
                                    background: `${catStyle.color}15`,
                                    color: catStyle.color,
                                    border: `1px solid ${catStyle.border}`,
                                    fontSize: 9,
                                    fontFamily: DS.mono,
                                }}
                            >
                                +{fmtVND(feature.extraPrice)}
                            </span>
                        ) : null}
                    </div>
                </td>

                {/* 4 tier columns — widths match header th widths (40% label, 15% each tier) */}
                {[1, 2, 3, 4].map(tier => {
                    const has = feature.includedTiers.includes(tier);
                    const isSelectedTier = tier === selectedTier;
                    return (
                        <td
                            key={tier}
                            style={{ padding: "10px 6px", textAlign: "center", width: 130 }}
                        >
                            {has ? (
                                <div
                                    className="inline-flex items-center justify-center rounded-lg"
                                    style={{
                                        width: 26,
                                        height: 26,
                                        background: isSelectedTier ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.1)",
                                        border: isSelectedTier ? "2px solid #22C55E" : "1.5px solid rgba(34,197,94,0.3)",
                                    }}
                                >
                                    <Check size={12} strokeWidth={2.5} style={{ color: "#22C55E" }} />
                                </div>
                            ) : (
                                <div
                                    className="inline-flex items-center justify-center rounded-lg"
                                    style={{
                                        width: 26,
                                        height: 26,
                                        background: isSelectedTier ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
                                        border: isSelectedTier ? "2px solid rgba(239,68,68,0.5)" : "1.5px solid rgba(239,68,68,0.2)",
                                    }}
                                >
                                    <span style={{ color: "rgba(239,68,68,0.45)", fontSize: 10 }}>—</span>
                                </div>
                            )}
                        </td>
                    );
                })}
            </tr>

            {/* Expanded description */}
            <AnimatePresence>
                {expanded && (
                    <tr>
                        <td
                            colSpan={5}
                            style={{
                                background: catStyle.bg,
                                borderBottom: `1px solid ${catStyle.border}`,
                                padding: "10px 14px 12px 42px",
                            }}
                        >
                            <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.65, marginBottom: 4 }}>
                                {feature.description}
                            </p>
                        </td>
                    </tr>
                )}
            </AnimatePresence>
        </>
    );
}

// ── Category Group ─────────────────────────────────────────────────────────────

function CategoryGroup({
    category,
    features,
    selectedTier,
    defaultOpen = true,
}: {
    category: string;
    features: WebPackageFeature[];
    selectedTier: number;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const catStyle = getCategoryStyle(category);
    const includedCount = features.filter(f => f.includedTiers.includes(selectedTier)).length;

    return (
        <div
            style={{
                border: `1px solid ${catStyle.border}`,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 10,
                minWidth: 740,
            }}
        >
            {/* Category header */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5"
                style={{
                    background: catStyle.bg,
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s",
                }}
            >
                    <div className="flex items-center gap-2">
                        <span style={{ color: catStyle.color }}><Layers size={13} /></span>
                        <span style={{ color: DS.text, fontWeight: 700, fontSize: 12 }}>{category}</span>
                        <span style={{
                            background: `${catStyle.color}20`,
                            color: catStyle.color,
                            fontSize: 9,
                            fontFamily: DS.mono,
                            padding: "1px 6px",
                            borderRadius: 9999,
                        }}>
                            {features.length} tính năng
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                            {includedCount}/{features.length} trong gói bạn chọn
                        </span>
                        {open ? <ChevronUp size={13} style={{ color: catStyle.color }} /> : <ChevronDown size={13} style={{ color: catStyle.color }} />}
                    </div>
                </button>
            {/* Feature rows */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                    >
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                {features.map(feature => (
                                    <FeatureRow
                                        key={feature.id}
                                        feature={feature}
                                        selectedTier={selectedTier}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function WebPackageFeatureTable({
    features,
    selectedTier,
    tiers,
    onSelectTier,
}: {
    features: WebPackageFeature[];
    selectedTier: number;
    tiers?: WebPackageTier[];
    onSelectTier?: (tier: number) => void;
}) {
    // Group by category
    const byCategory: Record<string, WebPackageFeature[]> = {};
    for (const f of features) {
        const cat = f.category || "Khác";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(f);
    }

    // Sort categories
    const CAT_ORDER = ["Giao diện", "Tính năng cốt lõi", "Quản trị", "SEO & Marketing", "Thương mại", "Nâng cao"];
    const sortedCategories = Object.keys(byCategory).sort((a, b) => {
        const ai = CAT_ORDER.indexOf(a);
        const bi = CAT_ORDER.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-zen">
            <div style={{ minWidth: 740 }}>
                {/* Table header: tier selector bar — uses <table> so columns align with body */}
                <div style={{
                    marginBottom: 12,
                    background: DS.bg,
                    borderRadius: 10,
                    border: `1px solid ${DS.border}`,
                    overflow: "hidden",
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                {/* Feature label column — matches td width */}
                                <th style={{ 
                                    padding: "10px 14px", 
                                    textAlign: "left", 
                                    width: 220,
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 20,
                                    background: DS.bg,
                                }}>
                                    <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 2 }}>
                                        TÍNH NĂNG WEBSITE
                                    </p>
                                    <p style={{ color: DS.text3, fontSize: 10.5 }}>
                                        Ma trận so sánh tính năng
                                    </p>
                                </th>
                                {/* 4 tier columns */}
                                {[1, 2, 3, 4].map(tier => {
                                    const tierData = tiers ? tiers[tier - 1] : null;
                                    const color = TIER_COLORS[tier];
                                    const isSelected = selectedTier === tier;
                                    return (
                                        <th
                                            key={tier}
                                            style={{
                                                textAlign: "center",
                                                padding: "8px 6px",
                                                width: 130,
                                            }}
                                        >
                                        <motion.button
                                            onClick={() => onSelectTier?.(tier)}
                                            style={{
                                                background: isSelected ? `${color}15` : "transparent",
                                                border: isSelected ? `2px solid ${color}60` : "1px solid transparent",
                                                borderRadius: 10,
                                                padding: "8px 6px",
                                                cursor: "pointer",
                                                width: "100%",
                                                transition: "all 0.15s",
                                                display: "block",
                                            }}
                                        >
                                            <span style={{
                                                color: isSelected ? color : DS.text4,
                                                fontSize: 10,
                                                fontFamily: DS.mono,
                                                fontWeight: 700,
                                                letterSpacing: "0.06em",
                                                transition: "color 0.15s",
                                                display: "block",
                                            }}>
                                                {TIER_NAMES[tier]}
                                            </span>
                                            {tierData && tierData.basePrice > 0 && (
                                                <span style={{ color: isSelected ? DS.text : DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2, display: "block" }}>
                                                    {fmtVND(tierData.basePrice)}
                                                </span>
                                            )}
                                            {tierData && tierData.basePrice === 0 && (
                                                <span style={{ color: isSelected ? DS.text : DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2, display: "block" }}>
                                                    Liên hệ
                                                </span>
                                            )}
                                            {isSelected && (
                                                <span style={{
                                                    width: 6, height: 6, borderRadius: "50%",
                                                    background: color, margin: "4px auto 0",
                                                    display: "block",
                                                }} />
                                            )}
                                        </motion.button>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                </table>
            </div>

                {sortedCategories.map(cat => (
                    <CategoryGroup
                        key={cat}
                        category={cat}
                        features={byCategory[cat]}
                        selectedTier={selectedTier}
                        defaultOpen={true}
                    />
                ))}
            </div>

            {/* Legend */}
            <div style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                marginTop: 8,
                flexWrap: "wrap",
            }}>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "1.5px solid rgba(34,197,94,0.3)" }}>
                        <Check size={10} strokeWidth={3} style={{ color: "#22C55E" }} />
                    </div>
                    <span style={{ color: DS.text4, fontSize: 11 }}>Có trong gói</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)" }}>
                        <span style={{ color: "rgba(239,68,68,0.4)", fontSize: 11 }}>—</span>
                    </div>
                    <span style={{ color: DS.text4, fontSize: 11 }}>Không có</span>
                </div>
            </div>
        </div>
    );
}
