"use client";

/**
 * FaqLandingSection — Inline FAQ accordion for landing page
 * 6 static questions, compact accordion, links to full /faq page
 */
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { DS } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

const FAQ_ITEMS = [
 {
 id: "faq-1",
 category: "services",
 color: DS.cosmicPurple,
 questionKey: "faqQ1",
 answerKey: "faqA1",
 },
 {
 id: "faq-2",
 category: "services",
 color: DS.cosmicBlue,
 questionKey: "faqQ2",
 answerKey: "faqA2",
 },
 {
 id: "faq-3",
 category: "payment",
 color: DS.green,
 questionKey: "faqQ3",
 answerKey: "faqA3",
 },
 {
 id: "faq-4",
 category: "general",
 color: DS.pink,
 questionKey: "faqQ4",
 answerKey: "faqA4",
 },
 {
 id: "faq-5",
 category: "technical",
 color: DS.cyan,
 questionKey: "faqQ5",
 answerKey: "faqA5",
 },
 {
 id: "faq-6",
 category: "lp",
 color: DS.gold,
 questionKey: "faqQ6",
 answerKey: "faqA6",
 },
];

function hexRgba(hex: string, alpha: number): string {
 const h = hex.replace("#", "");
 return `rgba(${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)},${alpha})`;
}

function FaqItem({
 item,
 isOpen,
 onToggle,
 t,
}: {
 item: (typeof FAQ_ITEMS)[0];
 isOpen: boolean;
 onToggle: () => void;
 t: ReturnType<typeof useTranslations>;
}) {
 return (
 <motion.div
 style={{
 background: "rgba(15,23,42,0.6)",
 border: `1px solid ${isOpen ? hexRgba(item.color, 0.4) : DS.border}`,
 borderRadius: 14,
 overflow: "hidden",
 transition: "border-color 0.25s ease",
 backdropFilter: "blur(8px)",
 }}
 >
 <button
 onClick={onToggle}
 style={{
 width: "100%",
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 16,
 padding: "1rem 1.25rem",
 background: "transparent",
 border: "none",
 cursor: "pointer",
 textAlign: "left",
 }}
 aria-expanded={isOpen}
 >
 <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 12 }}>
 <span
 style={{
 display: "inline-block",
 width: 7,
 height: 7,
 borderRadius: "50%",
 background: item.color,
 marginTop: 6,
 flexShrink: 0,
 boxShadow: `0 0 8px ${hexRgba(item.color, 0.6)}`,
 }}
 />
 <span
 style={{
 color: isOpen ? DS.text : DS.text2,
 fontSize: "0.9375rem",
 fontWeight: isOpen ? 600 : 500,
 lineHeight: 1.5,
 transition: "color 0.2s ease",
 }}
 >
 {t(item.questionKey)}
 </span>
 </div>

 <motion.div
 animate={{ rotate: isOpen ? 180 : 0 }}
 transition={{ duration: 0.25, ease: "easeInOut" }}
 style={{ color: item.color, flexShrink: 0, marginTop: 2 }}
 >
 <ChevronDown size={16} />
 </motion.div>
 </button>

 <AnimatePresence initial={false}>
 {isOpen && (
 <motion.div
 key="answer"
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
 style={{ overflow: "hidden" }}
 >
 <div
 style={{
 padding: "0 1.25rem 1.25rem 2.75rem",
 borderTop: `1px solid ${DS.border}40`,
 paddingTop: "0.875rem",
 }}
 >
 <p
 style={{
 color: DS.text3,
 fontSize: "0.875rem",
 lineHeight: 1.8,
 }}
 dangerouslySetInnerHTML={{ __html: t(item.answerKey) }}
 />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

export function FaqLandingSection({ locale }: { locale: string }) {
 const t = useTranslations("home");
 const [openIds, setOpenIds] = useState<Set<string>>(new Set());

 const toggleOpen = (id: string) => {
 setOpenIds((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 };

 return (
 <section
 style={{
 padding: "5rem 1.5rem",
 background: `linear-gradient(160deg, rgba(2,6,23,0.8) 0%, rgba(15,23,42,0.4) 100%)`,
 }}
 >
 <div style={{ maxWidth: "52rem", margin: "0 auto" }}>
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 style={{ textAlign: "center", marginBottom: "2.5rem" }}
 >
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "1rem",
 padding: "0.375rem 1rem",
 borderRadius: "9999px",
 background: `${DS.gold}10`,
 border: `1px solid ${DS.gold}25`,
 }}
 >
 <div
 style={{
 width: 6, height: 6, borderRadius: "50%",
 background: DS.gold, boxShadow: `0 0 6px ${DS.gold}`,
 }}
 />
 <span
 style={{
 color: DS.gold,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.22em",
 }}
 >
 FAQ
 </span>
 </div>
 <h2
 style={{
 fontFamily: DS.heading,
 fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
 fontWeight: 900,
 letterSpacing: "0.04em",
 background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.gold} 100%)`,
 WebkitBackgroundClip: "text",
 WebkitTextFillColor: "transparent",
 backgroundClip: "text",
 marginBottom: "0.875rem",
 }}
 >
 {t("faqLandingTitle")}
 </h2>
 <p
 style={{
 color: DS.text3,
 fontSize: "0.9375rem",
 lineHeight: 1.7,
 maxWidth: 480,
 margin: "0 auto",
 }}
 >
 {t("faqLandingDesc")}
 </p>
 </motion.div>

 {/* FAQ Items */}
 <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
 {FAQ_ITEMS.map((item, i) => (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.06, duration: 0.4 }}
 >
 <FaqItem
 item={item}
 isOpen={openIds.has(item.id)}
 onToggle={() => toggleOpen(item.id)}
 t={t}
 />
 </motion.div>
 ))}
 </div>

 {/* View all CTA */}
 <motion.div
 initial={{ opacity: 0 }}
 whileInView={{ opacity: 1 }}
 viewport={{ once: true }}
 transition={{ delay: 0.4 }}
 style={{ textAlign: "center", marginTop: "2.5rem" }}
 >
 <Link
 href={`/${locale}/faq`}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 padding: "0.75rem 1.75rem",
 borderRadius: "9999px",
 background: "rgba(15,23,42,0.8)",
 border: `1px solid ${DS.border}`,
 color: DS.text3,
 fontSize: "0.875rem",
 fontWeight: 500,
 textDecoration: "none",
 transition: "all 0.2s ease",
 }}
 onMouseEnter={(e) => {
 const el = e.currentTarget as HTMLElement;
 el.style.borderColor = `${DS.pink}40`;
 el.style.color = DS.text;
 el.style.boxShadow = `0 0 20px rgba(236,72,153,0.1)`;
 }}
 onMouseLeave={(e) => {
 const el = e.currentTarget as HTMLElement;
 el.style.borderColor = DS.border;
 el.style.color = DS.text3;
 el.style.boxShadow = "none";
 }}
 >
 {t("faqLandingViewAll")} <ArrowRight size={15} />
 </Link>
 </motion.div>
 </div>
 </section>
 );
}
