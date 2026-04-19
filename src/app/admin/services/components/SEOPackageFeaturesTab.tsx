"use client";

/**
 * SEOPackageFeaturesTab — Admin tab for managing SEO Package × Feature matrix
 * /admin/services → "Tính Năng SEO" tab
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Header: Title + "Thêm tính năng" button                            │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Bảng ma trận (sticky header row):                                 │
 * │ ┌──────────────────┬──────────┬──────────┬──────────┐              │
 * │ │ Tính năng       │ Cơ Bản  │ DN       │ CN       │              │
 * │ ├──────────────────┼──────────┼──────────┼──────────┤              │
 * │ │ ✓ Audit Content  │   ✓     │   ✓     │   ✓     │ [Sửa][Xóa]  │
 * │ │ ✓ Meta Tags      │   ✓     │   ✓     │   ✓     │              │
 * │ │ ✓ Schema markup  │          │   ✓     │   ✓     │              │
 * │ │ ○ GSC Setup      │          │          │   ✓     │              │
 * │ └──────────────────┴──────────┴──────────┴──────────┘              │
 * │                                                                     │
 * │ ✓ = checkmark (tính năng có trong gói)                           │
 * │ ○ = dash (không có trong gói)                                      │
 * │ Mỗi cell click để toggle ✓/○                                      │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Modal Thêm/Sửa tính năng: name, category, price, videoUrl, isActive
 */

import { useState, useMemo } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
    Plus, Edit2, Trash2, RefreshCw, X, Check, Video, Search,
    ChevronDown, ChevronUp, Layers, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ServiceTier = {
    id: string;
    serviceKey: string;
    level: number;
    name: string;
    nameEn?: string;
    basePrice: number;
    isActive: boolean;
};

type ServiceAttribute = {
    id: string;
    slug: string;
    name: string;
    nameVi: string;
    nameEn?: string;
    nameJa?: string;
    nameKo?: string;
    nameZh?: string;
    description?: string;
    descriptionVi?: string;
    category: string;
    categoryVi: string;
    price: number;
    isActive: boolean;
    sortOrder: number;
    serviceKey?: string;
    videoUrl?: string;
};

// { [featureId]: boolean }

// ── Constants ─────────────────────────────────────────────────────────────────

const SEO_SERVICE_KEY = "seo";

const SEO_TIER_LABELS: Record<number, string> = {
    1: "Cơ Bản",
    2: "Doanh Nghiệp",
    3: "Chuyên Nghiệp",
};

const SEO_TIER_COLORS: Record<number, string> = {
    1: "#22C55E",
    2: "#3B82F6",
    3: "#F59E0B",
};

