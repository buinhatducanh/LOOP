"use client";

/**
 * Acknowledgments Tab — Admin Pricing
 * Route: /admin/pricing (tab: acknowledgments)
 *
 * CRUD acknowledgment items + video URL cho 4 goi web cu the.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
 CheckSquare, Video, ExternalLink, Plus, Trash2, Save,
 Loader2, RotateCcw, Globe, AlertCircle,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type AckItem = {
 key: string;
 ackLabel: string;
 ackLabelEn?: string;
 icon?: string;
 sortOrder?: number;
};

type PackageData = {
 id: string;
 slug: string;
 title: string;
 videoUrl?: string | null;
 videoThumbnail?: string | null;
 showFeatureAcknowledge: boolean;
 acknowledgmentItems: AckItem[];
 features: string[];
};

const WEB_PACKAGES = [
 { slug: "landing", name: "Landing Page", color: "#6EB1A8" },
 { slug: "ban-hang", name: "Bán Hàng Cơ Bản", color: "#4F7DF3" },
 { slug: "doanh-nghiep", name: "Quản Trị Doanh Nghiệp", color: "#8B5CF6" },
 { slug: "yeu-cau", name: "Thiết Kế Theo Yêu Cầu", color: "#EC4899" },
];

// Icons cho chon trong acknowledgment
const ICON_OPTIONS = [
 { value: "CheckCircle2", label: "✓ Check" },
 { value: "Smartphone", label: "📱 Mobile" },
 { value: "Sparkles", label: "✨ Sparkle" },
 { value: "Edit3", label: "✏️ Edit" },
 { value: "Package", label: "📦 Package" },
 { value: "LayoutDashboard", label: "📋 Dashboard" },
 { value: "FileText", label: "📄 File" },
 { value: "Shield", label: "🛡️ Shield" },
 { value: "Search", label: "🔍 Search" },
 { value: "ShoppingBag", label: "🛍️ Cart" },
 { value: "ShoppingCart", label: "🛒 Cart" },
 { value: "BarChart3", label: "📊 Chart" },
 { value: "Users", label: "👥 Users" },
 { value: "Gift", label: "🎁 Gift" },
 { value: "Layers", label: "📚 Layers" },
 { value: "Palette", label: "🎨 Palette" },
 { value: "Tag", label: "🏷️ Tag" },
 { value: "Star", label: "⭐ Star" },
 { value: "Filter", label: "🔽 Filter" },
 { value: "Warehouse", label: "🏭 Warehouse" },
 { value: "Code2", label: "💻 Code" },
 { value: "CreditCard", label: "💳 Card" },
 { value: "Plug", label: "🔌 Plug" },
 { value: "ShieldCheck", label: "✅ Secure" },
];

// ── API helpers ────────────────────────────────────────────────────────────────

async function fetchPackage(slug: string): Promise<PackageData> {
 return adminApi.get<PackageData>(
 `/api/admin/pricing/acknowledgments?packageSlug=${slug}`
 );
}

async function updatePackage(data: {
 packageSlug: string;
 videoUrl?: string | null;
 videoThumbnail?: string | null;
 showFeatureAcknowledge: boolean;
 acknowledgmentItems: AckItem[];
}): Promise<PackageData> {
 return adminApi.put<PackageData>(
 "/api/admin/pricing/acknowledgments",
 data
 );
}

async function seedAcknowledgments(): Promise<void> {
 await adminApi.post("/api/pricing/seed-acknowledgments", {});
}

// ── Main Tab Component ────────────────────────────────────────────────────────

export function AcknowledgmentsTab() {
 const qc = useQueryClient();
 const [selectedSlug, setSelectedSlug] = useState("landing");

 // Form state
 const [videoUrl, setVideoUrl] = useState("");
 const [videoThumbnail, setVideoThumbnail] = useState("");
 const [showAck, setShowAck] = useState(true);
 const [ackItems, setAckItems] = useState<AckItem[]>([]);
 const [saving, setSaving] = useState(false);
 const [seedLoading, setSeedLoading] = useState(false);
 const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

 // Load package data
 const { data: pkg, isLoading, refetch } = useQuery({
 queryKey: ["admin", "pricing", "acknowledgments", selectedSlug],
 queryFn: () => fetchPackage(selectedSlug),
 enabled: !!selectedSlug,
 });

 // Sync form state when package data loads
 useEffect(() => {
 if (pkg) {
 setVideoUrl(pkg.videoUrl ?? "");
 setVideoThumbnail(pkg.videoThumbnail ?? "");
 setShowAck(pkg.showFeatureAcknowledge);
 setAckItems(pkg.acknowledgmentItems ?? []);
 }
 }, [pkg]);

 // Switch package → refetch
 useEffect(() => {
 refetch();
 setStatusMsg(null);
 }, [selectedSlug]);

 const selectedPkgMeta = WEB_PACKAGES.find(p => p.slug === selectedSlug)!;

 // Handle save
 const handleSave = async () => {
 setSaving(true);
 setStatusMsg(null);
 try {
 await updatePackage({
 packageSlug: selectedSlug,
 videoUrl: videoUrl || null,
 videoThumbnail: videoThumbnail || null,
 showFeatureAcknowledge: showAck,
 acknowledgmentItems: ackItems,
 });
 await refetch();
 setStatusMsg({ type: "success", text: "Lưu thành công!" });
 } catch {
 setStatusMsg({ type: "error", text: "Lưu thất bại. Thử lại." });
 } finally {
 setSaving(false);
 }
 };

 // Handle seed
 const handleSeed = async () => {
 if (!confirm("Seed sẽ ghi đè acknowledgment hiện tại. Tiếp tục?")) return;
 setSeedLoading(true);
 try {
 await seedAcknowledgments();
 await refetch();
 setStatusMsg({ type: "success", text: "Seed thành công! 4 gói đã có data." });
 } catch {
 setStatusMsg({ type: "error", text: "Seed thất bại." });
 } finally {
 setSeedLoading(false);
 }
 };

 // Delete ack item
 const deleteAck = (key: string) => {
 setAckItems(prev => prev.filter(a => a.key !== key));
 };

 // Update ack item
 const updateAck = (key: string, field: keyof AckItem, value: string) => {
 setAckItems(prev => prev.map(a => a.key === key ? { ...a, [field]: value } : a));
 };

 // Add new ack item manually
 const [newKey, setNewKey] = useState("");
 const [newAckLabel, setNewAckLabel] = useState("");
 const [newAckLabelEn, setNewAckLabelEn] = useState("");
 const [newIcon, setNewIcon] = useState("CheckCircle2");
 const [showAddForm, setShowAddForm] = useState(false);

 const addAckItem = () => {
 if (!newKey.trim()) return;
 if (ackItems.some(a => a.key === newKey.trim())) {
 setStatusMsg({ type: "error", text: "Feature này đã có trong danh sách." });
 return;
 }
 const newItem: AckItem = {
 key: newKey.trim(),
 ackLabel: newAckLabel.trim() || newKey.trim(),
 ackLabelEn: newAckLabelEn.trim() || undefined,
 icon: newIcon,
 sortOrder: ackItems.length + 1,
 };
 setAckItems(prev => [...prev, newItem]);
 setNewKey("");
 setNewAckLabel("");
 setNewAckLabelEn("");
 setNewIcon("CheckCircle2");
 setShowAddForm(false);
 };

 // Check if a feature from package.features[] is already mapped
 const mappedKeys = new Set(ackItems.map(a => a.key));
 const unmappedFeatures = (pkg?.features ?? []).filter(f => !mappedKeys.has(f));

 return (
 <div>
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-xl font-bold" style={{ color: DS.text }}>
 Quản lý Tính năng & Acknowledgment
 </h2>
 <p className="text-sm mt-1" style={{ color: DS.text4 }}>
 Mo ta chi tiet tinh nang cho khach hang non-tech + Video YouTube
 </p>
 </div>
 <button
 onClick={handleSeed}
 disabled={seedLoading}
 className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
 style={{
 background: "rgba(79,125,243,0.15)",
 border: `1px solid rgba(79,125,243,0.3)`,
 color: "#4F7DF3",
 }}
 >
 {seedLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
 Seed Data
 </button>
 </div>

 {/* Package Selector */}
 <div className="flex gap-2 mb-6 flex-wrap">
 {WEB_PACKAGES.map(p => (
 <button
 key={p.slug}
 onClick={() => setSelectedSlug(p.slug)}
 className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
 style={{
 background: selectedSlug === p.slug ? `${p.color}20` : "rgba(255,255,255,0.04)",
 border: `1px solid ${selectedSlug === p.slug ? p.color : "rgba(255,255,255,0.08)"}`,
 color: selectedSlug === p.slug ? p.color : DS.text3,
 }}
 >
 {p.name}
 </button>
 ))}
 </div>

 {/* Status message */}
 {statusMsg && (
 <motion.div
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
 style={{
 background: statusMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
 border: `1px solid ${statusMsg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
 color: statusMsg.type === "success" ? "#4ade80" : "#f87171",
 }}
 >
 <AlertCircle size={14} />
 {statusMsg.text}
 </motion.div>
 )}

 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 size={24} className="animate-spin" style={{ color: DS.text4 }} />
 </div>
 ) : (
 <div className="space-y-6">
 {/* Video Section */}
 <div className="rounded-xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
 <div className="flex items-center gap-2 mb-4">
 <Video size={16} style={{ color: "#EC4899" }} />
 <h3 className="text-sm font-semibold" style={{ color: DS.text }}>Video YouTube</h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-xs font-medium mb-1 block" style={{ color: DS.text3 }}>
 Video URL (YouTube)
 </label>
 <input
 type="url"
 value={videoUrl}
 onChange={e => setVideoUrl(e.target.value)}
 placeholder="https://www.youtube.com/watch?v=..."
 className="w-full px-3 py-2 rounded-lg text-sm"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: `1px solid ${DS.border}`,
 color: DS.text,
 outline: "none",
 }}
 />
 <p className="text-xs mt-1" style={{ color: DS.text5 }}>
 Copy URL tu YouTube (video gioi thieu goi dich vu)
 </p>
 </div>
 <div>
 <label className="text-xs font-medium mb-1 block" style={{ color: DS.text3 }}>
 Video Thumbnail URL (optional)
 </label>
 <input
 type="url"
 value={videoThumbnail}
 onChange={e => setVideoThumbnail(e.target.value)}
 placeholder="https://img.youtube.com/..."
 className="w-full px-3 py-2 rounded-lg text-sm"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: `1px solid ${DS.border}`,
 color: DS.text,
 outline: "none",
 }}
 />
 <p className="text-xs mt-1" style={{ color: DS.text5 }}>
 Neu de trong, tu dong lay thumbnail tu YouTube
 </p>
 </div>
 </div>

 {/* Video Preview */}
 {videoUrl && (
 <div className="mt-4 rounded-lg overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
 <div style={{
 position: "relative",
 paddingBottom: "56.25%",
 background: "#000",
 }}>
 <iframe
 width="100%"
 height="100%"
 style={{ position: "absolute", top: 0, left: 0 }}
 src={`https://www.youtube.com/embed/${extractYtId(videoUrl)}`}
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 title="Package Video"
 />
 </div>
 </div>
 )}
 </div>

 {/* Toggle & Feature List Section */}
 <div className="rounded-xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <CheckSquare size={16} style={{ color: "#4F7DF3" }} />
 <h3 className="text-sm font-semibold" style={{ color: DS.text }}>Acknowledgment Features</h3>
 </div>
 <label className="flex items-center gap-2 cursor-pointer">
 <div
 className="relative inline-block w-10 h-5 rounded-full transition-all"
 style={{ background: showAck ? "#4F7DF3" : "rgba(255,255,255,0.1)" }}
 onClick={() => setShowAck(!showAck)}
 >
 <div
 className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
 style={{ left: showAck ? "20px" : "2px" }}
 />
 </div>
 <span className="text-xs" style={{ color: DS.text3 }}>
 Hien thi modal acknowledgment
 </span>
 </label>
 </div>

 {/* Feature source info */}
 <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: "rgba(79,125,243,0.08)", color: DS.text3 }}>
 <strong>Package features ({pkg?.features?.length ?? 0}):</strong> tu dong lay tu ServicePackage.features[].
 Acknowledgment mo ta non-tech cho tung feature o duoi.
 </div>

 {/* Acknowledgment List */}
 <div className="space-y-2">
 {ackItems.length === 0 && !showAddForm && (
 <div className="text-center py-8 text-sm" style={{ color: DS.text5 }}>
 Chua co acknowledgment nao. Nhan "Seed Data" de tu dong tao, hoac "Them moi".
 </div>
 )}

 {ackItems.map((item, idx) => (
 <div
 key={item.key}
 className="rounded-lg p-3 transition-all"
 style={{
 background: "rgba(255,255,255,0.02)",
 border: "1px solid rgba(255,255,255,0.06)",
 }}
 >
 <div className="flex items-start gap-2">
 <div className="flex-1 min-w-0">
 <div className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: selectedPkgMeta.color }}>
 <span>{getIconEmoji(item.icon)}</span>
 <span className="truncate">{item.key}</span>
 </div>
 <div className="space-y-1.5">
 <div>
 <label className="text-xs mb-0.5 block" style={{ color: DS.text5 }}>Mo ta (VI)</label>
 <textarea
 value={item.ackLabel}
 onChange={e => updateAck(item.key, "ackLabel", e.target.value)}
 rows={2}
 className="w-full px-2 py-1.5 rounded text-xs resize-none"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: `1px solid ${DS.border}`,
 color: DS.text,
 outline: "none",
 }}
 placeholder="Mo ta non-tech, giup khach hieu..."
 />
 </div>
 <div>
 <label className="text-xs mb-0.5 block" style={{ color: DS.text5 }}>Mo ta (EN)</label>
 <input
 type="text"
 value={item.ackLabelEn ?? ""}
 onChange={e => updateAck(item.key, "ackLabelEn", e.target.value)}
 className="w-full px-2 py-1.5 rounded text-xs"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: `1px solid ${DS.border}`,
 color: DS.text,
 outline: "none",
 }}
 placeholder="English description (optional)"
 />
 </div>
 <div>
 <label className="text-xs mb-0.5 block" style={{ color: DS.text5 }}>Icon</label>
 <select
 value={item.icon ?? "CheckCircle2"}
 onChange={e => updateAck(item.key, "icon", e.target.value)}
 className="px-2 py-1.5 rounded text-xs"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: `1px solid ${DS.border}`,
 color: DS.text,
 outline: "none",
 }}
 >
 {ICON_OPTIONS.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 </div>
 </div>
 </div>
 <button
 onClick={() => deleteAck(item.key)}
 className="flex-shrink-0 p-1.5 rounded transition-all mt-1"
 style={{ color: "rgba(239,68,68,0.5)" }}
 title="Xoa acknowledgment"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 ))}

 {/* Add new acknowledgment */}
 {showAddForm ? (
 <div className="rounded-lg p-4 space-y-3" style={{ background: "rgba(79,125,243,0.05)", border: "1px dashed rgba(79,125,243,0.3)" }}>
 <div className="text-xs font-medium" style={{ color: "#4F7DF3" }}>+ Them acknowledgment moi</div>
 <div>
 <label className="text-xs mb-0.5 block" style={{ color: DS.text5 }}>Feature Key</label>
 <input
 type="text"
 value={newKey}
 onChange={e => setNewKey(e.target.value)}
 className="w-full px-2 py-1.5 rounded text-xs"
 style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`, color: DS.text, outline: "none" }}
 placeholder="Ten feature (VD: Giao dien Responsive)"
 />
 </div>
 <div>
 <label className="text-xs mb-0.5 block" style={{ color: DS.text5 }}>Mo ta (VI)</label>
 <textarea
 value={newAckLabel}
 onChange={e => setNewAckLabel(e.target.value)}
 rows={2}
 className="w-full px-2 py-1.5 rounded text-xs resize-none"
 style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`, color: DS.text, outline: "none" }}
 placeholder="Mo ta non-tech..."
 />
 </div>
 <div>
 <label className="text-xs mb-0.5 block" style={{ color: DS.text5 }}>Mo ta (EN)</label>
 <input
 type="text"
 value={newAckLabelEn}
 onChange={e => setNewAckLabelEn(e.target.value)}
 className="w-full px-2 py-1.5 rounded text-xs"
 style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`, color: DS.text, outline: "none" }}
 placeholder="English description (optional)"
 />
 </div>
 <div className="flex gap-2">
 <button
 onClick={addAckItem}
 className="px-3 py-1.5 rounded text-xs font-medium"
 style={{ background: "#4F7DF3", color: "#fff" }}
 >
 Them
 </button>
 <button
 onClick={() => setShowAddForm(false)}
 className="px-3 py-1.5 rounded text-xs"
 style={{ background: "rgba(255,255,255,0.06)", color: DS.text3 }}
 >
 Huy
 </button>
 </div>
 </div>
 ) : (
 <button
 onClick={() => setShowAddForm(true)}
 className="w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
 style={{ background: "rgba(255,255,255,0.04)", border: `1px dashed rgba(255,255,255,0.1)`, color: DS.text3 }}
 >
 <Plus size={14} />
 Them acknowledgment moi
 </button>
 )}
 </div>

 {/* Unmapped features from package */}
 {unmappedFeatures.length > 0 && (
 <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
 <div className="text-xs font-medium mb-2" style={{ color: "#EAB308" }}>
 Features chua co acknowledgment:
 </div>
 <div className="flex flex-wrap gap-1">
 {unmappedFeatures.map(f => (
 <span
 key={f}
 className="text-xs px-2 py-0.5 rounded"
 style={{ background: "rgba(234,179,8,0.1)", color: "#EAB308" }}
 >
 {f}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Save Button */}
 <div className="flex justify-end">
 <button
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
 style={{
 background: saving ? "rgba(79,125,243,0.5)" : GRD.primary,
 backgroundImage: saving ? "none" : GRD.primary,
 color: "#fff",
 boxShadow: saving ? "none" : `0 0 20px rgba(79,125,243,0.3)`,
 }}
 >
 {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
 {saving ? "Dang luu..." : "Luu thay doi"}
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractYtId(url: string): string {
 const patterns = [
 /youtu\.be\/([a-zA-Z0-9_-]{11})/,
 /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
 /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
 /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
 ];
 for (const pattern of patterns) {
 const m = url.match(pattern);
 if (m) return m[1];
 }
 return "";
}

function getIconEmoji(icon?: string): string {
 const map: Record<string, string> = {
 CheckCircle2: "✓", Smartphone: "📱", Sparkles: "✨", Edit3: "✏️",
 Package: "📦", LayoutDashboard: "📋", FileText: "📄", Shield: "🛡️",
 Search: "🔍", ShoppingBag: "🛍️", ShoppingCart: "🛒", BarChart3: "📊",
 Users: "👥", Gift: "🎁", Layers: "📚", Palette: "🎨", Tag: "🏷️",
 Star: "⭐", Filter: "🔽", Warehouse: "🏭", Code2: "💻",
 CreditCard: "💳", Plug: "🔌", ShieldCheck: "✅",
 };
 return map[icon ?? ""] ?? "✓";
}

