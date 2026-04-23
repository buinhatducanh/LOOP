"use client";

/**
 * SEOPackageFeatureTable — User-facing SEO feature matrix table
 * Displayed on /thiet-ke-website page after selecting an SEO package
 * Shows which features are included/excluded per SEO tier
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { Check, X, ChevronDown, ChevronUp, Search, ExternalLink } from "lucide-react";

// ── Utils ──────────────────────────────────────────────────────────────────────

const fmtVND = (n: number) => {
    if (n === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SEOFeature {
    id: string;
    label: string;
    labelEn?: string;
    description: string;
    descriptionVi?: string;
    category: string;
    categoryVi?: string;
    extraPrice?: number;
    videoUrl?: string;
    serviceKey?: string;
    nameVi?: string;
    nameEn?: string;
    includedTiers: number[]; // tier levels that include this feature: [1] = Basic, [2] = Business, [3] = Experience
}

export interface SEOPackageTier {
    level: number;
    name: string;
    shortDesc: string;
    basePrice: number;
    marketPrice?: number;
    serviceKey?: string;
    isActive?: boolean;
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    "Tối ưu On-page": { color: "#4F7DF3", bg: "rgba(79,125,243,0.08)", border: "rgba(79,125,243,0.25)" },
    "Tối ưu Off-page": { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
    "Nghiên cứu từ khóa": { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    "Phân tích kỹ thuật": { color: "#EC4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)" },
    "Báo cáo": { color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
    "Khác": { color: "#94A3B8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)" },
};

const TIER_COLORS = ["#94A3B8", "#4F7DF3", "#F59E0B"];
const TIER_NAMES = ["", "Cơ Bản", "Doanh Nghiệp", "Chuyên Nghiệp"];

function getCategoryStyle(cat: string) {
    return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["Khác"];
}

// ── Feature Table Row ─────────────────────────────────────────────────────────

function FeatureTableRow({
    feature,
    selectedTier,
}: {
    feature: SEOFeature;
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
                {/* Feature name */}
                <td style={{ padding: "12px 16px", maxWidth: 280 }}>
                    <div className="flex items-center gap-2">
                        <span style={{ color: catStyle.color, flexShrink: 0 }}>
                            <Search size={13} />
                        </span>
                        <div className="min-w-0">
                            <p style={{ color: DS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{feature.label}</p>
                            {!!feature.labelEn && (
                                <p style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{feature.labelEn}</p>
                            )}
                        </div>
                        {!!feature.videoUrl && (
                            <a
                                href={feature.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                                style={{
                                    background: `${catStyle.color}15`, color: catStyle.color,
                                    border: `1px solid ${catStyle.border}`, fontSize: 10, fontFamily: DS.mono,
                                    textDecoration: "none", flexShrink: 0,
                                }}
                                title="Xem video hướng dẫn"
                            >
                                <ExternalLink size={10} /> Video
                            </a>
                        )}
                        {typeof feature.extraPrice === 'number' && feature.extraPrice > 0 ? (
                            <span
                                className="px-2 py-0.5 rounded-md"
                                style={{
                                    background: `${catStyle.color}15`, color: catStyle.color,
                                    border: `1px solid ${catStyle.border}`, fontSize: 10, fontFamily: DS.mono,
                                    flexShrink: 0,
                                }}
                            >
                                +{fmtVND(feature.extraPrice)}
                            </span>
                        ) : null}
                    </div>
                </td>

                {/* 3 tier columns */}
                {[1, 2, 3].map(tier => {
                    const has = feature.includedTiers.includes(tier);
                    const isSelectedTier = tier === selectedTier;
                    return (
                        <td
                            key={tier}
                            style={{
                                padding: "12px 8px", textAlign: "center", width: 120,
                            }}
                        >
                            {has ? (
                                <div
                                    className="inline-flex items-center justify-center rounded-lg"
                                    style={{
                                        width: 28, height: 28,
                                        background: isSelectedTier ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.1)",
                                        border: isSelectedTier ? "2px solid #22C55E" : "1.5px solid rgba(34,197,94,0.3)",
                                    }}
                                >
                                    <Check size={13} strokeWidth={2.5} style={{ color: "#22C55E" }} />
                                </div>
                            ) : (
                                <div
                                    className="inline-flex items-center justify-center rounded-lg"
                                    style={{
                                        width: 28, height: 28,
                                        background: isSelectedTier ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
                                        border: isSelectedTier ? "2px solid rgba(239,68,68,0.5)" : "1.5px solid rgba(239,68,68,0.2)",
                                    }}
                                >
                                    <span style={{ color: "rgba(239,68,68,0.5)", fontSize: 11 }}>—</span>
                                </div>
                            )}
                        </td>
                    );
                })}
            </tr>

            {/* Expanded description row */}
            <AnimatePresence>
                {expanded && (
                    <tr>
                        <td
                            colSpan={4}
                            style={{
                                background: catStyle.bg,
                                borderBottom: `1px solid ${catStyle.border}`,
                                padding: "12px 16px 16px 44px",
                            }}
                        >
                            <p style={{ color: DS.text3, fontSize: 12.5, lineHeight: 1.7, marginBottom: 4 }}>
                                {feature.description}
                            </p>
                            {feature.labelEn && (
                                <p style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
                                    EN: {feature.description}
                                </p>
                            )}
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
    features: SEOFeature[];
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
                marginBottom: 12,
            }}
        >
            {/* Category header */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{
                    background: catStyle.bg,
                    border: "none", cursor: "pointer",
                    transition: "background 0.15s",
                }}
            >
                <div className="flex items-center gap-2">
                    <span style={{ color: catStyle.color }}><Search size={14} /></span>
                    <span style={{ color: DS.text, fontWeight: 700, fontSize: 13 }}>{category}</span>
                    <span style={{
                        background: `${catStyle.color}20`, color: catStyle.color,
                        fontSize: 10, fontFamily: DS.mono, padding: "1px 7px", borderRadius: 9999,
                    }}>
                        {features.length} tính năng
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        {includedCount}/{features.length} trong gói bạn chọn
                    </span>
                    {open ? <ChevronUp size={14} style={{ color: catStyle.color }} /> : <ChevronDown size={14} style={{ color: catStyle.color }} />}
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
                                    <FeatureTableRow
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

export function SEOPackageFeatureTable({
    features,
    selectedTier,
    tiers,
}: {
    features: SEOFeature[];
    selectedTier: number;
    tiers?: SEOPackageTier[];
}) {
    // Group by category
    const byCategory: Record<string, SEOFeature[]> = {};
    for (const f of features) {
        const cat = f.category || "Khác";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(f);
    }

    // Sort categories by defined order
    const CAT_ORDER = ["Tối ưu On-page", "Tối ưu Off-page", "Nghiên cứu từ khóa", "Phân tích kỹ thuật", "Báo cáo", "Khác"];
    const sortedCategories = Object.keys(byCategory).sort((a, b) => {
        const ai = CAT_ORDER.indexOf(a);
        const bi = CAT_ORDER.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    return (
        <div>
            {/* Table header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginBottom: 12,
                padding: "10px 14px",
                background: "rgba(15,23,42,0.6)",
                borderRadius: 10,
                border: `1px solid ${DS.border}`,
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                        TÍNH NĂNG SEO
                    </p>
                    <p style={{ color: DS.text3, fontSize: 11 }}>
                        Ma trận so sánh tính năng giữa các gói
                    </p>
                </div>
                {TIER_NAMES.slice(1).map((name, i) => (
                    <div
                        key={name}
                        style={{
                            textAlign: "center", minWidth: 100,
                            padding: "4px 8px",
                        }}
                    >
                        <div style={{
                            color: TIER_COLORS[i + 1],
                            fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
                            letterSpacing: "0.08em",
                        }}>
                            {name.toUpperCase()}
                        </div>
                        {tiers && tiers[i + 1] && (
                            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                                {tiers[i + 1].basePrice > 0 ? fmtVND(tiers[i + 1].basePrice) : "Liên hệ"}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Category groups */}
            {sortedCategories.map(cat => (
                <CategoryGroup
                    key={cat}
                    category={cat}
                    features={byCategory[cat]}
                    selectedTier={selectedTier}
                    defaultOpen={true}
                />
            ))}

            {/* Legend */}
            <div style={{
                display: "flex", gap: 16, justifyContent: "center",
                marginTop: 8, flexWrap: "wrap",
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
