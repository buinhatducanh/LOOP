"use client";

/**
 * PackageComparisonModal — Booking Wizard
 * Full-screen modal showing 4 web packages side-by-side with video + feature acknowledgments.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { X, Play, ChevronDown, ChevronUp, Check, Video } from "lucide-react";

interface PackageAcknowledgmentItem {
 key: string;
 ackLabel: string;
 ackLabelEn?: string;
 icon?: string;
 sortOrder?: number;
}

interface ModalPackage {
 id: string;
 slug?: string;
 name: string;
 multiplier: number;
 color: string;
 desc: string;
 features: string[];
 lp: number;
 popular?: boolean;
 price?: number | null;
 priceText?: string;
 marketPrice?: number;
 savingPct?: number;
 videoUrl?: string | null;
 videoThumbnail?: string | null;
 showFeatureAcknowledge?: boolean;
 acknowledgmentItems?: PackageAcknowledgmentItem[];
 /** Map: feature label → acknowledgment item */
 featureAcknowledgments?: Record<string, PackageAcknowledgmentItem>;
}

interface PackageComparisonModalProps {
 packages: ModalPackage[];
 currentPackageId: string;
 onClose: () => void;
 onSelect: (packageId: string) => void;
 locale: string;
}

const WEB_PACKAGES_META = [
 { slug: "landing", label: "Landing Page" },
 { slug: "ban-hang", label: "Ban Hang Co Ban" },
 { slug: "doanh-nghiep", label: "Quan Tri Doanh Nghiep" },
 { slug: "yeu-cau", label: "Thiet Ke Theo Yeu Cau" },
];

const fmtVND = (n: number) =>
 new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

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

// Icon component mapping
function FeatureIcon({ name }: { name: string }) {
 const icons: Record<string, string> = {
 CheckCircle2: "✓", Smartphone: "📱", Sparkles: "✨", Edit3: "✏️",
 Package: "📦", LayoutDashboard: "📋", FileText: "📄", Shield: "🛡️",
 Search: "🔍", ShoppingBag: "🛍️", ShoppingCart: "🛒", BarChart3: "📊",
 Users: "👥", Gift: "🎁", Layers: "📚", Palette: "🎨", Tag: "🏷️",
 Star: "⭐", Filter: "🔽", Warehouse: "🏭", Code2: "💻",
 CreditCard: "💳", Plug: "🔌", ShieldCheck: "✅",
 };
 return <span style={{ fontSize: 14 }}>{icons[name] ?? "✓"}</span>;
}