const SEO_CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
    "Tối ưu On-page": { color: "#E6C75F", bg: "rgba(230,199,95,0.08)", border: "rgba(230,199,95,0.25)" },
    "Tối ưu Off-page": { color: "#62C5EB", bg: "rgba(98,197,235,0.08)", border: "rgba(98,197,235,0.25)" },
    "Nghiên cứu từ khóa": { color: "#EC4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)" },
    "Phân tích kỹ thuật": { color: "#4F7DF3", bg: "rgba(79,125,243,0.08)", border: "rgba(79,125,243,0.25)" },
    "Báo cáo": { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
    "Khác": { color: "#94A3B8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
};

const fmtVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Feature Modal ──────────────────────────────────────────────────────────────

function FeatureModal({
    feature,
    seoTiers,
    onClose,
    onSaved,
}: {
    feature?: ServiceAttribute | null;
    seoTiers: ServiceTier[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const qc = useQueryClient();

    const [nameVi, setNameVi] = useState(feature?.nameVi ?? "");
    const [nameEn, setNameEn] = useState(feature?.nameEn ?? "");
    const [categoryVi, setCategoryVi] = useState(feature?.categoryVi ?? "");
    const [descriptionVi, setDescriptionVi] = useState(feature?.descriptionVi ?? "");
    const [price, setPrice] = useState(feature?.price?.toString() ?? "0");
    const [videoUrl, setVideoUrl] = useState(feature?.videoUrl ?? "");
    const [sortOrder, setSortOrder] = useState(feature?.sortOrder?.toString() ?? "0");
    const [isActive, setIsActive] = useState(feature?.isActive ?? true);
    const [error, setError] = useState("");

    const isEdit = !!feature;

    const save = useMutation({
        mutationFn: async () => {
            if (!nameVi.trim()) throw new Error("Tên tính năng (VI) là bắt buộc");
            if (!categoryVi.trim()) throw new Error("Danh mục là bắt buộc");

            const slug =
                feature?.slug ??
                nameVi.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
                "-" + Date.now().toString(36);

            const payload = {
                ...(isEdit ? { id: feature.id } : {}),
                slug,
                nameVi: nameVi.trim(),
                name: nameVi.trim(),
                nameEn: nameEn.trim() || null,
                categoryVi: categoryVi.trim(),
                category: categoryVi.trim(),
                descriptionVi: descriptionVi.trim() || null,
                price: parseInt(price) || 0,
                videoUrl: videoUrl.trim() || null,
                sortOrder: parseInt(sortOrder) || 0,
                isActive,
                serviceKey: SEO_SERVICE_KEY,
                tier: "basic",
            };

            if (isEdit) {
                await adminApi.put("/api/admin/custom-features", payload);
            } else {
                await adminApi.post("/api/admin/custom-features", payload);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk.adminSeoFeatures() });
            onSaved();
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Lưu thất bại"),
    });

    const inputStyle: React.CSSProperties = {
        width: "100%",
        background: DS.bg,
        border: `1px solid ${DS.border}`,
        borderRadius: 8,
        padding: "8px 12px",
        color: DS.text,
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: DS.body,
    };

    const labelStyle: React.CSSProperties = {
        color: DS.text4,
        fontSize: 11,
        fontFamily: DS.mono,
        display: "block",
        marginBottom: 4,
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                background: "rgba(0,0,0,0.75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: DS.bgCard3,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 16,
                    padding: 24,
                    width: "100%",
                    maxWidth: 640,
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ color: DS.text, fontWeight: 800, fontSize: 18, fontFamily: DS.heading }}>
                        {isEdit ? "Sửa Tính Năng SEO" : "Thêm Tính Năng SEO"}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 8,
                            padding: "10px 14px",
                            color: DS.red,
                            fontSize: 13,
                            marginBottom: 16,
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Name VI */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>TÊN TÍNH NĂNG (TIẾNG VIỆT) *</label>
                    <input
                        value={nameVi}
                        onChange={(e) => setNameVi(e.target.value)}
                        style={inputStyle}
                        placeholder="VD: Audit nội dung website"
                    />
                </div>

                {/* Name EN */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>TÊN (ENGLISH)</label>
                    <input
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        style={inputStyle}
                        placeholder="VD: Content audit"
                    />
                </div>

                {/* Category + Price */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                        <label style={labelStyle}>DANH MỤC *</label>
                        <select
                            value={categoryVi}
                            onChange={(e) => setCategoryVi(e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer" }}
                        >
                            <option value="">Chọn danh mục</option>
                            {Object.keys(SEO_CATEGORY_STYLES).map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>PHÍ BỔ SUNG (VNĐ)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={inputStyle}
                            placeholder="0 = miễn phí trong gói"
                        />
                    </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>MÔ TẢ TÍNH NĂNG</label>
                    <textarea
                        value={descriptionVi}
                        onChange={(e) => setDescriptionVi(e.target.value)}
                        style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
                        placeholder="Mô tả ngắn gọn tính năng này làm gì..."
                    />
                </div>

                {/* Video URL */}
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>
                        <Video size={11} style={{ display: "inline", marginRight: 4 }} />
                        VIDEO HƯỚNG DẪN (YouTube/Vimeo URL)
                    </label>
                    <input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        style={inputStyle}
                        placeholder="https://youtube.com/watch?v=..."
                    />
                    {videoUrl && (
                        <p style={{ color: DS.text4, fontSize: 11, marginTop: 4, fontFamily: DS.mono }}>
                            ✓ Video sẽ hiển thị trong Wizard cho khách hàng
                        </p>
                    )}
                </div>

                {/* Sort Order + Active */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                        <label style={labelStyle}>SORT ORDER</label>
                        <input
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>TRẠNG THÁI</label>
                        <button
                            onClick={() => setIsActive(!isActive)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: `1px solid ${isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                                background: isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                color: isActive ? DS.green : DS.red,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: DS.body,
                            }}
                        >
                            {isActive ? "✓ Hoạt động" : "✗ Tắt"}
                        </button>
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => save.mutate()}
                        disabled={!nameVi.trim() || !categoryVi.trim() || save.isPending}
                        style={{
                            flex: 1,
                            padding: "10px",
                            background: GRD.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 14,
                            opacity: !nameVi.trim() || !categoryVi.trim() || save.isPending ? 0.6 : 1,
                        }}
                    >
                        {save.isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo tính năng"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 16px",
                            background: "transparent",
                            border: `1px solid ${DS.border}`,
                            color: DS.text3,
                            borderRadius: 10,
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        Hủy
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Matrix Cell ───────────────────────────────────────────────────────────────

function MatrixCell({
    checked,
    tierColor,
    onToggle,
}: {
    checked: boolean;
    tierColor: string;
    onToggle: () => void;
}) {
    return (
        <td style={{ textAlign: "center", padding: "6px 4px" }}>
            <button
                onClick={onToggle}
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1.5px solid ${checked ? tierColor + "60" : DS.border}`,
                    background: checked ? tierColor + "15" : "transparent",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                }}
                title={checked ? "Bỏ khỏi gói này" : "Thêm vào gói này"}
            >
                {checked ? (
                    <Check size={13} style={{ color: tierColor }} strokeWidth={3} />
                ) : (
                    <span style={{ color: DS.text5, fontSize: 14, fontFamily: DS.mono }}>—</span>
                )}
            </button>
        </td>
    );
}

// ── Feature Row ────────────────────────────────────────────────────────────────

function FeatureRow({
    feature,
    seoTiers,
    matrix,
    onToggleCell,
    onEdit,
    onDelete,
    expandedCategories,
    toggleCategory,
}: {
    feature: ServiceAttribute;
    seoTiers: ServiceTier[];
    matrix: Record<string, number[]>;
    onToggleCell: (featureId: string, tierLevel: number) => void;
    onEdit: (f: ServiceAttribute) => void;
    onDelete: (f: ServiceAttribute) => void;
    expandedCategories: Set<string>;
    toggleCategory: (cat: string) => void;
}) {
    const catStyle = SEO_CATEGORY_STYLES[feature.categoryVi] ?? SEO_CATEGORY_STYLES["Khác"];
    const isCatOpen = expandedCategories.has(feature.categoryVi);

    return (
        <tr style={{ borderBottom: `1px solid ${DS.border}22` }}>
            {/* Feature name + category */}
            <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    {/* Category toggle */}
                    <button
                        onClick={() => toggleCategory(feature.categoryVi)}
                        style={{
                            background: catStyle.bg,
                            border: `1px solid ${catStyle.border}`,
                            borderRadius: 4,
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                            marginTop: 2,
                        }}
                    >
                        <Layers size={10} style={{ color: catStyle.color }} />
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {feature.nameVi}
                        </p>
                        {feature.descriptionVi && (
                            <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.5, marginBottom: 4 }}>
                                {feature.descriptionVi}
                            </p>
                        )}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {/* Category badge */}
                            <span
                                style={{
                                    background: catStyle.bg,
                                    border: `1px solid ${catStyle.border}`,
                                    color: catStyle.color,
                                    fontSize: 10,
                                    fontFamily: DS.mono,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                }}
                            >
                                {feature.categoryVi}
                            </span>
                            {/* Video badge */}
                            {feature.videoUrl && (
                                <span
                                    style={{
                                        background: "rgba(139,92,246,0.1)",
                                        border: "1px solid rgba(139,92,246,0.25)",
                                        color: "#8B5CF6",
                                        fontSize: 10,
                                        fontFamily: DS.mono,
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                    }}
                                >
                                    <Video size={10} /> Video
                                </span>
                            )}
                            {/* Price */}
                            {feature.price > 0 && (
                                <span
                                    style={{
                                        color: DS.text4,
                                        fontSize: 11,
                                        fontFamily: DS.mono,
                                    }}
                                >
                                    +{fmtVND(feature.price)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* Matrix cells — one per tier */}
            {seoTiers.map((tier) => (
                <MatrixCell
                    key={tier.id}
                    checked={(matrix[feature.id] ?? []).includes(tier.level)}
                    tierColor={SEO_TIER_COLORS[tier.level] ?? DS.blue}
                    onToggle={() => onToggleCell(feature.id, tier.level)}
                />
            ))}

            {/* Actions */}
            <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", gap: 4 }}>
                    <button
                        onClick={() => onEdit(feature)}
                        style={{
                            background: `${catStyle.color}10`,
                            border: `1px solid ${catStyle.color}30`,
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: catStyle.color,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={() => onDelete(feature)}
                        style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: DS.red,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteModal({
    feature,
    onClose,
    onDeleted,
}: {
    feature: ServiceAttribute;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const qc = useQueryClient();
    const del = useMutation({
        mutationFn: async () => {
            await adminApi.delete("/api/admin/custom-features", { params: { id: feature.id } });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk.adminSeoFeatures() });
            onDeleted();
        },
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: DS.bgCard3,
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 16,
                    padding: 24,
                    width: "100%",
                    maxWidth: 400,
                }}
            >
                <h3 style={{ color: DS.red, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                    Xóa Tính Năng?
                </h3>
                <p style={{ color: DS.text3, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                    Bạn đang xóa tính năng <strong style={{ color: DS.text }}>{feature.nameVi}</strong>.
                    Hành động này không thể hoàn tác.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => del.mutate()}
                        disabled={del.isPending}
                        style={{
                            flex: 1,
                            padding: "10px",
                            background: "rgba(239,68,68,0.15)",
                            color: DS.red,
                            border: "1px solid rgba(239,68,68,0.4)",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 700,
                        }}
                    >
                        {del.isPending ? "Đang xóa..." : "Xóa"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 16px",
                            background: "transparent",
                            border: `1px solid ${DS.border}`,
                            color: DS.text3,
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        Hủy
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SEOPackageFeaturesTab() {
    useAdminTranslations();
    const qc = useQueryClient();

    // State
    const [editFeature, setEditFeature] = useState<ServiceAttribute | null | undefined>(undefined);
    const [deleteFeature, setDeleteFeature] = useState<ServiceAttribute | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(Object.keys(SEO_CATEGORY_STYLES))
    );

    // Fetch SEO tiers
    const { data: tiersData, isLoading: tiersLoading } = useQuery({
        queryKey: qk.adminServiceTiers(),
        queryFn: async () => {
            const res = await adminApi.get<{ data: ServiceTier[] }>("/api/admin/service-tiers");
            return res;
        },
    });

    // Fetch SEO features
    const { data: featuresData, isLoading: featuresLoading, isFetching } = useQuery({
        queryKey: qk.adminSeoFeatures(),
        queryFn: async () => {
            const res = await adminApi.get<{
                data: ServiceAttribute[];
                pagination: { page: number; limit: number; total: number };
            }>("/api/admin/custom-features", { params: { isActive: undefined } });
            return res;
        },
    });

    const allTiers = tiersData?.data ?? [];
    const seoTiers = allTiers
        .filter((t) => t.serviceKey === SEO_SERVICE_KEY && t.isActive)
        .sort((a, b) => a.level - b.level);

    const allFeatures = featuresData?.data ?? [];

    // Filter: SEO only
    const seoFeatures = allFeatures.filter(
        (f) => f.serviceKey === SEO_SERVICE_KEY || !f.serviceKey
    );

    // Search filter
    const filteredFeatures = seoFeatures.filter((f) => {
        if (!showInactive && !f.isActive) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                f.nameVi.toLowerCase().includes(q) ||
                (f.nameEn?.toLowerCase().includes(q)) ||
                f.categoryVi.toLowerCase().includes(q) ||
                (f.descriptionVi?.toLowerCase().includes(q))
            );
        }
        return true;
    });

    // Group by category
    const featuresByCategory = useMemo(() => {
        const map: Record<string, ServiceAttribute[]> = {};
        for (const f of filteredFeatures) {
            const cat = f.categoryVi || "Khác";
            if (!map[cat]) map[cat] = [];
            map[cat].push(f);
        }
        // Sort each category by sortOrder
        for (const cat of Object.keys(map)) {
            map[cat].sort((a, b) => a.sortOrder - b.sortOrder);
        }
        return map;
    }, [filteredFeatures]);

    const categories = Object.keys(featuresByCategory).sort((a, b) => {
        const order = Object.keys(SEO_CATEGORY_STYLES);
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.localeCompare(b);
    });

    // Matrix: { featureId: number[] } — tier levels this feature is included in
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [matrix, setMatrix] = useState<Record<string, number[]>>(getStoredMatrix());
    function getStoredMatrix(): Record<string, number[]> {
        if (typeof window === "undefined") return {};
        try {
            const raw = localStorage.getItem("seo-feature-matrix");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    const saveMatrixMutation = useMutation({
        mutationFn: async (next: Record<string, number[]>) => {
            await adminApi.post("/api/admin/seo-feature-matrix", { matrix: next });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "seo-feature-matrix"] });
        },
    });

    const saveMatrix = (next: Record<string, number[]>) => {
        setMatrix(next);
        if (typeof window !== "undefined") {
            localStorage.setItem("seo-feature-matrix", JSON.stringify(next));
        }
        saveMatrixMutation.mutate(next);
    };

    const toggleCell = (featureId: string, tierLevel: number) => {
        const current = matrix[featureId] ?? [];
        const has = current.includes(tierLevel);
        const next = {
            ...matrix,
            [featureId]: has
                ? current.filter(t => t !== tierLevel)
                : [...current, tierLevel].sort((a, b) => a - b),
        };
        saveMatrix(next);
    };

    const toggleCategory = (cat: string) => {
        const next = new Set(expandedCategories);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        setExpandedCategories(next);
    };

    // Matrix summary
    const matrixSummary = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const tier of seoTiers) {
            counts[tier.level] = 0;
        }
        for (const f of seoFeatures) {
            const tiers = matrix[f.id] ?? [];
            for (const tier of seoTiers) {
                if (tiers.includes(tier.level)) counts[tier.level]++;
            }
        }
        return counts;
    }, [matrix, seoFeatures, seoTiers]);

    const totalFeatures = seoFeatures.length;
    const activeFeatures = seoFeatures.filter((f) => f.isActive).length;

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>
                        🔍 Tính Năng SEO — Ma Trận Gói
                    </h2>
                    <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                        {activeFeatures}/{totalFeatures} tính năng hoạt động · Click checkbox để tích gói có tính năng
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        background: GRD.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                    }}
                >
                    <Plus size={14} /> Thêm Tính Năng
                </button>
            </div>

            {/* SEO Tier Summary Cards */}
            {seoTiers.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${seoTiers.length}, 1fr)`, gap: 8, marginBottom: 16 }}>
                    {seoTiers.map((tier) => (
                        <div
                            key={tier.id}
                            style={{
                                background: DS.bgCard,
                                border: `1px solid ${SEO_TIER_COLORS[tier.level]}30`,
                                borderRadius: 10,
                                padding: "12px 14px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: SEO_TIER_COLORS[tier.level],
                                    }}
                                />
                                <span
                                    style={{
                                        color: SEO_TIER_COLORS[tier.level],
                                        fontSize: 11,
                                        fontFamily: DS.mono,
                                        fontWeight: 700,
                                    }}
                                >
                                    {SEO_TIER_LABELS[tier.level]}
                                </span>
                            </div>
                            <p style={{ color: DS.text, fontSize: 22, fontWeight: 800, fontFamily: DS.heading }}>
                                {matrixSummary[tier.level] ?? 0}
                            </p>
                            <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                                tính năng
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Search + Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: DS.text4,
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tính năng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            background: DS.bgCard,
                            border: `1px solid ${DS.border}`,
                            borderRadius: 10,
                            padding: "8px 12px 8px 36px",
                            color: DS.text,
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                            fontFamily: DS.body,
                        }}
                    />
                </div>
                <button
                    onClick={() => qc.invalidateQueries({ queryKey: qk.adminSeoFeatures() })}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        background: DS.bgCard,
                        border: `1px solid ${DS.border}`,
                        borderRadius: 10,
                        color: DS.text3,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: DS.mono,
                    }}
                >
                    <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                </button>
                <button
                    onClick={() => setShowInactive(!showInactive)}
                    style={{
                        padding: "8px 14px",
                        background: showInactive ? "rgba(230,199,95,0.1)" : DS.bgCard,
                        border: `1px solid ${showInactive ? "rgba(230,199,95,0.3)" : DS.border}`,
                        borderRadius: 10,
                        color: showInactive ? "#E6C75F" : DS.text3,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: DS.mono,
                    }}
                >
                    {showInactive ? "Ẩn inactive" : "Hiện inactive"}
                </button>
            </div>

            {/* Legend */}
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 12,
                    padding: "8px 14px",
                    background: DS.bgCard,
                    borderRadius: 8,
                    border: `1px solid ${DS.border}`,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={12} style={{ color: SEO_TIER_COLORS[1] }} strokeWidth={3} />
                    <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        = Tính năng có trong gói
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: DS.text5, fontSize: 14, fontFamily: DS.mono }}>—</span>
                    <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        = Không có trong gói
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Video size={12} style={{ color: "#8B5CF6" }} />
                    <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        = Có video hướng dẫn
                    </span>
                </div>
            </div>

            {/* Loading */}
            {featuresLoading && (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            border: `2px solid ${DS.border}`,
                            borderTop: `2px solid ${SEO_TIER_COLORS[1]}`,
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }}
                    />
                </div>
            )}

            {/* Empty state */}
            {!featuresLoading && seoFeatures.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: DS.text4,
                        background: DS.bgCard,
                        borderRadius: 12,
                        border: `1px solid ${DS.border}`,
                    }}
                >
                    <Layers size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                    <p style={{ fontSize: 14, marginBottom: 4 }}>Chưa có tính năng SEO nào</p>
                    <p style={{ fontSize: 12, fontFamily: DS.mono }}>
                        Nhấn "Thêm Tính Năng" để bắt đầu
                    </p>
                </div>
            )}

            {/* Matrix Table */}
            {!featuresLoading && categories.length > 0 && seoTiers.length > 0 && (
                <div
                    style={{
                        background: DS.bgCard,
                        border: `1px solid ${DS.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                    }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: 600,
                            }}
                        >
                            {/* Sticky Header */}
                            <thead>
                                <tr style={{ background: DS.bg }}>
                                    {/* Feature column header */}
                                    <th
                                        style={{
                                            padding: "10px 14px",
                                            textAlign: "left",
                                            borderBottom: `1px solid ${DS.border}`,
                                            position: "sticky",
                                            top: 0,
                                            background: DS.bg,
                                            zIndex: 2,
                                        }}
                                    >
                                        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                                            TÍNH NĂNG
                                        </span>
                                    </th>

                                    {/* Tier column headers */}
                                    {seoTiers.map((tier) => (
                                        <th
                                            key={tier.id}
                                            style={{
                                                padding: "10px 6px",
                                                textAlign: "center",
                                                borderBottom: `1px solid ${DS.border}`,
                                                minWidth: 80,
                                                position: "sticky",
                                                top: 0,
                                                background: DS.bg,
                                                zIndex: 2,
                                            }}
                                        >
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                                <div
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: SEO_TIER_COLORS[tier.level],
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        color: SEO_TIER_COLORS[tier.level],
                                                        fontSize: 10,
                                                        fontFamily: DS.mono,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.05em",
                                                    }}
                                                >
                                                    {SEO_TIER_LABELS[tier.level].toUpperCase()}
                                                </span>
                                                <span
                                                    style={{
                                                        color: DS.text5,
                                                        fontSize: 9,
                                                        fontFamily: DS.mono,
                                                    }}
                                                >
                                                    {fmtVND(tier.basePrice)}
                                                </span>
                                            </div>
                                        </th>
                                    ))}

                                    <th
                                        style={{
                                            padding: "10px 10px",
                                            textAlign: "center",
                                            borderBottom: `1px solid ${DS.border}`,
                                            width: 80,
                                            position: "sticky",
                                            top: 0,
                                            background: DS.bg,
                                            zIndex: 2,
                                        }}
                                    >
                                        <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
                                            THAO TÁC
                                        </span>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {categories.map((cat) => {
                                    const features = featuresByCategory[cat];
                                    const catStyle = SEO_CATEGORY_STYLES[cat] ?? SEO_CATEGORY_STYLES["Khác"];
                                    const isOpen = expandedCategories.has(cat);

                                    return (
                                        <>
                                            {/* Category header row */}
                                            <tr
                                                onClick={() => toggleCategory(cat)}
                                                style={{
                                                    cursor: "pointer",
                                                    background: `${catStyle.bg}20`,
                                                    borderTop: `2px solid ${catStyle.border}40`,
                                                }}
                                            >
                                                <td
                                                    colSpan={seoTiers.length + 2}
                                                    style={{ padding: "8px 14px" }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <Layers size={13} style={{ color: catStyle.color }} />
                                                        <span
                                                            style={{
                                                                color: catStyle.color,
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                fontFamily: DS.mono,
                                                                letterSpacing: "0.05em",
                                                            }}
                                                        >
                                                            {cat.toUpperCase()}
                                                        </span>
                                                        <span
                                                            style={{
                                                                background: catStyle.bg,
                                                                border: `1px solid ${catStyle.border}`,
                                                                color: catStyle.color,
                                                                fontSize: 10,
                                                                fontFamily: DS.mono,
                                                                padding: "1px 6px",
                                                                borderRadius: 4,
                                                            }}
                                                        >
                                                            {features.length} tính năng
                                                        </span>
                                                        <span style={{ marginLeft: "auto", color: DS.text4 }}>
                                                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Feature rows */}
                                            {isOpen &&
                                                features.map((feature) => (
                                                    <FeatureRow
                                                        key={feature.id}
                                                        feature={feature}
                                                        seoTiers={seoTiers}
                                                        matrix={matrix}
                                                        onToggleCell={toggleCell}
                                                        onEdit={setEditFeature}
                                                        onDelete={setDeleteFeature}
                                                        expandedCategories={expandedCategories}
                                                        toggleCategory={toggleCategory}
                                                    />
                                                ))}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Hint */}
            <div
                style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: `${DS.gold}08`,
                    border: `1px solid ${DS.gold}20`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <Info size={13} style={{ color: DS.gold, flexShrink: 0 }} />
                <p style={{ color: DS.text3, fontSize: 11, lineHeight: 1.5 }}>
                    <strong style={{ color: DS.text }}>Mẹo:</strong> Ma trận checkbox được lưu tạm trong trình duyệt.
                    Kết nối API để lưu permanent vào database và hiển thị trên trang công khai.
                </p>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showCreate && (
                    <FeatureModal
                        seoTiers={seoTiers}
                        onClose={() => setShowCreate(false)}
                        onSaved={() => setShowCreate(false)}
                    />
                )}
                {editFeature !== undefined && (
                    <FeatureModal
                        feature={editFeature}
                        seoTiers={seoTiers}
                        onClose={() => setEditFeature(undefined)}
                        onSaved={() => setEditFeature(undefined)}
                    />
                )}
                {deleteFeature && (
                    <DeleteModal
                        feature={deleteFeature}
                        onClose={() => setDeleteFeature(null)}
                        onDeleted={() => setDeleteFeature(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
