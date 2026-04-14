"use client";

/**
 * TrustBadgesSection — Trust & Credibility badges for landing page
 * Shows: SSL, Warranty, 24/7 Support, On-time Delivery
 * Placed between StatsSection and ServicesSection on the homepage.
 */
import { motion } from "motion/react";
import { Shield, Headphones, Rocket } from "lucide-react";
import { DS } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

const BADGES = [
 {
 icon: <Shield size={22} />,
 color: DS.green,
 titleKey: "trustBadgeSSLTitle",
 descKey: "trustBadgeSSLDesc",
 glowColor: "rgba(34,197,94,0.15)",
 },
 {
 icon: <Shield size={22} />,
 color: DS.amber,
 titleKey: "trustBadgeWarrantyTitle",
 descKey: "trustBadgeWarrantyDesc",
 glowColor: "rgba(230,199,95,0.12)",
 },
 {
 icon: <Headphones size={22} />,
 color: DS.cosmicBlue,
 titleKey: "trustBadgeSupportTitle",
 descKey: "trustBadgeSupportDesc",
 glowColor: "rgba(79,125,243,0.15)",
 },
 {
 icon: <Rocket size={22} />,
 color: DS.pink,
 titleKey: "trustBadgeDeliveryTitle",
 descKey: "trustBadgeDeliveryDesc",
 glowColor: "rgba(236,72,153,0.12)",
  },
];

export function TrustBadgesSection() {
 const t = useTranslations("home");

 return (
 <section
 style={{
 padding: "4rem 1.5rem",
 background: "linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.5) 50%, rgba(2,6,23,0) 100%)",
 borderTop: `1px solid ${DS.border}`,
 borderBottom: `1px solid ${DS.border}`,
 position: "relative",
 overflow: "hidden",
 }}
 >
 {/* Background accent */}
 <div
 style={{
 position: "absolute",
 top: "50%",
 left: "50%",
 transform: "translate(-50%, -50%)",
 width: "70%",
 height: "80%",
 background: "radial-gradient(ellipse, rgba(107,61,245,0.04) 0%, transparent 70%)",
 pointerEvents: "none",
 }}
 />

 <div style={{ maxWidth: "72rem", margin: "0 auto", position: "relative" }}>
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
  transition={{ duration: 0.5 }}
 style={{ textAlign: "center", marginBottom: "3rem" }}
 >
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "1rem",
 padding: "0.375rem 1rem",
 borderRadius: "9999px",
 background: `${DS.green}12`,
 border: `1px solid ${DS.green}30`,
 }}
 >
 <div
 style={{
 width: 6,
 height: 6,
 borderRadius: "50%",
 background: DS.green,
 boxShadow: `0 0 6px ${DS.green}`,
 }}
 />
 <span
 style={{
 color: DS.green,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.22em",
 }}
 >
 {t("trustBadgesBadge")}
 </span>
 </div>
 <h2
 style={{
 fontFamily: DS.heading,
 fontSize: "clamp(1.25rem, 3vw, 1.875rem)",
 fontWeight: 900,
 letterSpacing: "0.04em",
 color: DS.text,
 marginBottom: "0.75rem",
 }}
 >
 {t("trustBadgesTitle")}
 </h2>
 </motion.div>

 {/* Badges grid */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
 gap: "1.25rem",
 }}
 >
 {BADGES.map((badge, i) => (
 <motion.div
 key={badge.titleKey}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1, duration: 0.5 }}
 >
 <div
 style={{
 padding: "1.5rem",
 borderRadius: "1.25rem",
 background: "rgba(15,23,42,0.7)",
 border: `1px solid ${badge.color}20`,
 backdropFilter: "blur(12px)",
 textAlign: "center",
 height: "100%",
 display: "flex",
 flexDirection: "column",
 alignItems: "center",
 gap: "0.875rem",
 transition: "border-color 0.25s, box-shadow 0.25s",
 }}
  onMouseEnter={(e) => {
 const el = e.currentTarget as HTMLDivElement;
 el.style.borderColor = `${badge.color}40`;
 el.style.boxShadow = `0 0 30px ${badge.glowColor}, 0 8px 32px rgba(0,0,0,0.3)`;
 el.style.transform = "translateY(-2px)";
 }}
 onMouseLeave={(e) => {
 const el = e.currentTarget as HTMLDivElement;
 el.style.borderColor = `${badge.color}20`;
 el.style.boxShadow = "none";
 el.style.transform = "translateY(0)";
 }}
 >
 {/* Icon */}
  <div
 style={{
 width: 52,
 height: 52,
 borderRadius: "1rem",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 background: `${badge.color}15`,
 border: `1px solid ${badge.color}30`,
 boxShadow: `0 0 20px ${badge.color}20`,
 flexShrink: 0,
 }}
 >
 <span style={{ color: badge.color }}>{badge.icon}</span>
 </div>

 {/* Text */}
 <div>
 <div
 style={{
 color: DS.text,
 fontSize: "0.9375rem",
 fontWeight: 700,
 marginBottom: "0.5rem",
 lineHeight: 1.3,
 }}
 >
 {t(badge.titleKey)}
 </div>
 <div
 style={{
 color: DS.text4,
 fontSize: "0.75rem",
 lineHeight: 1.6,
 }}
 >
 {t(badge.descKey)}
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
  </div>
 </section>
 );
}
