"use client";

import { useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";

const CURATED_IMAGES = [
  "https://images.unsplash.com/photo-1560509660-4dbc7e0ca990?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", // Web
  "https://images.unsplash.com/photo-1762028895584-8a1790be85f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", // Media
  "https://images.unsplash.com/photo-1759661966728-4a02e3c6ed91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", // Marketing
  "https://images.unsplash.com/photo-1759975142153-6deb00075980?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", // Branding
  "https://images.unsplash.com/photo-1646737554389-49329965ef01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", // App
  "https://images.unsplash.com/photo-1758873269035-aae0e1fd3422?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800", // Consulting
];

const services = [
  { id: 0, num: "01", icon: "Monitor", title: "Thiết kế Website", short: "Website cao cấp, chuẩn UX/UI", desc: "Thiết kế và phát triển website chuyên nghiệp, tối ưu trải nghiệm người dùng và tỷ lệ chuyển đổi.", tags: ["UI/UX Design", "Frontend Dev", "SEO Ready"], image: "https://images.unsplash.com/photo-1560509660-4dbc7e0ca990?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 1, num: "02", icon: "Video", title: "Sản xuất Media", short: "Quay phim, chụp ảnh, motion graphic", desc: "Sản xuất nội dung hình ảnh và video chuyên nghiệp từ concept đến thành phẩm.", tags: ["Video", "Photography", "Motion"], image: "https://images.unsplash.com/photo-1762028895584-8a1790be85f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 2, num: "03", icon: "TrendingUp", title: "Digital Marketing", short: "Chiến lược đa kênh, ROI cao", desc: "Chiến lược marketing toàn diện: SEO, Google Ads, Meta Ads, Content Marketing.", tags: ["SEO/SEM", "Ads", "Social Media"], image: "https://images.unsplash.com/photo-1759661966728-4a02e3c6ed91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 3, num: "04", icon: "Layers", title: "Branding Strategy", short: "Nhận diện thương hiệu toàn diện", desc: "Xây dựng thương hiệu từ nền tảng: logo, bộ nhận diện, brand guideline, brand voice.", tags: ["Identity", "Logo", "Visual System"], image: "https://images.unsplash.com/photo-1759975142153-6deb00075980?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 4, num: "05", icon: "Smartphone", title: "Ứng dụng & App", short: "Mobile app iOS/Android", desc: "Phát triển ứng dụng mobile iOS/Android và web app tùy chỉnh đa nền tảng.", tags: ["iOS/Android", "React Native", "Web App"], image: "https://images.unsplash.com/photo-1646737554389-49329965ef01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 5, num: "06", icon: "MessageSquare", title: "Tư vấn & Giải pháp", short: "Chuyển đổi số tổng thể", desc: "Tư vấn chiến lược chuyển đổi số, lộ trình phát triển thương hiệu toàn diện.", tags: ["Strategy", "Consulting", "Tech Stack"], image: "https://images.unsplash.com/photo-1758873269035-aae0e1fd3422?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
];

export function LP2Services({ dbServices }: { dbServices?: any[] }) {
  const displayServices = dbServices && dbServices.length > 0
    ? dbServices.map((svc, idx) => {
        let iconName = svc.icon || "Monitor";
        let imageUrl = "";
        if (svc.icon && svc.icon.includes("|")) {
          const parts = svc.icon.split("|");
          iconName = parts[0];
          imageUrl = parts[1];
        } else if (svc.icon && svc.icon.startsWith("http")) {
          iconName = "Monitor";
          imageUrl = svc.icon;
        }

        return {
          id: svc.id,
          num: String(idx + 1).padStart(2, "0"),
          icon: iconName,
          title: svc.title,
          short: svc.shortDescription,
          desc: svc.shortDescription || svc.longDescription,
          tags: svc.features && svc.features.length > 0 ? svc.features : (svc.technologies || []),
          image: imageUrl || CURATED_IMAGES[idx % CURATED_IMAGES.length]
        };
      })
    : services;

  const [active, setActive] = useState(0);
  const current = displayServices[active] || displayServices[0];
  
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const featuredY = useTransform(scrollYProgress, [0, 1], ["25px", "-25px"]);

  return (
    <section 
      ref={sectionRef} 
      id="services" 
      className="lp2-section-pad" 
      style={{ backgroundColor: "var(--lp2-bg-primary)", position: "relative" }}
    >
      <div className="lp2-container">
        {/* Top Header */}
        <motion.div 
          initial={{ opacity: 0, y: 32 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: "-80px" }} 
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--lp2-sp-12)", gap: "var(--lp2-sp-8)", flexWrap: "wrap" }}
        >
          <div>
            <p className="lp2-section-label" style={{ marginBottom: "var(--lp2-sp-4)" }}>DỊCH VỤ CỦA LOOPS</p>
            <h2 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: "var(--lp2-lh-tight)", color: "var(--lp2-text-primary)" }}>
              Giải pháp số<br />
              <span style={{ color: "var(--lp2-text-muted)" }}>nâng tầm thương hiệu</span>
            </h2>
          </div>
          <a href="#contact" className="lp2-btn-outline">
            Tất cả dịch vụ <ArrowRight size={14} />
          </a>
        </motion.div>

        {displayServices.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 2rem", textAlign: "center" }}>
            <p style={{ color: "var(--lp2-text-muted)", fontSize: "1.1rem" }}>Chưa có dịch vụ nào.</p>
          </div>
        ) : (
          /* Grid Layout swap like Image 2 */
          <div className="lp2-grid-projects">
            {/* LEFT: Featured Service Card */}
            <motion.div style={{ y: featuredY }}>
              <div 
                style={{ 
                  borderRadius: "var(--lp2-r-3xl)", 
                  overflow: "hidden", 
                  position: "relative", 
                  cursor: "pointer", 
                  boxShadow: "var(--lp2-shadow-xl)", 
                  minHeight: "520px" 
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={active} 
                    src={current.image} 
                    alt={current.title} 
                    initial={{ opacity: 0, scale: 1.05 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.98 }} 
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} 
                  />
                </AnimatePresence>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 75%)", zIndex: 1 }} />
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={active} 
                    initial={{ opacity: 0, y: 16 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -8 }} 
                    transition={{ duration: 0.4 }} 
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "var(--lp2-sp-8)", zIndex: 2 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        {/* Service tags / index */}
                        <p style={{ fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "var(--lp2-sp-2)", fontFamily: "var(--lp2-font-sans)" }}>
                          DỊCH VỤ · {current.num}
                        </p>
                        {/* Service Title */}
                        <h3 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: "var(--lp2-fw-extrabold)", color: "white", letterSpacing: "var(--lp2-ls-tight)", marginBottom: "var(--lp2-sp-3)" }}>
                          {current.title}
                        </h3>
                        {/* Service long description */}
                        <p style={{ fontSize: "var(--lp2-fs-sm)", color: "rgba(255,255,255,0.75)", maxWidth: "380px", lineHeight: "var(--lp2-lh-relaxed)", fontFamily: "var(--lp2-font-sans)", marginBottom: 0 }}>
                          {current.desc}
                        </p>
                        {/* Service Technologies (moved blue line) */}
                        <p style={{ fontSize: "var(--lp2-fs-xs)", color: "#3B82F6", fontWeight: "var(--lp2-fw-semibold)", fontFamily: "var(--lp2-font-sans)", marginTop: "var(--lp2-sp-3)", margin: 0, letterSpacing: "var(--lp2-ls-wide)" }}>
                          {current.tags.join(" · ")}
                        </p>
                      </div>

                      {/* Right blur glass icon badge */}
                      <div 
                        style={{ 
                          backgroundColor: "rgba(255,255,255,0.12)", 
                          backdropFilter: "blur(10px)", 
                          borderRadius: "var(--lp2-r-xl)", 
                          padding: "var(--lp2-sp-4)", 
                          border: "1px solid rgba(255,255,255,0.2)", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          flexShrink: 0 
                        }}
                      >
                        {(() => {
                          const IconComp = typeof current.icon === "string"
                            ? ((LucideIcons as any)[current.icon] || LucideIcons.Monitor)
                            : current.icon;
                          return <IconComp size={24} color="#fff" />;
                        })()}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* RIGHT: Vertical scrollable buttons list */}
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
                
                {displayServices.map((service, i) => (
                  <motion.button 
                    key={service.id} 
                    initial={{ opacity: 0, x: 32 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    viewport={{ once: true, margin: "-80px" }} 
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }} 
                    onClick={() => setActive(i)} 
                    style={{ 
                      display: "flex", 
                      gap: "var(--lp2-sp-4)", 
                      padding: "var(--lp2-sp-4)", 
                      borderRadius: "var(--lp2-r-2xl)", 
                      border: active === i ? "1.5px solid var(--lp2-text-primary)" : "1px solid var(--lp2-border-light)", 
                      background: active === i ? "var(--lp2-bg-secondary)" : "transparent", 
                      cursor: "pointer", 
                      textAlign: "left", 
                      transition: "all var(--lp2-t-base)", 
                      boxShadow: active === i ? "var(--lp2-shadow-md)" : "none" 
                    }}
                  >
                    {/* Left small image thumbnail */}
                    <div style={{ width: "80px", height: "72px", borderRadius: "var(--lp2-r-xl)", overflow: "hidden", flexShrink: 0, backgroundColor: "var(--lp2-bg-secondary)" }}>
                      <img src={service.image} alt={service.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    {/* Middle text blocks */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--lp2-sp-1)" }}>
                      <p style={{ fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-bold)", color: active === i ? "var(--lp2-text-primary)" : "var(--lp2-text-secondary)", fontFamily: "var(--lp2-font-sans)", margin: 0 }}>
                        {service.title}
                      </p>
                      <p style={{ fontSize: "var(--lp2-fs-xs)", color: "var(--lp2-text-light)", fontFamily: "var(--lp2-font-sans)", margin: 0, lineHeight: 1.4 }}>
                        {service.short}
                      </p>
                    </div>

                    {/* Right link arrow */}
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
                background: "linear-gradient(to top, var(--lp2-bg-primary) 0%, transparent 100%)",
                pointerEvents: "none",
                zIndex: 10
              }} />
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
