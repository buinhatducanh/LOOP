"use client";
import { motion } from "motion/react";

const IMG_H = 240;
const GAP = 16;

type StripItem = {
  url: string;
  label: string;
  w: number;
};

function Row({ items, reverse }: { items: StripItem[]; reverse?: boolean }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className="lp2-marquee-track" style={{ overflow: "hidden" }}>
      <div className="lp2-marquee-inner" style={{ gap: `${GAP}px`, animationDuration: "52s", animationDirection: reverse ? "reverse" : "normal" }}>
        {doubled.map((img, i) => (
          <div key={i} style={{ flexShrink: 0, width: `${img.w}px`, height: `${IMG_H}px`, borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "4px solid var(--lp2-bg-primary)", boxShadow: "var(--lp2-shadow-md)", position: "relative" }}>
            <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", padding: "var(--lp2-sp-4)", opacity: 0, transition: "opacity var(--lp2-t-slow)" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
              <span style={{ fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wide)", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", fontFamily: "var(--lp2-font-sans)" }}>{img.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LP2ImageStrip({ dbPortfolioImages }: { dbPortfolioImages?: any[] }) {
  const activeItems = dbPortfolioImages && dbPortfolioImages.length > 0
    ? dbPortfolioImages.map(img => ({
        url: img.image,
        label: img.description,
        w: img.width ?? 300,
        row: img.row ?? 1
      }))
    : [];

  const finalRow1 = activeItems.filter(img => img.row === 1);
  const finalRow2 = activeItems.filter(img => img.row === 2);

  // If there are no images at all, we don't render the section
  if (finalRow1.length === 0 && finalRow2.length === 0) {
    return null;
  }

  return (
    <section style={{ backgroundColor: "var(--lp2-bg-secondary)", paddingTop: "var(--lp2-sp-12)", paddingBottom: "var(--lp2-sp-12)", borderTop: "1px solid var(--lp2-border-light)", borderBottom: "1px solid var(--lp2-border-light)", position: "relative", overflow: "hidden" }}>
      <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: "center", fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "var(--lp2-text-light)", marginBottom: "var(--lp2-sp-8)", fontFamily: "var(--lp2-font-sans)" }}>Portfolio · Thành quả thị giác của LOOPS</motion.p>
      <div style={{ display: "flex", flexDirection: "column", gap: `${GAP}px` }}>
        <Row items={finalRow1} />
        <Row items={finalRow2} reverse />
      </div>
    </section>
  );
}
