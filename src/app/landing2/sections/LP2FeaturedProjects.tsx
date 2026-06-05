"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { ProjectFocusMode, type FocusProject } from "@/components/landing/ProjectFocusMode";

const projects = [
  { id: 0, client: "The Coffee House", category: "Website Design + E-commerce", year: "2024", desc: "Redesign toàn bộ hệ thống website thương mại điện tử cho chuỗi cà phê hàng đầu Việt Nam. Tăng tỷ lệ chuyển đổi lên 240% sau 3 tháng.", result: "+240% Conversion", image: "https://images.unsplash.com/photo-1565791930080-5b787f230e28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 1, client: "VPBank Prime", category: "Digital Campaign + Branding", year: "2024", desc: "Chiến dịch truyền thông số toàn diện cho sản phẩm thẻ tín dụng cao cấp. Đạt 15 triệu lượt tiếp cận trong vòng 30 ngày.", result: "15M Lượt tiếp cận", image: "https://images.unsplash.com/photo-1640323240640-ee731d18dcb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 2, client: "TNO Holdings", category: "Corporate Video + Brand Identity", year: "2023", desc: "Sản xuất video doanh nghiệp và xây dựng bộ nhận diện thương hiệu mới cho tập đoàn TNO. Tăng lưu lượng truy cập tự nhiên lên 290%.", result: "Brand Overhaul", image: "https://images.unsplash.com/photo-1758873269035-aae0e1fd3422?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
  { id: 3, client: "Cleo Bridal", category: "Editorial Photography + Lookbook", year: "2023", desc: "Chụp ảnh và quay video editorial lookbook cho BST váy cưới cao cấp mùa Thu-Đông. Thúc đẩy doanh thu leads tiềm năng tăng 310%.", result: "3 BST Ra mắt", image: "https://images.unsplash.com/photo-1742540425845-8d8dabe893ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" },
];

function ProjectSlantedCard({ project, onClick }: { project: any; onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
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
        WebkitBackfaceVisibility: "hidden",
        WebkitTransform: "translateZ(0) skewX(-10deg)",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "-60px",
          right: "-60px",
          transform: "skewX(10deg)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <motion.img 
          src={project.image} 
          alt={project.client}
          draggable={false}
          animate={{ 
            scale: isHovered ? 1.05 : 1, 
            filter: isHovered ? "brightness(0.9)" : "brightness(0.55)" 
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
        
        {/* Gradient Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)", zIndex: 1 }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 80px 2.5rem 80px", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", flex: 1 }}>
           
           <motion.div 
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}
           >
              {/* Category + Year */}
              <p style={{ fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: 0, fontFamily: "var(--lp2-font-sans)" }}>
                {project.category} · {project.year}
              </p>

              {/* Client Name */}
              <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25, fontFamily: "var(--lp2-font-display)" }}>
                {project.client}
              </h3>
           </motion.div>

           <div>
              {/* Short Description */}
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.25rem", fontFamily: "var(--lp2-font-sans)" }}>
                {project.desc}
              </p>
              
              {/* Result Pill Badge */}
              {project.result && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.725rem", fontWeight: "700", padding: "6px 12px", borderRadius: "8px", background: "var(--lp2-accent-blue)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", backdropFilter: "blur(4px)", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0, 85, 204, 0.25)" }}>
                    {project.result}
                  </span>
                </div>
              )}
           </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