export function PackageComparisonModal({
 packages,
 currentPackageId,
 onClose,
 onSelect,
 locale,
}: PackageComparisonModalProps) {
 const [activeTab, setActiveTab] = useState(
 () => packages.find(p => p.id === currentPackageId)?.slug ?? packages[0]?.slug ?? "landing"
 );
 const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
 const [showVideo, setShowVideo] = useState(false);
 const [isVi, setIsVi] = useState(true);

 const activePkg = packages.find(p => p.slug === activeTab) ?? packages[0];
 if (!activePkg) return null;

 const toggleFeature = (key: string) => {
 setExpandedFeatures(prev => {
 const next = new Set(prev);
 if (next.has(key)) next.delete(key);
 else next.add(key);
 return next;
 });
 };

 const handleSelect = () => {
 if (activePkg) onSelect(activePkg.id);
 };

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 onClick={onClose}
 style={{
 position: "fixed", inset: 0, zIndex: 100,
 background: "rgba(0,0,0,0.85)",
 backdropFilter: "blur(12px)",
 display: "flex", alignItems: "center", justifyContent: "center",
 padding: "16px",
 }}
 >
 <motion.div
 initial={{ scale: 0.92, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.92, opacity: 0 }}
 transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
 onClick={e => e.stopPropagation()}
 style={{
 background: DS.bg,
 border: `1px solid ${activePkg.color ?? DS.blue}30`,
 borderRadius: 24,
 width: "100%",
 maxWidth: 900,
 maxHeight: "90vh",
 overflow: "hidden",
 display: "flex",
 flexDirection: "column",
 boxShadow: `0 0 60px ${activePkg.color ?? DS.blue}20, 0 24px 80px rgba(0,0,0,0.6)`,
 position: "relative",
 }}
 >
 {/* ── Header ── */}
 <div style={{
 padding: "20px 24px 0",
 borderBottom: `1px solid ${DS.border}`,
 flexShrink: 0,
 }}>
 {/* Top row */}
 <div className="flex items-center justify-between mb-4">
 <div>
 <div style={{ color: activePkg.color ?? DS.blue, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 4 }}>
 CHI TIET GOI DICH VU
 </div>
 <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: "0.06em" }}>
 So sanh cac goi website
 </h2>
 </div>
 <div className="flex items-center gap-2">
 {/* Lang toggle */}
 <button
 onClick={() => setIsVi(!isVi)}
 style={{
 padding: "5px 12px", borderRadius: 8,
 background: "rgba(255,255,255,0.06)",
 border: `1px solid ${DS.border}`,
 color: DS.text3, fontSize: 11, fontFamily: DS.mono,
 cursor: "pointer",
 }}
 >
 {isVi ? "EN" : "VI"}
 </button>
 <button
 onClick={onClose}
 style={{
 width: 32, height: 32, borderRadius: "50%",
 background: "rgba(255,255,255,0.06)",
 border: `1px solid ${DS.border}`,
 color: DS.text3,
 cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center",
 }}
 >
 <X size={14} />
 </button>
 </div>
 </div>

 {/* Package tabs */}
 <div className="flex gap-2 pb-0 flex-wrap">
 {WEB_PACKAGES_META.map(meta => {
 const pkg = packages.find(p => p.slug === meta.slug);
 if (!pkg) return null;
 const isActive = activeTab === meta.slug;
 return (
 <button
 key={meta.slug}
 onClick={() => { setActiveTab(meta.slug); setExpandedFeatures(new Set()); setShowVideo(false); }}
 style={{
 padding: "8px 16px",
 borderRadius: "12px 12px 0 0",
 background: isActive ? `${pkg.color ?? DS.blue}15` : "transparent",
 border: `1px solid ${isActive ? pkg.color ?? DS.blue : "transparent"}`,
 borderBottom: `1px solid ${isActive ? DS.bg : "transparent"}`,
 color: isActive ? (pkg.color ?? DS.blue) : DS.text4,
 fontSize: 11, fontFamily: DS.mono, fontWeight: 700,
 cursor: "pointer",
 transition: "all 0.2s",
 letterSpacing: "0.05em",
 }}
 >
 {meta.label}
 </button>
 );
 })}
 </div>
 </div>

 {/* ── Scrollable Content ── */}
 <div style={{ overflowY: "auto", flex: 1, padding: "24px" }}>
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.2 }}
 >
 {/* Package hero */}
 <div style={{
 background: `linear-gradient(135deg, ${activePkg.color ?? DS.blue}0C, ${activePkg.color ?? DS.blue}05)`,
 border: `1px solid ${activePkg.color ?? DS.blue}25`,
 borderRadius: 20,
 padding: "24px",
 marginBottom: 20,
 position: "relative",
 overflow: "hidden",
 }}>
 <div style={{
 position: "absolute", top: -20, right: -20,
 width: 120, height: 120, borderRadius: "50%",
 background: `radial-gradient(circle, ${activePkg.color ?? DS.blue}10 0%, transparent 70%)`,
 pointerEvents: "none",
 }} />

 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div>
 <div style={{ color: activePkg.color ?? DS.blue, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 6 }}>
 {activePkg.popular ? "★ PHỔ BIẾN NHẤT" : "WEBSITE PACKAGE"}
 </div>
 <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginBottom: 4 }}>
 {activePkg.name}
 </h3>
 <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6, maxWidth: 400 }}>
 {activePkg.desc}
 </p>
 </div>

 <div className="text-left md:text-right">
 {activePkg.marketPrice && activePkg.marketPrice > (activePkg.price ?? 0) && (
 <div style={{ color: DS.text5, fontSize: 13, fontFamily: DS.mono, textDecoration: "line-through", marginBottom: 2 }}>
 {fmtVND(activePkg.marketPrice)}
 </div>
 )}
 <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 32, fontWeight: 900 }}>
 {fmtVND(activePkg.price ?? activePkg.marketPrice ?? 0)}
 </div>
 {activePkg.savingPct && activePkg.savingPct > 0 && (
 <div style={{
 display: "inline-block",
 background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
 color: DS.green, fontSize: 10, fontFamily: DS.mono,
 padding: "2px 8px", borderRadius: 8, marginTop: 4,
 }}>
 Tiết kiệm {activePkg.savingPct}%
 </div>
 )}
 </div>
 </div>
 </div>

 {/* ── Video Section ── */}
 {activePkg.videoUrl && (
 <div style={{ marginBottom: 20 }}>
 {showVideo ? (
 <div style={{
 borderRadius: 16, overflow: "hidden",
 border: `1px solid ${activePkg.color ?? DS.blue}25`,
 position: "relative",
 paddingBottom: "56.25%",
 background: "#000",
 }}>
 <iframe
 width="100%"
 height="100%"
 style={{ position: "absolute", top: 0, left: 0 }}
 src={`https://www.youtube.com/embed/${extractYtId(activePkg.videoUrl)}`}
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 title="Package Video"
 />
 </div>
 ) : (
 <button
 onClick={() => setShowVideo(true)}
 style={{
 width: "100%",
 borderRadius: 16, overflow: "hidden",
 border: `1px solid ${activePkg.color ?? DS.blue}25`,
 position: "relative",
 aspectRatio: "16/9",
 background: activePkg.videoThumbnail
 ? `url(${activePkg.videoThumbnail}) center/cover no-repeat`
 : `linear-gradient(135deg, ${activePkg.color ?? DS.blue}20, ${DS.bgDeep})`,
 cursor: "pointer",
 }}
 >
 {/* Play button overlay */}
 <div style={{
 position: "absolute", inset: 0,
 display: "flex", flexDirection: "column",
 alignItems: "center", justifyContent: "center",
 gap: 8,
 background: "rgba(0,0,0,0.45)",
 }}>
 <div style={{
 width: 60, height: 60, borderRadius: "50%",
 background: `${activePkg.color ?? DS.blue}`,
 display: "flex", alignItems: "center", justifyContent: "center",
 boxShadow: `0 0 30px ${activePkg.color ?? DS.blue}60`,
 }}>
 <Play size={24} style={{ color: "#fff", marginLeft: 3 }} fill="#fff" />
 </div>
 <div style={{ color: "#fff", fontSize: 13, fontFamily: DS.mono }}>
 Xem video huong dan
 </div>
 </div>
 {/* Close video button */}
 {showVideo && (
 <button
 onClick={e => { e.stopPropagation(); setShowVideo(false); }}
 style={{
 position: "absolute", top: 10, right: 10,
 width: 32, height: 32, borderRadius: "50%",
 background: "rgba(0,0,0,0.7)",
 border: "1px solid rgba(255,255,255,0.2)",
 color: "#fff", cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center",
 }}
 >
 <X size={12} />
 </button>
 )}
 </button>
 )}
 </div>
 )}

 {/* ── Features & Acknowledgments ── */}
 <div>
 <div className="flex items-center gap-2 mb-4">
 <div style={{ width: 3, height: 16, background: activePkg.color ?? DS.blue, borderRadius: 2 }} />
 <h4 style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.15em" }}>
 TÍNH NĂNG TRONG GOI NAY
 </h4>
 <div style={{ flex: 1, height: 1, background: DS.border }} />
 <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
 {activePkg.features.length} tinh nang
 </span>
 </div>

 <div className="space-y-2">
 {activePkg.features.map((feature, idx) => {
 const ack = activePkg.featureAcknowledgments?.[feature];
 const isExpanded = expandedFeatures.has(feature);

 return (
 <div
 key={idx}
 style={{
 borderRadius: 12,
 background: "rgba(255,255,255,0.02)",
 border: `1px solid ${isExpanded ? (activePkg.color ?? DS.blue) + "30" : "rgba(255,255,255,0.06)"}`,
 overflow: "hidden",
 transition: "all 0.2s",
 }}
 >
 {/* Feature row — always visible */}
 <button
 onClick={() => ack && toggleFeature(feature)}
 style={{
 width: "100%",
 display: "flex", alignItems: "center", gap: 12,
 padding: "12px 16px",
 background: "transparent", border: "none",
 cursor: ack ? "pointer" : "default",
 textAlign: "left",
 }}
 >
 {/* Checkmark */}
 <div style={{
 width: 24, height: 24, borderRadius: "50%",
 background: `${activePkg.color ?? DS.blue}15`,
 border: `1.5px solid ${activePkg.color ?? DS.blue}50`,
 display: "flex", alignItems: "center", justifyContent: "center",
 flexShrink: 0,
 }}>
 <Check size={11} style={{ color: activePkg.color ?? DS.blue }} />
 </div>

 {/* Feature name */}
 <span style={{ color: DS.text2, fontSize: 13, flex: 1 }}>
 {feature}
 </span>

 {/* Icon if ack */}
 {ack?.icon && (
 <span style={{ fontSize: 14, opacity: 0.7 }}>
 <FeatureIcon name={ack.icon} />
 </span>
 )}

 {/* Expand indicator */}
 {ack && (
 <div style={{ color: DS.text4 }}>
 {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
 </div>
 )}
 </button>

 {/* Acknowledgment — expandable */}
 {ack && isExpanded && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2 }}
 style={{
 padding: "0 16px 12px",
 borderTop: `1px solid rgba(255,255,255,0.06)"`,
 marginTop: -1,
 }}
 >
 <div style={{
 paddingTop: 10,
 display: "flex", alignItems: "flex-start", gap: 10,
 }}>
 <span style={{ fontSize: 16, marginTop: -2, flexShrink: 0 }}>
 <FeatureIcon name={ack.icon ?? "CheckCircle2"} />
 </span>
 <div>
 {isVi ? (
 <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
 {ack.ackLabel}
 </p>
 ) : (
 <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
 {ack.ackLabelEn ?? ack.ackLabel}
 </p>
 )}
 </div>
 </div>
 </motion.div>
 )}

 {/* No acknowledgment — show subtle hint */}
 {!ack && (
 <div style={{
 padding: "0 16px 10px",
 display: "flex", alignItems: "center", gap: 6,
 }}>
 <span style={{ color: DS.text5, fontSize: 10, fontStyle: "italic" }}>
 Khong co mo ta chi tiet
 </span>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>

 {/* ── LP reward ── */}
 {activePkg.lp > 0 && (
 <div style={{
 marginTop: 20,
 padding: "14px 18px",
 borderRadius: 14,
 background: `linear-gradient(135deg, ${DS.purple}10, ${DS.pink}05)`,
 border: `1px solid ${DS.purple}25`,
 display: "flex", alignItems: "center", gap: 10,
 }}>
 <svg width="18" height="18" viewBox="0 0 24 24" fill={DS.purple} stroke="none">
 <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
 </svg>
 <span style={{ color: DS.purple, fontSize: 13, fontFamily: DS.mono }}>
 Nhan <strong>+{activePkg.lp.toLocaleString()} LP</strong> khi hoan thanh du an
 </span>
 </div>
 )}
 </motion.div>
 </AnimatePresence>
 </div>

 {/* ── Footer CTA ── */}
 <div style={{
 padding: "16px 24px",
 borderTop: `1px solid ${DS.border}`,
 display: "flex", gap: 12, justifyContent: "flex-end",
 flexShrink: 0,
 }}>
 <button
 onClick={onClose}
 style={{
 padding: "10px 20px", borderRadius: 12,
 background: "rgba(255,255,255,0.04)",
 border: `1px solid ${DS.border}`,
 color: DS.text3, fontSize: 13, fontFamily: DS.mono,
 cursor: "pointer",
 }}
 >
 Dong
 </button>
 <button
 onClick={handleSelect}
 style={{
 padding: "10px 24px", borderRadius: 12,
 background: GRD.primary,
 border: "none",
 color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: DS.mono,
 cursor: "pointer",
 boxShadow: `0 0 20px ${DS.pink}40`,
 }}
 >
 Chon goi nay
 </button>
 </div>
 </motion.div>
 </motion.div>
 );
}
