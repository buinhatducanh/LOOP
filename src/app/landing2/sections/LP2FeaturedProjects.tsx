"use client";
import { useState, useRef } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";

const projects = [
  { id: 0, client: "The Coffee House", category: "Website Design + E-commerce", year: "2024", desc: "Redesign toàn bộ hệ thống website thương mại điện tử cho chuỗi cà phê hàng đầu Việt Nam. Tăng tỷ lệ chuyển đổi lên 240% sau 3 tháng.", result: "+240% Conversion", image: "https://images.unsplash.com/photo-1565791930080-5b787f230e28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 1, client: "VPBank Prime", category: "Digital Campaign + Branding", year: "2024", desc: "Chiến dịch truyền thông số toàn diện cho sản phẩm thẻ tín dụng cao cấp. Đạt 15 triệu lượt tiếp cận trong vòng 30 ngày.", result: "15M Lượt tiếp cận", image: "https://images.unsplash.com/photo-1640323240640-ee731d18dcb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 2, client: "TNO Holdings", category: "Corporate Video + Brand Identity", year: "2023", desc: "Sản xuất video doanh nghiệp và xây dựng bộ nhận diện thương hiệu mới cho tập đoàn TNO.", result: "Brand Overhaul", image: "https://images.unsplash.com/photo-1758873269035-aae0e1fd3422?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 3, client: "Cleo Bridal", category: "Editorial Photography + Lookbook", year: "2023", desc: "Chụp ảnh và quay video editorial lookbook cho BST váy cưới cao cấp mùa Thu-Đông.", result: "3 BST Ra mắt", image: "https://images.unsplash.com/photo-1742540425845-8d8dabe893ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
];

export function LP2FeaturedProjects({ dbProjects }: { dbProjects?: any[] }) {
  const displayProjects = dbProjects && dbProjects.length > 0
    ? dbProjects.map((p, idx) => ({
        id: p.id,
        client: p.client || p.title,
        category: p.category,
        year: p.year,
        desc: p.description,
        result: p.results || p.primaryMetric || "",
        image: p.image,
      }))
    : projects;

  const [active, setActive] = useState(0);
  const current = displayProjects[active] || displayProjects[0];
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const featuredY = useTransform(scrollYProgress, [0, 1], ["25px", "-25px"]);

  return (
    <section id="projects" className="lp2-section-pad" style={{ backgroundColor: "var(--lp2-bg-secondary)", position: "relative" }} ref={sectionRef}>
      <div className="lp2-container">
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--lp2-sp-12)", gap: "var(--lp2-sp-8)", flexWrap: "wrap" }}>
          <div>
            <p className="lp2-section-label" style={{ marginBottom: "var(--lp2-sp-4)" }}>DỰ ÁN TIÊU BIỂU</p>
            <h2 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: "var(--lp2-lh-tight)", color: "var(--lp2-text-primary)" }}>Tác phẩm đã<br /><span style={{ color: "var(--lp2-text-muted)" }}>thay đổi ngành</span></h2>
          </div>
          <a href="#contact" className="lp2-btn-outline">Tất cả dự án <ArrowRight size={14} /></a>
        </motion.div>

        <div className="lp2-grid-projects">
          <motion.div style={{ y: featuredY }}>
            <div style={{ borderRadius: "var(--lp2-r-3xl)", overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "var(--lp2-shadow-xl)", minHeight: "520px" }}>
              <AnimatePresence mode="wait">
                <motion.img key={active} src={current.image} alt={current.client} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              </AnimatePresence>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 75%)", zIndex: 1 }} />
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }} style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "var(--lp2-sp-8)", zIndex: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <p style={{ fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "var(--lp2-sp-2)", fontFamily: "var(--lp2-font-sans)" }}>{current.category} · {current.year}</p>
                      <h3 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: "var(--lp2-fw-extrabold)", color: "white", letterSpacing: "var(--lp2-ls-tight)", marginBottom: "var(--lp2-sp-3)" }}>{current.client}</h3>
                      <p style={{ fontSize: "var(--lp2-fs-sm)", color: "rgba(255,255,255,0.75)", maxWidth: "380px", lineHeight: "var(--lp2-lh-relaxed)", fontFamily: "var(--lp2-font-sans)" }}>{current.desc}</p>
                    </div>
                    <div style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", borderRadius: "var(--lp2-r-xl)", padding: "var(--lp2-sp-4) var(--lp2-sp-5)", border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", flexShrink: 0 }}>
                      <p style={{ fontSize: "var(--lp2-fs-lg)", fontWeight: "var(--lp2-fw-extrabold)", color: "white", letterSpacing: "var(--lp2-ls-tight)" }}>{current.result.split(" ")[0]}</p>
                      <p style={{ fontSize: "var(--lp2-fs-xs)", color: "rgba(255,255,255,0.7)", fontFamily: "var(--lp2-font-sans)" }}>{current.result.split(" ").slice(1).join(" ")}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <div style={{ position: "relative" }}>
            <div 
              className="lp2-proj-scroll"
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "var(--lp2-sp-4)", 
                maxHeight: "535px", 
                overflowY: "auto",
                paddingRight: "4px",
                paddingBottom: "0px",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <style>{`
                .lp2-proj-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {displayProjects.map((project, i) => (
                <motion.button key={project.id} initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }} onClick={() => setActive(i)} style={{ display: "flex", gap: "var(--lp2-sp-4)", padding: "var(--lp2-sp-4)", borderRadius: "var(--lp2-r-2xl)", border: active === i ? "1.5px solid var(--lp2-text-primary)" : "1px solid var(--lp2-border-light)", background: active === i ? "var(--lp2-bg-primary)" : "transparent", cursor: "pointer", textAlign: "left", transition: "all var(--lp2-t-base)", boxShadow: active === i ? "var(--lp2-shadow-md)" : "none" }}>
                  <div style={{ width: "80px", height: "72px", borderRadius: "var(--lp2-r-xl)", overflow: "hidden", flexShrink: 0, backgroundColor: "var(--lp2-bg-secondary)" }}>
                    <img src={project.image} alt={project.client} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--lp2-sp-1)" }}>
                    <p style={{ fontSize: "var(--lp2-fs-xs)", color: "var(--lp2-text-light)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", fontWeight: "var(--lp2-fw-semibold)", fontFamily: "var(--lp2-font-sans)" }}>{project.category}</p>
                    <p style={{ fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-bold)", color: active === i ? "var(--lp2-text-primary)" : "var(--lp2-text-secondary)", fontFamily: "var(--lp2-font-sans)" }}>{project.client}</p>
                    <p style={{ fontSize: "var(--lp2-fs-xs)", color: "var(--lp2-accent-blue)", fontWeight: "var(--lp2-fw-semibold)", fontFamily: "var(--lp2-font-sans)" }}>{project.result}</p>
                  </div>
                  <ArrowUpRight size={16} color={active === i ? "var(--lp2-text-primary)" : "var(--lp2-border-medium)"} style={{ flexShrink: 0, alignSelf: "flex-start", marginTop: "4px" }} />
                </motion.button>
              ))}
            </div>
            
            {/* Fade Blur Overlay at the bottom */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50px",
              background: "linear-gradient(to top, var(--lp2-bg-secondary) 0%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 10
            }} />
          </div>
        </div>
      </div>
    </section>
  );
}
