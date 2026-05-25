"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  { id: 0, quote: "LOOPS đã giúp chúng tôi xây dựng một hệ sinh thái số hoàn chỉnh. Website mới tăng tỷ lệ chuyển đổi lên 240% chỉ sau 3 tháng đầu ra mắt. Đội ngũ chuyên nghiệp, hiểu sâu về business.", name: "Nguyễn Anh Tuấn", title: "CEO, The Coffee House", avatar: "https://images.unsplash.com/photo-1738566061505-556830f8b8f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", rating: 5, metric: "+240%", metricLabel: "Conversion Rate" },
  { id: 1, quote: "Sự hài lòng của khách hàng là ưu tiên hàng đầu tại LOOPS. Họ không chỉ làm đẹp mà còn tư vấn chiến lược thực sự có giá trị. Campaign VPBank Prime đạt kết quả vượt kỳ vọng.", name: "Lê Thanh Hương", title: "Marketing Director, VPBank", avatar: "https://images.unsplash.com/photo-1758600587839-56ba05596c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", rating: 5, metric: "15M", metricLabel: "Lượt tiếp cận" },
  { id: 2, quote: "Bộ nhận diện thương hiệu LOOPS thiết kế cho TNO Holdings được đánh giá cao nhất trong lịch sử công ty. Chúng tôi đã nhận được nhiều phản hồi tích cực từ đối tác quốc tế.", name: "Phan Quốc Việt", title: "Chairman, TNO Holdings", avatar: "https://images.unsplash.com/photo-1758873269035-aae0e1fd3422?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", rating: 5, metric: "#1", metricLabel: "Brand Score" },
];

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: n }).map((_, i) => (<svg key={i} width="14" height="14" viewBox="0 0 14 14"><path d="M7 1l1.545 3.13 3.455.502-2.5 2.437.59 3.44L7 8.885l-3.09 1.624.59-3.44L2 4.632l3.455-.502L7 1z" fill="white" /></svg>))}
    </div>
  );
}

export function LP2Testimonials() {
  const [active, setActive] = useState(0);
  const current = testimonials[active];
  const prev = () => setActive((a) => (a === 0 ? testimonials.length - 1 : a - 1));
  const next = () => setActive((a) => (a === testimonials.length - 1 ? 0 : a + 1));
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const leftY = useTransform(scrollYProgress, [0, 1], ["15px", "-15px"]);

  return (
    <section ref={sectionRef} id="testimonials" className="lp2-section-pad" style={{ backgroundColor: "var(--lp2-bg-secondary)", position: "relative" }}>
      <div className="lp2-container">
        <div className="lp2-grid-testimonials">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ position: "sticky", top: "calc(var(--lp2-navbar-h) + var(--lp2-sp-8))", y: leftY }}>
            <p className="lp2-section-label" style={{ marginBottom: "var(--lp2-sp-4)" }}>KHÁCH HÀNG NÓI GÌ</p>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", color: "var(--lp2-text-primary)", marginBottom: "var(--lp2-sp-6)", lineHeight: "var(--lp2-lh-tight)" }}>Kết quả thực tế từ khách hàng</h2>
            <p style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-muted)", lineHeight: "var(--lp2-lh-relaxed)", marginBottom: "var(--lp2-sp-8)", fontFamily: "var(--lp2-font-sans)" }}>Hơn 500 doanh nghiệp đã tin tưởng LOOPS để xây dựng và phát triển thương hiệu số.</p>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--lp2-sp-3)" }}>
              <button onClick={prev} style={{ width: "44px", height: "44px", borderRadius: "var(--lp2-r-full)", border: "1.5px solid var(--lp2-border-medium)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--lp2-t-base)" }}><ChevronLeft size={18} /></button>
              <button onClick={next} style={{ width: "44px", height: "44px", borderRadius: "var(--lp2-r-full)", border: "1.5px solid var(--lp2-border-medium)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--lp2-t-base)" }}><ChevronRight size={18} /></button>
              <span style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-light)", fontFamily: "var(--lp2-font-sans)", marginLeft: "var(--lp2-sp-2)" }}>{String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</span>
            </div>
            <div style={{ display: "flex", gap: "var(--lp2-sp-2)", marginTop: "var(--lp2-sp-6)" }}>
              {testimonials.map((_, i) => (<button key={i} onClick={() => setActive(i)} style={{ width: active === i ? "24px" : "6px", height: "6px", borderRadius: "var(--lp2-r-full)", backgroundColor: active === i ? "var(--lp2-text-primary)" : "var(--lp2-border-medium)", border: "none", cursor: "pointer", transition: "all var(--lp2-t-slow)", padding: 0 }} />))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: "var(--lp2-bg-primary)", borderRadius: "var(--lp2-r-3xl)", border: "1px solid var(--lp2-border-light)", boxShadow: "var(--lp2-shadow-xl)", overflow: "hidden" }}>
              <div style={{ backgroundColor: "var(--lp2-bg-dark)", padding: "var(--lp2-sp-8)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--lp2-sp-6)" }}>
                <div>
                  <p style={{ fontSize: "var(--lp2-fs-5xl)", fontWeight: "var(--lp2-fw-extrabold)", color: "white", letterSpacing: "var(--lp2-ls-tight)", lineHeight: 1 }}>{current.metric}</p>
                  <p style={{ fontSize: "var(--lp2-fs-sm)", color: "rgba(255,255,255,0.55)", marginTop: "var(--lp2-sp-1)", fontFamily: "var(--lp2-font-sans)" }}>{current.metricLabel}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Stars n={current.rating} />
                  <p style={{ fontSize: "var(--lp2-fs-xs)", color: "rgba(255,255,255,0.4)", marginTop: "var(--lp2-sp-2)", fontFamily: "var(--lp2-font-sans)" }}>Đánh giá xác thực</p>
                </div>
              </div>
              <div style={{ padding: "var(--lp2-sp-8)", borderBottom: "1px solid var(--lp2-border-light)" }}>
                <p style={{ fontSize: "var(--lp2-fs-lg)", lineHeight: "var(--lp2-lh-relaxed)", color: "var(--lp2-text-secondary)", fontStyle: "italic", fontFamily: "var(--lp2-font-sans)" }}>&ldquo;{current.quote}&rdquo;</p>
              </div>
              <div style={{ padding: "var(--lp2-sp-6) var(--lp2-sp-8)", display: "flex", alignItems: "center", gap: "var(--lp2-sp-4)" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "var(--lp2-r-full)", overflow: "hidden", flexShrink: 0, border: "2px solid var(--lp2-border-light)" }}>
                  <img src={current.avatar} alt={current.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <p style={{ fontSize: "var(--lp2-fs-base)", fontWeight: "var(--lp2-fw-bold)", color: "var(--lp2-text-primary)", fontFamily: "var(--lp2-font-sans)" }}>{current.name}</p>
                  <p style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-muted)", fontFamily: "var(--lp2-font-sans)" }}>{current.title}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
