"use client";
import { useRef, useState, useEffect } from "react";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";

const HERO_IMG = "https://images.unsplash.com/photo-1691491918178-8a2e68b44919?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const PHOTO_BEHIND = "https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const PHOTO_FRONT = "https://images.unsplash.com/photo-1764162051223-8c4a22d682c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

export function LP2Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const exitRotateX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 6]);
  const exitScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.94]);
  const exitOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0.4]);
  const decoY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);

  useEffect(() => {
    setMounted(true);
    const move = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const r = sectionRef.current.getBoundingClientRect();
      setMouse({ x: (e.clientX - r.left - r.width / 2) / r.width, y: (e.clientY - r.top - r.height / 2) / r.height });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const tiltX = mouse.y * -10;
  const tiltY = mouse.x * 10;
  const float1X = mouse.x * -22;
  const float1Y = mouse.y * -22;
  const float2X = mouse.x * 16;
  const float2Y = mouse.y * 16;

  return (
    <section ref={sectionRef} id="hero" style={{ minHeight: "100vh", backgroundColor: "var(--lp2-bg-primary)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <motion.div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", zIndex: 0, pointerEvents: "none", y: bgY }} />
      <motion.div style={{ position: "absolute", top: "50%", right: "-2rem", translateY: "-50%", y: decoY, fontSize: "clamp(16rem, 30vw, 28rem)", fontWeight: "var(--lp2-fw-extrabold)", color: "rgba(0,0,0,0.025)", fontFamily: "var(--lp2-font-display)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 0 }}>L</motion.div>

      <motion.div className="lp2-container" style={{ position: "relative", zIndex: 1, paddingTop: "calc(var(--lp2-nav-top, 0px) + var(--lp2-navbar-h) + var(--lp2-sp-12))", paddingBottom: "var(--lp2-sp-20)", rotateX: exitRotateX, scale: exitScale, opacity: exitOpacity, transformPerspective: 1600, transformOrigin: "center 30%", willChange: "transform, opacity" }}>
        <div className="lp2-grid-hero" style={{ gap: "var(--lp2-sp-16)", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--lp2-sp-8)" }}>
            {mounted && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-3)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--lp2-sp-2)", padding: "0.375rem 0.875rem", borderRadius: "var(--lp2-r-full)", border: "1px solid var(--lp2-border-medium)", fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "var(--lp2-text-muted)", backgroundColor: "var(--lp2-bg-secondary)" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--lp2-accent-blue)", animation: "lp2-pulse-dot 2s ease-in-out infinite" }} />
                  LOOPS™ — WEB 4.0 AGENCY
                </span>
              </motion.div>
            )}
            <div style={{ overflow: "hidden" }}>
              {mounted && (
                <motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: "clamp(3rem, 6.5vw, 5.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: "var(--lp2-lh-tight)", color: "var(--lp2-text-primary)" }}>
                  Tạo dấu ấn số.<br /><span style={{ color: "var(--lp2-text-muted)" }}>Nâng tầm</span><br />thương hiệu.
                </motion.h1>
              )}
            </div>
            {mounted && (
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: "var(--lp2-fs-lg)", lineHeight: "var(--lp2-lh-relaxed)", color: "var(--lp2-text-muted)", maxWidth: "460px" }}>
                Giải pháp toàn diện về Website, Media, Marketing &amp; Branding. Chúng tôi không chỉ thiết kế — chúng tôi xây dựng thương hiệu thống trị thị trường.
              </motion.p>
            )}
            {mounted && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-3)", flexWrap: "wrap" }}>
                <a href="#contact" className="lp2-btn-primary" style={{ fontSize: "var(--lp2-fs-base)", padding: "0.9375rem 2rem" }}>Khám phá ngay <ArrowRight size={16} /></a>
                <a href="#projects" className="lp2-btn-outline" style={{ fontSize: "var(--lp2-fs-base)", padding: "0.875rem 2rem" }}><Play size={14} strokeWidth={2.5} fill="currentColor" /> Xem dự án</a>
              </motion.div>
            )}
            {mounted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.6 }} style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-6)", paddingTop: "var(--lp2-sp-6)", borderTop: "1px solid var(--lp2-border-light)" }}>
                {[{ val: "500+", label: "Dự án" }, { val: "10+", label: "Năm" }, { val: "95%", label: "Hài lòng" }].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "var(--lp2-sp-2)" }}>
                    <span style={{ fontSize: "var(--lp2-fs-2xl)", fontWeight: "var(--lp2-fw-extrabold)", color: "var(--lp2-text-primary)", letterSpacing: "var(--lp2-ls-tight)" }}>{s.val}</span>
                    <span style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-muted)" }}>{s.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            {mounted && <motion.div initial={{ opacity: 0, x: -30, rotate: -4 }} animate={{ opacity: 1, x: 0, rotate: -4 }} transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} className="lp2-hide-lg" style={{ position: "absolute", top: "24px", left: "-36px", width: "210px", height: "155px", borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "5px solid var(--lp2-bg-primary)", boxShadow: "var(--lp2-shadow-lg)", zIndex: 0, animation: "lp2-float-slow 9s ease-in-out infinite 1.5s" }}><img src={PHOTO_BEHIND} alt="Team work" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.08)" }} /></motion.div>}

            <motion.div style={{ y: imgY, borderRadius: "var(--lp2-r-3xl)", overflow: "hidden", aspectRatio: "3/4", boxShadow: "var(--lp2-shadow-2xl)", transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`, transition: "transform 0.15s ease-out", willChange: "transform", position: "relative", zIndex: 1 }}>
              <img src={HERO_IMG} alt="LOOPS Digital Studio" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }} />
            </motion.div>

            {mounted && <motion.div initial={{ opacity: 0, x: 24, y: 24, rotate: 3 }} animate={{ opacity: 1, x: 0, y: 0, rotate: 3 }} transition={{ duration: 0.9, delay: 0.75, ease: [0.16, 1, 0.3, 1] }} className="lp2-hide-lg" style={{ position: "absolute", bottom: "200px", right: "-28px", width: "180px", height: "130px", borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "5px solid var(--lp2-bg-primary)", boxShadow: "var(--lp2-shadow-xl)", zIndex: 3, animation: "lp2-float 10s ease-in-out infinite 3s" }}><img src={PHOTO_FRONT} alt="Creative work" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.06)" }} /></motion.div>}

            {mounted && <motion.div initial={{ opacity: 0, x: -20, y: 20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lp2-hide-lg" style={{ position: "absolute", bottom: "var(--lp2-sp-10)", left: "calc(-1 * var(--lp2-sp-12))", backgroundColor: "var(--lp2-bg-primary)", borderRadius: "var(--lp2-r-2xl)", padding: "var(--lp2-sp-5) var(--lp2-sp-6)", boxShadow: "var(--lp2-shadow-xl)", border: "1px solid var(--lp2-border-light)", transform: `translate(${float1X}px, ${float1Y}px)`, transition: "transform 0.3s ease-out", zIndex: 2, minWidth: "160px", animation: "lp2-float 6s ease-in-out infinite" }}>
              <p style={{ fontSize: "var(--lp2-fs-xs)", color: "var(--lp2-text-light)", marginBottom: "var(--lp2-sp-1)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wide)", textTransform: "uppercase" }}>Dự án hoàn thành</p>
              <p style={{ fontSize: "var(--lp2-fs-4xl)", fontWeight: "var(--lp2-fw-extrabold)", color: "var(--lp2-text-primary)", lineHeight: 1, letterSpacing: "var(--lp2-ls-tight)" }}>500+</p>
            </motion.div>}

            {mounted && <motion.div initial={{ opacity: 0, x: 20, y: -20 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }} className="lp2-hide-lg" style={{ position: "absolute", top: "var(--lp2-sp-10)", right: "calc(-1 * var(--lp2-sp-8))", backgroundColor: "var(--lp2-bg-dark)", color: "var(--lp2-text-inverse)", borderRadius: "var(--lp2-r-full)", padding: "var(--lp2-sp-3) var(--lp2-sp-5)", fontSize: "var(--lp2-fs-sm)", fontWeight: "var(--lp2-fw-semibold)", transform: `translate(${float2X}px, ${float2Y}px)`, transition: "transform 0.3s ease-out", zIndex: 2, whiteSpace: "nowrap", animation: "lp2-float 8s ease-in-out infinite 1s" }}>✦ 10+ năm kinh nghiệm</motion.div>}

            {mounted && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1, ease: [0.16, 1, 0.3, 1] }} className="lp2-hide-lg" style={{ position: "absolute", top: "50%", right: "calc(-1 * var(--lp2-sp-10))", transform: `translateY(-50%) translate(${float2X * 0.5}px, ${float2Y * 0.5}px)`, transition: "transform 0.3s ease-out", backgroundColor: "var(--lp2-accent-blue)", color: "white", borderRadius: "var(--lp2-r-xl)", padding: "var(--lp2-sp-4) var(--lp2-sp-5)", boxShadow: "0 8px 24px rgba(0,85,204,0.3)", zIndex: 2, animation: "lp2-float 7s ease-in-out infinite 0.5s" }}>
              <p style={{ fontSize: "var(--lp2-fs-xs)", opacity: 0.85, marginBottom: "2px", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "0.05em" }}>Khách hàng hài lòng</p>
              <p style={{ fontSize: "var(--lp2-fs-2xl)", fontWeight: "var(--lp2-fw-extrabold)", lineHeight: 1, letterSpacing: "var(--lp2-ls-tight)" }}>95%</p>
            </motion.div>}
          </div>
        </div>
      </motion.div>

      {mounted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ position: "absolute", bottom: "var(--lp2-sp-8)", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--lp2-sp-2)", color: "var(--lp2-text-light)" }}>
          <span style={{ fontSize: "var(--lp2-fs-xs)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", fontWeight: "var(--lp2-fw-semibold)" }}>Kéo xuống</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ChevronDown size={16} /></motion.div>
        </motion.div>
      )}
    </section>
  );
}
