"use client";
import { motion } from "motion/react";

const logos = [
  { name: "Samsung", weight: 800, size: "1.1rem" },
  { name: "VPBank", weight: 700, size: "1rem" },
  { name: "Viettel", weight: 700, size: "1rem" },
  { name: "TNO Holdings", weight: 800, size: "0.9rem" },
  { name: "ACB", weight: 800, size: "1.2rem" },
  { name: "momo", weight: 800, size: "1.1rem" },
  { name: "Grab Vietnam", weight: 700, size: "0.95rem" },
  { name: "Cleo Bridal", weight: 600, size: "0.9rem" },
];

export function LP2TrustedLogos() {
  const doubled = [...logos, ...logos];
  return (
    <section style={{ backgroundColor: "var(--lp2-bg-secondary)", paddingTop: "var(--lp2-sp-10)", paddingBottom: "var(--lp2-sp-10)", borderTop: "1px solid var(--lp2-border-light)", borderBottom: "1px solid var(--lp2-border-light)", position: "relative" }}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <p style={{ textAlign: "center", fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "var(--lp2-text-light)", marginBottom: "var(--lp2-sp-8)", fontFamily: "var(--lp2-font-sans)" }}>Đối tác &amp; Khách hàng tin cậy</p>
        <div className="lp2-marquee-track" style={{ overflow: "hidden" }}>
          <div className="lp2-marquee-inner">
            {doubled.map((logo, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 clamp(2rem, 4vw, 4rem)", borderRight: i < doubled.length - 1 ? "1px solid var(--lp2-border-light)" : "none", cursor: "default" }}>
                <span style={{ fontSize: logo.size, fontWeight: logo.weight, color: "var(--lp2-text-light)", fontFamily: "var(--lp2-font-display)", letterSpacing: logo.weight >= 800 ? "var(--lp2-ls-tight)" : "0", whiteSpace: "nowrap", transition: "color var(--lp2-t-base)", userSelect: "none" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lp2-text-primary)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--lp2-text-light)")}>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
