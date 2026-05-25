"use client";
import { useState } from "react";
import { Check, ArrowRight, Zap } from "lucide-react";
import { motion } from "motion/react";

const plans = [
  { id: "starter", name: "Starter", tagline: "Phù hợp cho startup & doanh nghiệp vừa", price: "9.900.000", unit: "₫", period: "/ gói dự án", highlight: false, badge: "", features: ["Thiết kế website 5 trang", "Chuẩn UX/UI, Responsive", "Tích hợp SEO cơ bản", "1 tháng hỗ trợ miễn phí", "Bàn giao source code", "Bảo hành 6 tháng"], cta: "Chọn gói Starter" },
  { id: "business", name: "Business", tagline: "Giải pháp toàn diện cho doanh nghiệp", price: "24.900.000", unit: "₫", period: "/ gói dự án", highlight: true, badge: "Phổ biến nhất", features: ["Tất cả từ gói Starter", "Website không giới hạn trang", "Thiết kế UI/UX cao cấp", "Digital Marketing 3 tháng", "Sản xuất video giới thiệu", "SEO toàn diện + Analytics", "Hỗ trợ 24/7 trong 3 tháng", "Miễn phí cập nhật 1 năm"], cta: "Chọn gói Business" },
  { id: "enterprise", name: "Enterprise", tagline: "Giải pháp tùy chỉnh cho tập đoàn lớn", price: "49.900.000", unit: "₫", period: "/ gói dự án", highlight: false, badge: "", features: ["Tất cả từ gói Business", "Thiết kế Brand Identity đầy đủ", "Phát triển App Mobile iOS/Android", "Chiến dịch Marketing 6 tháng", "Video production chuyên nghiệp", "Tư vấn chiến lược hàng tháng", "Account manager riêng", "SLA ưu tiên 24/7"], cta: "Liên hệ ngay" },
];

function PricingCard({ plan, index }: { plan: typeof plans[0]; index: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <motion.div initial={{ opacity: 0, scale: 0.88 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }} style={{ position: "relative", transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) ${plan.highlight ? "translateY(-12px)" : ""}`, transition: "transform 0.2s ease-out", willChange: "transform" }} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 6, y: -((e.clientY - r.top) / r.height - 0.5) * 6 }); }} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      {plan.badge && (
        <div style={{ position: "absolute", top: "calc(-1 * var(--lp2-sp-4))", left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--lp2-accent-blue)", color: "#fff", fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-bold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", padding: "0.375rem 1rem", borderRadius: "var(--lp2-r-full)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "var(--lp2-sp-1)", boxShadow: "0 4px 16px rgba(0,85,204,0.3)", zIndex: 1, fontFamily: "var(--lp2-font-sans)" }}>
          <Zap size={10} fill="white" />{plan.badge}
        </div>
      )}
      <div style={{ backgroundColor: plan.highlight ? "var(--lp2-bg-dark)" : "var(--lp2-bg-primary)", borderRadius: "var(--lp2-r-3xl)", border: plan.highlight ? "1px solid var(--lp2-border-dark)" : "1.5px solid var(--lp2-border-light)", padding: "var(--lp2-sp-8)", boxShadow: plan.highlight ? "var(--lp2-shadow-2xl)" : "var(--lp2-shadow-sm)", height: "100%" }}>
        <div style={{ marginBottom: "var(--lp2-sp-6)" }}>
          <h3 style={{ fontSize: "var(--lp2-fs-xl)", fontWeight: "var(--lp2-fw-bold)", color: plan.highlight ? "var(--lp2-text-inverse)" : "var(--lp2-text-primary)", marginBottom: "var(--lp2-sp-2)", letterSpacing: "var(--lp2-ls-snug)" }}>{plan.name}</h3>
          <p style={{ fontSize: "var(--lp2-fs-sm)", color: plan.highlight ? "rgba(255,255,255,0.5)" : "var(--lp2-text-muted)", fontFamily: "var(--lp2-font-sans)" }}>{plan.tagline}</p>
        </div>
        <div style={{ marginBottom: "var(--lp2-sp-8)", paddingBottom: "var(--lp2-sp-8)", borderBottom: `1px solid ${plan.highlight ? "rgba(255,255,255,0.1)" : "var(--lp2-border-light)"}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--lp2-sp-1)", marginBottom: "var(--lp2-sp-1)" }}>
            <span style={{ fontSize: "var(--lp2-fs-sm)", color: plan.highlight ? "rgba(255,255,255,0.5)" : "var(--lp2-text-muted)", fontFamily: "var(--lp2-font-sans)" }}>từ</span>
            <span style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: "var(--lp2-fw-extrabold)", color: plan.highlight ? "var(--lp2-text-inverse)" : "var(--lp2-text-primary)", lineHeight: 1, letterSpacing: "var(--lp2-ls-tight)" }}>{plan.price}{plan.unit}</span>
          </div>
          <p style={{ fontSize: "var(--lp2-fs-sm)", color: plan.highlight ? "rgba(255,255,255,0.4)" : "var(--lp2-text-light)", fontFamily: "var(--lp2-font-sans)" }}>{plan.period}</p>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--lp2-sp-4)", marginBottom: "var(--lp2-sp-8)" }}>
          {plan.features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "var(--lp2-sp-3)" }}>
              <span style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "var(--lp2-r-full)", backgroundColor: plan.highlight ? "rgba(255,255,255,0.12)" : "var(--lp2-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "1px" }}><Check size={11} color={plan.highlight ? "rgba(255,255,255,0.9)" : "var(--lp2-text-secondary)"} strokeWidth={3} /></span>
              <span style={{ fontSize: "var(--lp2-fs-sm)", color: plan.highlight ? "rgba(255,255,255,0.75)" : "var(--lp2-text-secondary)", lineHeight: "var(--lp2-lh-snug)", fontFamily: "var(--lp2-font-sans)" }}>{f}</span>
            </li>
          ))}
        </ul>
        <a href="#contact" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--lp2-sp-2)", padding: "0.9375rem var(--lp2-sp-6)", borderRadius: "var(--lp2-r-full)", fontSize: "var(--lp2-fs-sm)", fontWeight: "var(--lp2-fw-semibold)", cursor: "pointer", transition: "all var(--lp2-t-base)", border: plan.highlight ? "none" : "1.5px solid var(--lp2-border-medium)", backgroundColor: plan.highlight ? "var(--lp2-bg-primary)" : "transparent", color: "var(--lp2-text-primary)", textDecoration: "none", fontFamily: "var(--lp2-font-sans)" }}>{plan.cta} <ArrowRight size={14} /></a>
      </div>
    </motion.div>
  );
}

