"use client";

/**
 * WhyUsLandingSection — Why Choose Us + Process Steps (inline for landing page)
 * Compact design: 4-step process + mini comparison table
 */
import { motion } from "motion/react";
import {
 Zap, Target, Code2, TrendingUp,
 Star, CheckCircle2, XCircle, Minus,
} from "lucide-react";
import Link from "next/link";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const PROCESS_STEPS = [
 {
 icon: <Star size={20} />,
 color: DS.pink,
 step: "01",
 titleKey: "whyUsProcessStep1",
 descKey: "whyUsProcessDesc1",
 },
 {
 icon: <Target size={20} />,
 color: DS.cosmicPurple,
 step: "02",
 titleKey: "whyUsProcessStep2",
 descKey: "whyUsProcessDesc2",
 },
 {
 icon: <Code2 size={20} />,
 color: DS.cosmicBlue,
 step: "03",
 titleKey: "whyUsProcessStep3",
 descKey: "whyUsProcessDesc3",
 },
 {
 icon: <TrendingUp size={20} />,
 color: DS.green,
 step: "04",
 titleKey: "whyUsProcessStep4",
 descKey: "whyUsProcessDesc4",
 },
];

const COMPARISON_ROWS = [
 { feature: "whyUsCompareProfessional", loop: true, agency: true, freelancer: false },
 { feature: "whyUsCompareProcess", loop: true, agency: true, freelancer: false },
 { feature: "whyUsCompareWarranty", loop: true, agency: "partial", freelancer: false },
 { feature: "whyUsCompareLpReward", loop: true, agency: false, freelancer: false },
 { feature: "whyUsCompareFullTeam", loop: true, agency: true, freelancer: false },
 { feature: "whyUsCompareTimeline", loop: true, agency: "partial", freelancer: false },
 { feature: "whyUsCompareTransparent", loop: true, agency: false, freelancer: "partial" },
];

function CompareCell({ value, loop }: { value: boolean | string; loop?: boolean }) {
 if (value === true) {
 return (
 <div style={{ display: "flex", justifyContent: "center" }}>
 <CheckCircle2 size={18} style={{ color: loop ? DS.pink : DS.green }} />
 </div>
 );
 }
 if (value === "partial") {
 return (
 <div style={{ display: "flex", justifyContent: "center" }}>
 <Minus size={18} style={{ color: DS.amber }} />
 </div>
 );
 }
 return (
 <div style={{ display: "flex", justifyContent: "center" }}>
 <XCircle size={18} style={{ color: DS.red }} />
 </div>
 );
}

