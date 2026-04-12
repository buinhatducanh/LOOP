"use client";

/**
 * ClientLogosSection — Trust bar with client/partner brand names
 * Grayscale by default, color on hover. Static data — no API needed.
 */
import { motion } from "motion/react";
import Link from "next/link";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const CLIENTS = [
 { name: "FPT Software", color: "#0067FF" },
 { name: "Vingroup", color: "#FF4500" },
 { name: "Viettel", color: "#E31837" },
 { name: "VNPAY", color: "#4F46E5" },
 { name: "MoMo", color: "#A50064" },
 { name: "Shopee", color: "#EE4D2D" },
 { name: "Lazada", color: "#283593" },
 { name: "Grab", color: "#00AFB2" },
 { name: "Gojek", color: "#00A05A" },
 { name: "Tiki", color: "#1A94FF" },
];

function ClientLogo({ name, color }: { name: string; color: string }) {
 return (
 <div
 className="client-logo-item"
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 padding: "0.875rem 1.25rem",
 borderRadius: "0.75rem",
 background: `${color}0A`,
 border: `1px solid ${color}18`,
 cursor: "pointer",
 transition: "all 0.3s ease",
 filter: "grayscale(100%)",
 opacity: 0.55,
 }}
  onMouseEnter={(e) => {
 const el = e.currentTarget as HTMLDivElement;
 el.style.filter = "grayscale(0%)";
 el.style.opacity = "1";
 el.style.borderColor = `${color}40`;
 el.style.boxShadow = `0 0 20px ${color}15`;
 el.style.transform = "translateY(-2px)";
 }}
 onMouseLeave={(e) => {
 const el = e.currentTarget as HTMLDivElement;
 el.style.filter = "grayscale(100%)";
 el.style.opacity = "0.55";
 el.style.borderColor = `${color}18`;
 el.style.boxShadow = "none";
 el.style.transform = "translateY(0)";
 }}
 >
 <span
 style={{
 fontFamily: DS.heading,
 fontSize: "0.8125rem",
 fontWeight: 800,
 letterSpacing: "0.04em",
 color: color,
 whiteSpace: "nowrap",
 }}
 >
 {name}
 </span>
 </div>
 );
}

export function ClientLogosSection({ locale }: { locale: string }) {
 const t = useTranslations("home");

 return (
 <section
 style={{
 padding: "3.5rem 1.5rem",
 background: "linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.5) 50%, rgba(2,6,23,0) 100%)",
 borderTop: `1px solid ${DS.border}`,
 borderBottom: `1px solid ${DS.border}`,
 }}
 >
 <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
 {/* Badge + Title */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.4 }}
 style={{ textAlign: "center", marginBottom: "2.5rem" }}
 >
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "0.75rem",
 padding: "0.375rem 1rem",
 borderRadius: "9999px",
 background: `${DS.cosmicCyan}10`,
 border: `1px solid ${DS.cosmicCyan}25`,
 }}
 >
 <div
 style={{
 width: 6, height: 6, borderRadius: "50%",
 background: DS.cosmicCyan, boxShadow: `0 0 6px ${DS.cosmicCyan}`,
 }}
 />
 <span
 style={{
 color: DS.cosmicCyan,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.22em",
 }}
 >
 {t("clientLogosBadge")}
 </span>
 </div>
 <h2
 style={{
 fontFamily: DS.heading,
 fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
 fontWeight: 900,
  letterSpacing: "0.05em",
 background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.cosmicCyan} 100%)`,
 WebkitBackgroundClip: "text",
 WebkitTextFillColor: "transparent",
 backgroundClip: "text",
 marginBottom: "0.5rem",
 }}
 >
 {t("clientLogosTitle")}
 </h2>
  </motion.div>

 {/* Logo grid */}
 <motion.div
 initial={{ opacity: 0 }}
 whileInView={{ opacity: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: 0.2 }}
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(5, 1fr)",
 gap: "0.875rem",
 }}
 className="client-logos-grid"
 >
 {CLIENTS.map((client, i) => (
 <motion.div
 key={client.name}
 initial={{ opacity: 0, scale: 0.9 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.04, duration: 0.3 }}
 >
 <ClientLogo name={client.name} color={client.color} />
 </motion.div>
 ))}
 </motion.div>

 {/* CTA */}
 <motion.div
 initial={{ opacity: 0 }}
 whileInView={{ opacity: 1 }}
 viewport={{ once: true }}
 transition={{ delay: 0.4 }}
 style={{ textAlign: "center", marginTop: "2rem" }}
 >
 <Link
 href={`/${locale}/contact`}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 color: DS.text3,
 fontSize: "0.8125rem",
 fontWeight: 500,
 textDecoration: "none",
 transition: "color 0.2s",
 }}
  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = DS.cosmicCyan; }}
 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = DS.text3; }}
 >
 {t("clientLogosCta") || "Trở thành đối tác tiếp theo"} <ArrowRight size={14} />
 </Link>
 </motion.div>
 </div>

 <style>{`
 @media (max-width: 768px) {
 .client-logos-grid { grid-template-columns: repeat(2, 1fr) !important; }
 }
 @media (min-width: 769px) and (max-width: 1024px) {
 .client-logos-grid { grid-template-columns: repeat(4, 1fr) !important; }
 }
 `}</style>
 </section>
 );
}
