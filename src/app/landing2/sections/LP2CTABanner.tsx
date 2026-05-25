"use client";
import { useRef } from "react";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";

export function LP2CTABanner({ settings }: { settings: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const loopsTextY = useTransform(scrollYProgress, [0, 1], ["30px", "-60px"]);
  const gridY = useTransform(scrollYProgress, [0, 1], ["-20px", "40px"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["-15px", "30px"]);

  let imgList = [
    "https://images.unsplash.com/photo-1641998148499-cb6b55a3c0d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    "https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    "https://images.unsplash.com/photo-1764162051223-8c4a22d682c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
  ];

  try {
    if (settings && settings.cta_images) {
      const parsed = JSON.parse(settings.cta_images);
      if (Array.isArray(parsed) && parsed.length === 4) {
        imgList = parsed;
      }
    }
  } catch (err) {
    console.error("Failed to parse cta_images:", err);
  }

  return (
    <section ref={sectionRef} id="contact" style={{ backgroundColor: "var(--lp2-bg-dark)", paddingTop: "var(--lp2-sp-section)", paddingBottom: "var(--lp2-sp-section)", position: "relative", overflow: "hidden" }}>
      {/* Background elements */}
      <motion.div style={{ position: "absolute", inset: "-40px", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none", y: gridY }} />
      <motion.div style={{ position: "absolute", top: "50%", left: "50%", translateX: "-50%", translateY: "-50%", width: "600px", height: "400px", background: "radial-gradient(ellipse, rgba(0,85,204,0.08) 0%, transparent 70%)", pointerEvents: "none", y: glowY }} />

      {/* 4 Corner Images */}
      {/* Top Left */}
      <motion.div initial={{ opacity: 0, x: -40, rotate: -6 }} whileInView={{ opacity: 1, x: 0, rotate: -6 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="lp2-hide-lg" style={{ position: "absolute", top: "10%", left: "5%", width: "220px", height: "160px", borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 1, animation: "lp2-float 8s ease-in-out infinite" }}>
        <img src={imgList[0]} alt="Office" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
      </motion.div>

      {/* Top Right */}
      <motion.div initial={{ opacity: 0, x: 40, rotate: 4 }} whileInView={{ opacity: 1, x: 0, rotate: 4 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="lp2-hide-lg" style={{ position: "absolute", top: "15%", right: "5%", width: "190px", height: "180px", borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 1, animation: "lp2-float-slow 9s ease-in-out infinite 1s" }}>
        <img src={imgList[1]} alt="Team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
      </motion.div>

      {/* Bottom Left */}
      <motion.div initial={{ opacity: 0, x: -40, rotate: 8 }} whileInView={{ opacity: 1, x: 0, rotate: 8 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }} className="lp2-hide-lg" style={{ position: "absolute", bottom: "10%", left: "2%", width: "180px", height: "240px", borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 1, animation: "lp2-float 10s ease-in-out infinite 0.5s" }}>
        <img src={imgList[2]} alt="Professional" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
      </motion.div>

      {/* Bottom Right */}
      <motion.div initial={{ opacity: 0, x: 40, rotate: -5 }} whileInView={{ opacity: 1, x: 0, rotate: -5 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.8 }} className="lp2-hide-lg" style={{ position: "absolute", bottom: "5%", right: "2%", width: "240px", height: "160px", borderRadius: "var(--lp2-r-2xl)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 1, animation: "lp2-float-slow 8s ease-in-out infinite 1.5s" }}>
        <img src={imgList[3]} alt="Creative" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)" }} />
      </motion.div>

      <motion.div style={{ position: "absolute", bottom: "-0.5rem", left: "50%", translateX: "-50%", fontSize: "clamp(8rem, 18vw, 20rem)", fontWeight: "var(--lp2-fw-extrabold)", color: "rgba(255,255,255,0.03)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: 1, whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none", fontFamily: "var(--lp2-font-display)", y: loopsTextY }}>LOOPS</motion.div>

      <div className="lp2-container" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}>
            <p className="lp2-section-label-dark" style={{ justifyContent: "center", marginBottom: "var(--lp2-sp-6)" }}>BẮT ĐẦU NGAY HÔM NAY</p>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: "var(--lp2-lh-tight)", color: "var(--lp2-text-inverse)", marginBottom: "var(--lp2-sp-6)" }}>
            Sẵn sàng bứt phá<br /><span style={{ color: "rgba(255,255,255,0.45)" }}>cùng LOOPS?</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.25 }} style={{ fontSize: "var(--lp2-fs-lg)", color: "var(--lp2-text-inverse-muted)", lineHeight: "var(--lp2-lh-relaxed)", marginBottom: "var(--lp2-sp-10)", fontFamily: "var(--lp2-font-sans)" }}>
            Hãy cùng đồng hành và mang giải pháp số tốt nhất để thúc đẩy doanh nghiệp của bạn lên tầm cao mới. Tư vấn miễn phí, không cam kết.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.35 }} style={{ display: "flex", justifyContent: "center", gap: "var(--lp2-sp-4)", flexWrap: "wrap", marginBottom: "var(--lp2-sp-12)" }}>
            <a href={`mailto:${settings.contact_email}`} style={{ display: "inline-flex", alignItems: "center", gap: "var(--lp2-sp-2)", backgroundColor: "var(--lp2-bg-primary)", color: "var(--lp2-text-primary)", fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-semibold)", padding: "1rem 2rem", borderRadius: "var(--lp2-r-full)", textDecoration: "none", transition: "all var(--lp2-t-base)", fontFamily: "var(--lp2-font-sans)" }}><Mail size={16} /> Nhận tư vấn miễn phí <ArrowRight size={16} /></a>
            <a href={`tel:${settings.contact_hotline.replace(/\s+/g, '')}`} style={{ display: "inline-flex", alignItems: "center", gap: "var(--lp2-sp-2)", backgroundColor: "transparent", color: "var(--lp2-text-inverse)", fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-semibold)", padding: "1rem 2rem", borderRadius: "var(--lp2-r-full)", border: "1.5px solid rgba(255,255,255,0.2)", textDecoration: "none", transition: "all var(--lp2-t-base)", fontFamily: "var(--lp2-font-sans)" }}><Phone size={16} /> {settings.contact_hotline}</a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--lp2-sp-8)", flexWrap: "wrap", paddingTop: "var(--lp2-sp-8)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {["✓ Tư vấn miễn phí", "✓ Phản hồi trong 2 giờ", "✓ Không cam kết", "✓ Bảo mật thông tin"].map((item) => (<span key={item} style={{ fontSize: "var(--lp2-fs-sm)", color: "rgba(255,255,255,0.45)", fontFamily: "var(--lp2-font-sans)", fontWeight: "var(--lp2-fw-medium)" }}>{item}</span>))}
          </motion.div>
        </div>
      </div>
    </section>

  );
}