export function LP2Pricing() {
  return (
    <section id="pricing" className="lp2-section-pad" style={{ backgroundColor: "var(--lp2-bg-secondary)", position: "relative" }}>
      <div className="lp2-container">
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ textAlign: "center", marginBottom: "var(--lp2-sp-16)" }}>
          <p className="lp2-section-label" style={{ justifyContent: "center", marginBottom: "var(--lp2-sp-4)" }}>BẢNG GIÁ DỊCH VỤ</p>
          <h2 style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", marginBottom: "var(--lp2-sp-4)", color: "var(--lp2-text-primary)", lineHeight: "var(--lp2-lh-tight)" }}>Gói giải pháp phù hợp<br /><span style={{ color: "var(--lp2-text-muted)" }}>với mọi doanh nghiệp</span></h2>
          <p style={{ fontSize: "var(--lp2-fs-md)", color: "var(--lp2-text-muted)", maxWidth: "480px", margin: "0 auto", fontFamily: "var(--lp2-font-sans)" }}>Linh hoạt, minh bạch và được thiết kế để mang lại giá trị tối đa cho từng ngân sách.</p>
        </motion.div>
        <div className="lp2-grid-3" style={{ alignItems: "end" }}>
          {plans.map((plan, i) => (<PricingCard key={plan.id} plan={plan} index={i} />))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} style={{ textAlign: "center", marginTop: "var(--lp2-sp-10)", fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-light)", fontFamily: "var(--lp2-font-sans)" }}>
          Cần giải pháp tùy chỉnh?{" "}<a href="#contact" style={{ color: "var(--lp2-text-primary)", fontWeight: "var(--lp2-fw-semibold)", borderBottom: "1px solid var(--lp2-text-primary)" }}>Liên hệ chúng tôi</a>{" "}để được tư vấn miễn phí.
        </motion.p>
      </div>
    </section>
  );
}
