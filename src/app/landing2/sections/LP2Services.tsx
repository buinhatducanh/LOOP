import { useRef, useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

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

function SlantedCard({ svc }: { svc: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = typeof svc.icon === "string"
    ? ((LucideIcons as any)[svc.icon] || LucideIcons.Monitor)
    : svc.icon;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "380px",
        height: "500px",
        position: "relative",
        transform: "skewX(-10deg)",
        overflow: "hidden",
        borderRadius: "16px",
        flexShrink: 0,
        cursor: "pointer",
        backgroundColor: "var(--lp2-bg-secondary)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.05)",
        WebkitUserSelect: "none",
        userSelect: "none",
        // To remove any jagged edges from skewing
        WebkitBackfaceVisibility: "hidden",
        WebkitTransform: "translateZ(0) skewX(-10deg)",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          // Offset to cover the slanted corners and make content straight
          left: "-60px",
          right: "-60px",
          transform: "skewX(10deg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <motion.img 
          src={svc.image} 
          alt={svc.title}
          draggable={false}
          animate={{ 
            scale: isHovered ? 1.05 : 1, 
            filter: isHovered ? "brightness(0.9)" : "brightness(0.5)" 
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
        
        {/* Gradient Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)", zIndex: 1 }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 80px 2.5rem 80px", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", flex: 1 }}>
           
           <motion.div 
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}
           >
              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconComponent size={22} color="#fff" />
              </div>
              <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                {svc.title}
              </h3>
           </motion.div>

           <div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1rem" }}>
                {svc.desc}
              </p>
              
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {svc.tags.map((tag: string) => (
                  <span key={tag} style={{ fontSize: "0.7rem", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.15)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", backdropFilter: "blur(4px)", whiteSpace: "nowrap" }}>
                    {tag}
                  </span>
                ))}
              </div>
           </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

export function LP2Services({ dbServices }: { dbServices?: any[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const displayServices = dbServices
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

  const isDragging = useRef(false);
  const pauseUntil = useRef(0);

  useEffect(() => {
    if (displayServices.length === 0) return;
    let animationFrameId: number;
    
    // Each card is 380px wide + 16px gap
    const itemWidth = 380;
    const gap = 16;
    const setWidth = (itemWidth + gap) * displayServices.length;

    // Set initial scroll position to the second set so we can scroll left immediately
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = setWidth;
    }

    const scroll = () => {
      const ele = scrollContainerRef.current;
      if (ele) {
        if (!isDragging.current && Date.now() >= pauseUntil.current) {
          ele.scrollLeft += 0.8; // Smooth speed in constant direction
        }

        // True infinite loop: stay between set 1 and set 2
        if (ele.scrollLeft >= setWidth * 2) {
          ele.scrollLeft -= setWidth;
        } else if (ele.scrollLeft <= 0) {
          ele.scrollLeft += setWidth;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Quick drag-to-scroll logic
  const handleDragStart = (e: React.MouseEvent) => {
    const ele = scrollContainerRef.current;
    if (!ele) return;
    isDragging.current = true;
    let lastX = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      // If the user released the mouse outside the window, cancel the drag
      if (e.buttons !== 1) {
        handleMouseUp();
        return;
      }
      const dx = e.clientX - lastX;
      ele.scrollLeft -= dx;
      lastX = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      pauseUntil.current = Date.now() + 5000; // Pause for 5 seconds after dragging
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <section ref={sectionRef} id="services" style={{ padding: "8rem 0", backgroundColor: "var(--lp2-bg-primary)", position: "relative", overflow: "hidden" }}>
      <div className="lp2-container">
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.6 }}
           style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "var(--lp2-sp-12)", width: "100%", textAlign: "center" }}
        >
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <p className="lp2-section-label" style={{ marginBottom: 0 }}>DỊCH VỤ CỦA LOOPS</p>
          </div>
        </motion.div>
      </div>

      {displayServices.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 2rem", textAlign: "center" }}>
          <p style={{ color: "var(--lp2-text-muted)", fontSize: "1.1rem" }}>Chưa có dịch vụ nào hoạt động trong CSDL.</p>
        </div>
      ) : (
        <div style={{ position: "relative", width: "100%" }}>
           {/* Blur gradients for smooth fade out at edges */}
           <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "1.5vw", background: "linear-gradient(to right, var(--lp2-bg-primary) 0%, transparent 100%)", zIndex: 10, pointerEvents: "none" }} />
           <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "1.5vw", background: "linear-gradient(to left, var(--lp2-bg-primary) 0%, transparent 100%)", zIndex: 10, pointerEvents: "none" }} />
           
           <div 
             ref={scrollContainerRef}
             onMouseDown={handleDragStart}
             style={{ 
               display: "flex", 
               gap: "16px", 
               padding: "20px 0 40px 0",
               overflowX: "auto",
               cursor: "grab",
               msOverflowStyle: "none",
               scrollbarWidth: "none"
             }}
           >
             <style>{`
               div::-webkit-scrollbar {
                 display: none;
               }
             `}</style>
             {/* Render the list 4 times to guarantee enough buffer for true infinite scrolling */}
             {[...displayServices, ...displayServices, ...displayServices, ...displayServices].map((svc, idx) => (
               <SlantedCard key={`${svc.id}-${idx}`} svc={svc} />
             ))}
           </div>
        </div>
      )}
    </section>
  );
}
