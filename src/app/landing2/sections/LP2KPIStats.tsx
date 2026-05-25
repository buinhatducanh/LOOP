"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const stats = [
  { value: 500, suffix: "+", label: "Dự án hoàn thành", desc: "Trên toàn quốc & quốc tế" },
  { value: 10, suffix: "+", label: "Năm kinh nghiệm", desc: "Đồng hành cùng doanh nghiệp" },
  { value: 95, suffix: "%", label: "Tỷ lệ hài lòng", desc: "Cao nhất trong ngành" },
  { value: 24, suffix: "/7", label: "Hỗ trợ liên tục", desc: "Luôn sẵn sàng khi bạn cần" },
];

function CountUp({ target, suffix, trigger }: { target: number; suffix: string; trigger: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const dur = 1800;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, target]);
  return <span>{val}{suffix}</span>;
}

export function LP2KPIStats() {
  const [triggered, setTriggered] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setTriggered(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (countRef.current) obs.observe(countRef.current);
    return () => obs.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-30px", "30px"]);

  return (
    <section ref={sectionRef} style={{ backgroundColor: "var(--lp2-bg-dark)", paddingTop: "var(--lp2-sp-section)", paddingBottom: "var(--lp2-sp-section)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.10, filter: "saturate(0.3) brightness(0.8)", pointerEvents: "none", zIndex: 0 }} />
      <motion.div style={{ position: "absolute", inset: "-40px", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", y: bgY }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.015) 0%, transparent 50%)", pointerEvents: "none" }} />

      <motion.div ref={countRef} className="lp2-container" style={{ position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: "var(--lp2-sp-16)" }}>
          <p className="lp2-section-label-dark" style={{ justifyContent: "center", marginBottom: "var(--lp2-sp-4)" }}>SỐ LIỆU THỰC TẾ</p>
          <h2 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", color: "var(--lp2-text-inverse)", lineHeight: "var(--lp2-lh-tight)" }}>Con số nói lên<br /><span style={{ color: "rgba(255,255,255,0.45)" }}>tất cả</span></h2>
        </motion.div>
        <div className="lp2-grid-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 50, scale: 0.85 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.75, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }} style={{ padding: "var(--lp2-sp-8)", borderRadius: "var(--lp2-r-2xl)", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "background var(--lp2-t-slow), border-color var(--lp2-t-slow)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
              <div style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: "var(--lp2-fw-extrabold)", color: "var(--lp2-text-inverse)", lineHeight: 1, letterSpacing: "var(--lp2-ls-tight)", marginBottom: "var(--lp2-sp-4)", fontFamily: "var(--lp2-font-display)" }}><CountUp target={stat.value} suffix={stat.suffix} trigger={triggered} /></div>
              <p style={{ fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-semibold)", color: "var(--lp2-text-inverse)", marginBottom: "var(--lp2-sp-2)", fontFamily: "var(--lp2-font-sans)" }}>{stat.label}</p>
              <p style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-inverse-muted)", fontFamily: "var(--lp2-font-sans)" }}>{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
