"use client";
import { useRef } from "react";
import { Search, Lightbulb, Rocket, BarChart2 } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";

const IMG_RESEARCH = "https://images.unsplash.com/photo-1759884247289-f9f3db44988e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_STRATEGY = "https://images.unsplash.com/photo-1695634281254-e94a29d234c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_PRODUCTION = "https://images.unsplash.com/photo-1765120220066-b8170030012d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
const IMG_GROWTH = "https://images.unsplash.com/photo-1586448317606-cb1ec00298fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

const steps = [
  { num: "01", icon: Search, title: "Khám phá & Phân tích", desc: "Nghiên cứu chuyên sâu về thị trường, đối thủ và mục tiêu doanh nghiệp để xây dựng nền tảng chiến lược vững chắc.", duration: "3–5 ngày", image: IMG_RESEARCH },
  { num: "02", icon: Lightbulb, title: "Chiến lược & Ý tưởng", desc: "Đề xuất chiến lược sáng tạo, concept thiết kế và lộ trình triển khai được cá nhân hóa cho từng doanh nghiệp.", duration: "5–7 ngày", image: IMG_STRATEGY },
  { num: "03", icon: Rocket, title: "Sản xuất & Triển khai", desc: "Đội ngũ chuyên gia thực thi từng hạng mục theo tiêu chuẩn cao nhất, đảm bảo tiến độ và chất lượng tuyệt đối.", duration: "14–30 ngày", image: IMG_PRODUCTION },
  { num: "04", icon: BarChart2, title: "Tối ưu & Tăng trưởng", desc: "Theo dõi hiệu suất, báo cáo định kỳ và liên tục tối ưu để đảm bảo tăng trưởng bền vững.", duration: "Liên tục", image: IMG_GROWTH },
];

export function LP2WorkProcess() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const collageY = useTransform(scrollYProgress, [0, 1], ["30px", "-30px"]);

  return (
    <section ref={sectionRef} id="process" className="lp2-section-pad" style={{ backgroundColor: "var(--lp2-bg-primary)", position: "relative" }}>
      <div className="lp2-container">
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: "var(--lp2-sp-16)" }}>
          <p className="lp2-section-label" style={{ marginBottom: "var(--lp2-sp-4)" }}>QUY TRÌNH LÀM VIỆC</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "var(--lp2-sp-6)" }}>
            <h2 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", lineHeight: "var(--lp2-lh-tight)", color: "var(--lp2-text-primary)" }}>4 bước tạo nên<br /><span style={{ color: "var(--lp2-text-muted)" }}>thành công</span></h2>
            <p style={{ fontSize: "var(--lp2-fs-base)", color: "var(--lp2-text-muted)", maxWidth: "340px", lineHeight: "var(--lp2-lh-relaxed)", fontFamily: "var(--lp2-font-sans)" }}>Quy trình minh bạch, có kiểm soát và được thiết kế để mang lại kết quả tốt nhất.</p>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--lp2-sp-12)", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--lp2-sp-4)" }}>
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.num} initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", gap: "var(--lp2-sp-5)", alignItems: "flex-start", padding: "var(--lp2-sp-5) var(--lp2-sp-6)", borderRadius: "var(--lp2-r-2xl)", border: "1px solid var(--lp2-border-light)", backgroundColor: "var(--lp2-bg-primary)", boxShadow: "var(--lp2-shadow-card)", transition: "box-shadow var(--lp2-t-slow), transform var(--lp2-t-slow)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--lp2-shadow-card-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--lp2-shadow-card)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div style={{ width: "96px", height: "80px", borderRadius: "var(--lp2-r-xl)", overflow: "hidden", flexShrink: 0, backgroundColor: "var(--lp2-bg-secondary)", position: "relative" }}>
                    <img src={step.image} alt={step.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    <span style={{ position: "absolute", top: "6px", left: "6px", fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-bold)", color: "white", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", borderRadius: "var(--lp2-r-sm)", padding: "2px 6px", letterSpacing: "var(--lp2-ls-wider)", fontFamily: "var(--lp2-font-sans)" }}>{step.num}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-2)", marginBottom: "var(--lp2-sp-2)" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "var(--lp2-r-md)", backgroundColor: "var(--lp2-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={14} color="var(--lp2-text-muted)" strokeWidth={1.8} />
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--lp2-sp-1)", fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", color: "var(--lp2-text-secondary)", backgroundColor: "var(--lp2-bg-secondary)", border: "1px solid var(--lp2-border-light)", borderRadius: "var(--lp2-r-full)", padding: "2px var(--lp2-sp-3)", fontFamily: "var(--lp2-font-sans)" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--lp2-accent-blue)", display: "inline-block" }} />{step.duration}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-bold)", color: "var(--lp2-text-primary)", marginBottom: "var(--lp2-sp-2)", letterSpacing: "var(--lp2-ls-snug)" }}>{step.title}</h3>
                    <p style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-muted)", lineHeight: "var(--lp2-lh-relaxed)", fontFamily: "var(--lp2-font-sans)" }}>{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div style={{ position: "relative", height: "100%", minHeight: "600px", y: collageY }} className="lp2-hide-md">
            {/* Main Center Image */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", top: "5%", right: "0", width: "75%", height: "70%", borderRadius: "var(--lp2-r-3xl)", overflow: "hidden", boxShadow: "var(--lp2-shadow-2xl)", zIndex: 2, transform: "rotate(2deg)" }}>
              <img src="https://images.unsplash.com/photo-1742540425845-8d8dabe893ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" alt="Production" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>
            
            {/* Top Left Image */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", top: "0", left: "0", width: "60%", height: "45%", borderRadius: "var(--lp2-r-3xl)", overflow: "hidden", boxShadow: "var(--lp2-shadow-xl)", zIndex: 1, transform: "rotate(-4deg)" }}>
              <img src="https://images.unsplash.com/photo-1641998148499-cb6b55a3c0d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" alt="Office" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>

            {/* Bottom Left Image */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", bottom: "0", left: "10%", width: "55%", height: "40%", borderRadius: "var(--lp2-r-3xl)", overflow: "hidden", boxShadow: "var(--lp2-shadow-lg)", zIndex: 3, transform: "rotate(-2deg)" }}>
              <img src="https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" alt="Development" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>

            {/* Bottom Right Image */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ position: "absolute", bottom: "10%", right: "-10%", width: "50%", height: "35%", borderRadius: "var(--lp2-r-3xl)", overflow: "hidden", boxShadow: "var(--lp2-shadow-xl)", zIndex: 4, transform: "rotate(3deg)" }}>
              <img src="https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800" alt="Team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