export function LP2FeaturedProjects({ dbProjects }: { dbProjects?: any[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  
  const displayProjects = dbProjects && dbProjects.length > 0
    ? dbProjects.map((p) => ({
        id: p.id,
        client: p.client || p.title,
        category: p.category,
        year: p.year,
        desc: p.description,
        result: p.results || p.primaryMetric || "",
        image: p.image,
        tech: p.techStack && p.techStack.length > 0 ? p.techStack : ["Next.js", "React", "Tailwind CSS"],
        metrics: p.primaryMetric && p.roiMetric
          ? [{ label: p.roiMetric, value: p.primaryMetric }, { label: "Năm", value: p.year || "2024" }]
          : [{ label: "Hiệu quả", value: p.results || p.primaryMetric || "Thành công" }, { label: "Năm", value: p.year || "2024" }],
      }))
    : projects.map((p) => ({
        ...p,
        tech: p.id === 0
          ? ["Next.js", "Three.js", "Shopify", "Tailwind CSS"]
          : p.id === 1
          ? ["React Native", "Framer Motion", "Stripe", "Firebase"]
          : p.id === 2
          ? ["Vue 3", "Node.js", "PostgreSQL", "D3.js"]
          : ["Next.js", "Tailwind CSS", "WordPress", "HubSpot"],
        metrics: p.id === 0
          ? [{ label: "Conversion", value: "+240%" }, { label: "MRR", value: "+180%" }]
          : p.id === 1
          ? [{ label: "Lượt Tiếp Cận", value: "15M" }, { label: "Tương Tác", value: "+320%" }]
          : p.id === 2
          ? [{ label: "Brand Overhaul", value: "100%" }, { label: "Organic Traffic", value: "+290%" }]
          : [{ label: "BST Ra Mắt", value: "3" }, { label: "Qualified Leads", value: "+310%" }],
      }));

  const isDragging = useRef(false);
  const pauseUntil = useRef(0);

  useEffect(() => {
    if (displayProjects.length === 0) return;
    let animationFrameId: number;
    
    // Each card is 380px wide + 16px gap
    const itemWidth = 380;
    const gap = 16;
    const setWidth = (itemWidth + gap) * displayProjects.length;

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
  }, [displayProjects.length]);

  // Drag-to-scroll logic
  const handleDragStart = (e: React.MouseEvent) => {
    const ele = scrollContainerRef.current;
    if (!ele) return;
    isDragging.current = true;
    let lastX = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
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
      pauseUntil.current = Date.now() + 5000; // Pause scroll auto-animation for 5 seconds after drag
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Map chosen project to FocusProject interface
  const focusProject: FocusProject | null = selectedProject ? {
    id: String(selectedProject.id),
    name: selectedProject.client || selectedProject.name || "Dự án",
    industry: selectedProject.category || "Phần mềm & Website",
    description: selectedProject.desc || selectedProject.description || "Chi tiết dự án đang được cập nhật...",
    thumbnail: selectedProject.image || selectedProject.thumbnail || "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
    metrics: selectedProject.metrics || [
      { label: "Hiệu quả", value: selectedProject.result || "Thành công" }
    ],
    tech: selectedProject.tech || ["Next.js", "React", "Tailwind CSS"],
    accentHue: "240",
  } : null;

  return (
    <>
      <section id="projects" className="lp2-section-pad" style={{ backgroundColor: "var(--lp2-bg-secondary)", position: "relative", overflow: "hidden" }}>
        {/* Top Header */}
        <div className="lp2-container">
          <motion.div 
            initial={{ opacity: 0, y: 32 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-80px" }} 
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--lp2-sp-12)", gap: "var(--lp2-sp-8)", flexWrap: "wrap" }}
          >
            <div>
              <p className="lp2-section-label" style={{ marginBottom: "var(--lp2-sp-4)" }}>DỰ ÁN TIÊU BIỂU</p>
              <h2 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: "var(--lp2-lh-tight)", color: "var(--lp2-text-primary)" }}>
                Tác phẩm đã<br />
                <span style={{ color: "var(--lp2-text-muted)" }}>thay đổi ngành</span>
              </h2>
            </div>
            <a href="#contact" className="lp2-btn-outline">
              Tất cả dự án <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>

        {displayProjects.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 2rem", textAlign: "center" }}>
            <p style={{ color: "var(--lp2-text-muted)", fontSize: "1.1rem" }}>Chưa có dự án nào.</p>
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%" }}>
             {/* Left and right fade blur overlays */}
             <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "2vw", background: "linear-gradient(to right, var(--lp2-bg-secondary) 0%, transparent 100%)", zIndex: 10, pointerEvents: "none" }} />
             <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "2vw", background: "linear-gradient(to left, var(--lp2-bg-secondary) 0%, transparent 100%)", zIndex: 10, pointerEvents: "none" }} />
             
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
               
               {/* Repeat display list 4 times for infinite looping illusion */}
               {[...displayProjects, ...displayProjects, ...displayProjects, ...displayProjects].map((project, idx) => (
                 <ProjectSlantedCard 
                   key={`${project.id}-${idx}`} 
                   project={project} 
                   onClick={() => setSelectedProject(project)}
                 />
               ))}
             </div>
          </div>
        )}
      </section>

      {/* Cinematic Focus Mode Modal */}
      <ProjectFocusMode 
        project={focusProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </>
  );
}