export function WhyUsLandingSection({ locale }: { locale: string }) {
 const t = useTranslations("home");

 return (
 <section
 style={{
 padding: "6rem 1.5rem",
 background: "linear-gradient(160deg, rgba(15,23,42,0.3) 0%, rgba(2,6,23,0.6) 100%)",
 position: "relative",
 overflow: "hidden",
 }}
 >
 {/* Top border line */}
 <div
 style={{
 position: "absolute", top: 0, left: 0, right: 0,
 height: "1px",
 background: `linear-gradient(90deg, transparent, ${DS.pink}30, transparent)`,
 }}
 />
 <div
 style={{
 position: "absolute", bottom: 0, left: 0, right: 0,
 height: "1px",
 background: `linear-gradient(90deg, transparent, ${DS.cosmicPurple}30, transparent)`,
 }}
 />

 <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
 {/* Section header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 style={{ textAlign: "center", marginBottom: "3.5rem" }}
 >
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "1rem",
 padding: "0.375rem 1rem",
 borderRadius: "9999px",
 background: `${DS.cosmicPurple}12`,
 border: `1px solid ${DS.cosmicPurple}30`,
 }}
 >
 <div
 style={{
 width: 6, height: 6, borderRadius: "50%",
 background: DS.cosmicPurple, boxShadow: `0 0 6px ${DS.cosmicPurple}`,
 }}
 />
 <span
 style={{
 color: DS.cosmicPurple,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.22em",
 }}
 >
 {t("whyUsBadge")}
 </span>
 </div>
 <h2
 style={{
 fontFamily: DS.heading,
 fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
 fontWeight: 900,
 letterSpacing: "0.04em",
 background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.cosmicPurple} 60%, ${DS.pink} 100%)`,
 WebkitBackgroundClip: "text",
 WebkitTextFillColor: "transparent",
 backgroundClip: "text",
 marginBottom: "0.875rem",
 }}
 >
 {t("whyUsTitle")}
 </h2>
 <p
 style={{
 color: DS.text3,
 fontSize: "0.9375rem",
 maxWidth: 520,
 margin: "0 auto",
 lineHeight: 1.8,
 }}
 >
 {t("whyUsDesc")}
 </p>
 </motion.div>

 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
 gap: "3rem",
 alignItems: "start",
 }}
 >
 {/* LEFT: Process Steps */}
 <div>
 <h3
 style={{
 color: DS.text2,
 fontFamily: DS.mono,
 fontSize: "0.6875rem",
 letterSpacing: "0.2em",
 marginBottom: "1.5rem",
 textTransform: "uppercase",
 }}
 >
 {t("whyUsProcessLabel") || "QUY TRÌNH 4 BƯỚC"}
 </h3>
 <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
 {PROCESS_STEPS.map((step, i) => (
 <motion.div
 key={step.step}
 initial={{ opacity: 0, x: -16 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1, duration: 0.4 }}
 style={{
 display: "flex",
 gap: "1rem",
 padding: "1rem 1.25rem",
 borderRadius: "1rem",
 background: `${step.color}08`,
 border: `1px solid ${step.color}20`,
 position: "relative",
 }}
 >
 {/* Icon */}
 <div
 style={{
 width: 40, height: 40, borderRadius: "0.625rem",
 display: "flex", alignItems: "center", justifyContent: "center",
 background: `${step.color}15`,
 border: `1px solid ${step.color}30`,
 flexShrink: 0,
 }}
 >
 <span style={{ color: step.color }}>{step.icon}</span>
 </div>
 <div style={{ flex: 1 }}>
 <div
 style={{
 display: "flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "0.25rem",
 }}
 >
 <span
 style={{
 color: step.color,
 fontSize: "0.5625rem",
 fontFamily: DS.mono,
 fontWeight: 700,
 letterSpacing: "0.12em",
 }}
 >
 {step.step}
 </span>
 <span
 style={{
 color: DS.text,
 fontSize: "0.875rem",
 fontWeight: 700,
 }}
 >
 {t(step.titleKey)}
 </span>
 </div>
 <p style={{ color: DS.text4, fontSize: "0.8125rem", lineHeight: 1.5 }}>
 {t(step.descKey)}
 </p>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 {/* RIGHT: Comparison Table */}
 <div>
 <h3
 style={{
 color: DS.text2,
 fontFamily: DS.mono,
 fontSize: "0.6875rem",
 letterSpacing: "0.2em",
 marginBottom: "1.5rem",
 textTransform: "uppercase",
 }}
 >
 {t("whyUsCompareTitle") || "LOOP VS ĐỐI THỦ"}
 </h3>
 <div
 style={{
 borderRadius: "1rem",
 background: "rgba(15,23,42,0.7)",
 border: `1px solid ${DS.border}`,
 backdropFilter: "blur(12px)",
 overflow: "hidden",
 }}
 >
 {/* Table header */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "1fr 80px 80px 80px",
 padding: "0.75rem 1rem",
 borderBottom: `1px solid ${DS.border}`,
 background: "rgba(30,40,60,0.3)",
 }}
 >
 {["", "LOOP", "Agency", "Freelance"].map((h) => (
 <div
 key={h}
 style={{
 textAlign: "center",
 fontSize: "0.5625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.1em",
 fontWeight: h === "LOOP" ? 700 : 400,
 color: h === "LOOP" ? DS.pink : DS.text4,
 }}
 >
 {h}
 </div>
 ))}
 </div>
 {COMPARISON_ROWS.map((row, i) => (
 <div
 key={row.feature}
 style={{
 display: "grid",
 gridTemplateColumns: "1fr 80px 80px 80px",
 padding: "0.75rem 1rem",
 borderBottom: i < COMPARISON_ROWS.length - 1 ? `1px solid ${DS.border}25` : "none",
 alignItems: "center",
 }}
 >
 <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.4 }}>
 {t(row.feature)}
 </div>
 <CompareCell value={row.loop} loop />
 <CompareCell value={row.agency} />
 <CompareCell value={row.freelancer} />
 </div>
 ))}
 </div>

 {/* CTA */}
 <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
 <Link
 href={`/${locale}/contact`}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 background: GRD.primary,
 color: "#fff",
 fontSize: "0.875rem",
 fontWeight: 600,
 padding: "0.625rem 1.5rem",
 borderRadius: "0.625rem",
 textDecoration: "none",
 boxShadow: "0 0 20px rgba(107,61,245,0.3)",
 }}
 >
 {t("whyUsCta") || "Tư vấn miễn phí"} <ArrowRight size={14} />
 </Link>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}
