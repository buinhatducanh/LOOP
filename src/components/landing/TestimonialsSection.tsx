"use client";

/**
 * TestimonialsSection — Auto-scrolling carousel of customer testimonials
 * Fetches from /api/v1/testimonials, fallback to static data
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

type TestimonialRecord = {
 id: string;
 name: string;
 avatar?: string | null;
 role?: string | null;
 company?: string | null;
 rating?: number | null;
 text?: string | null;
};

const FALLBACK_TESTIMONIALS: TestimonialRecord[] = [
 {
 id: "1",
 name: "Nguyễn Văn Minh",
 role: "CEO",
 company: "Công ty ABC",
 rating: 5,
 text: "LOOP đã giúp chúng tôi tăng trưởng doanh thu 300% sau khi triển khai website mới. Đội ngũ chuyên nghiệp, timeline đúng hẹn.",
 avatar: null,
 },
 {
 id: "2",
 name: "Trần Thị Lan",
 role: "Marketing Director",
 company: "DEF Corp",
 rating: 5,
 text: "Hệ thống LP của LOOP là điều tuyệt vời — khách hàng của tôi rất thích được thưởng LP khi hoàn thành dự án.",
 avatar: null,
 },
 {
 id: "3",
 name: "Lê Hoàng Nam",
 role: "Founder",
 company: "Startup XYZ",
 rating: 5,
 text: "Team LOOP hiểu rõ nhu cầu của startup. Website MVP hoàn thành chỉ trong 3 tuần với chi phí hợp lý.",
 avatar: null,
 },
 {
 id: "4",
 name: "Phạm Thu Hà",
 role: "Head of Digital",
 company: "GHI Group",
 rating: 5,
 text: "Dashboard analytics LOOP xây cho chúng tôi giúp theo dõi KPI real-time. Độ chính xác và tốc độ rất ấn tượng.",
 avatar: null,
 },
 {
 id: "5",
 name: "Đặng Minh Tuấn",
 role: "Operations Manager",
 company: "JKL Solutions",
 rating: 5,
 text: "Quy trình minh bạch, báo cáo chi tiết hàng tuần. Lần đầu tiên tôi thấy agency nào hỗ trợ hậu kỳ tốt như LOOP.",
 avatar: null,
 },
 {
 id: "6",
 name: "Hoàng Thị Mai",
 role: "Director",
 company: "MNO Retail",
 rating: 5,
 text: "Website thương mại điện tử tích hợp LP rewards giúp tăng tỷ lệ quay lại của khách hàng lên 40%.",
 avatar: null,
 },
];

function StarRating({ rating }: { rating: number }) {
 return (
 <div style={{ display: "flex", gap: "0.125rem" }}>
 {[1, 2, 3, 4, 5].map((n) => (
 <Star
 key={n}
 size={12}
 style={{ color: n <= rating ? DS.gold : DS.text5 }}
 fill={n <= rating ? DS.gold : "transparent"}
 />
 ))}
 </div>
 );
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialRecord }) {
 return (
 <div
 style={{
 padding: "1.5rem",
 borderRadius: "1rem",
 background: "rgba(15,23,42,0.8)",
 border: `1px solid rgba(236,72,153,0.15)`,
 backdropFilter: "blur(16px)",
 height: "100%",
 display: "flex",
 flexDirection: "column",
 gap: "1rem",
 }}
 >
 {/* Quote */}
 <div
 style={{
 flex: 1,
 color: DS.text2,
 fontSize: "0.875rem",
 lineHeight: 1.8,
 fontStyle: "italic",
 position: "relative",
 paddingLeft: "1rem",
 borderLeft: `2px solid ${DS.pink}40`,
 }}
 >
 "{testimonial.text}"
 </div>

 {/* Author */}
 <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
 {/* Avatar */}
 <div
 style={{
 width: 44,
 height: 44,
 borderRadius: "50%",
 overflow: "hidden",
 border: `2px solid ${DS.pink}40`,
 flexShrink: 0,
 background: "rgba(107,61,245,0.2)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}
 >
 {testimonial.avatar ? (
 <img
 src={testimonial.avatar}
 alt={testimonial.name}
 style={{ width: "100%", height: "100%", objectFit: "cover" }}
 />
 ) : (
 <span
 style={{
 fontFamily: DS.heading,
 fontSize: "1rem",
 fontWeight: 900,
 color: DS.pink,
 }}
 >
 {testimonial.name.charAt(0)}
 </span>
 )}
 </div>

 <div style={{ flex: 1, minWidth: 0 }}>
 <div
 style={{
 color: DS.text,
 fontSize: "0.8125rem",
 fontWeight: 700,
 lineHeight: 1.3,
 }}
 >
 {testimonial.name}
 </div>
 <div
 style={{
 color: DS.text4,
 fontSize: "0.6875rem",
 lineHeight: 1.3,
 }}
 >
 {testimonial.role}
 {testimonial.role && testimonial.company ? " · " : ""}
 {testimonial.company}
 </div>
 </div>

 <StarRating rating={testimonial.rating ?? 5} />
 </div>
 </div>
 );
}

export function TestimonialsSection({ locale }: { locale: string }) {
 const t = useTranslations("home");
 const [testimonials, setTestimonials] = useState<TestimonialRecord[]>(FALLBACK_TESTIMONIALS);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isPaused, setIsPaused] = useState(false);
 const [visibleCount, setVisibleCount] = useState(3);

 // Fetch from API
 useEffect(() => {
 async function fetchTestimonials() {
 try {
 const baseUrl = typeof window !== "undefined"
 ? window.location.origin
 : process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
 const res = await fetch(`${baseUrl}/api/v1/testimonials?lang=${locale}`, {
 next: { revalidate: 120 },
 });
 if (res.ok) {
 const json = await res.json();
 const data = Array.isArray(json.data) ? json.data : [];
 if (data.length > 0) {
 setTestimonials(data.slice(0, 6));
 }
 }
 } catch { /* use fallback */ }
 }
 fetchTestimonials();
 }, [locale]);

 // Responsive visible count
 useEffect(() => {
 const update = () => {
 if (window.innerWidth < 640) setVisibleCount(1);
 else if (window.innerWidth < 1024) setVisibleCount(2);
 else setVisibleCount(3);
 };
 update();
 window.addEventListener("resize", update);
 return () => window.removeEventListener("resize", update);
 }, []);

 // Auto-advance
 useEffect(() => {
 if (isPaused) return;
 const timer = setInterval(() => {
 setCurrentIndex((prev) => (prev + visibleCount) % testimonials.length);
 }, 5000);
 return () => clearInterval(timer);
 }, [isPaused, visibleCount, testimonials.length]);

 const maxIndex = testimonials.length - visibleCount;
 const canPrev = currentIndex > 0;
 const canNext = currentIndex < maxIndex;

 const prev = () => setCurrentIndex((prev) => Math.max(0, prev - visibleCount));
 const next = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + visibleCount));

 const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + visibleCount);

 return (
 <section
 style={{
 padding: "5rem 1.5rem",
 background: `linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(2,6,23,0) 100%)`,
 position: "relative",
 overflow: "hidden",
 }}
 >
 {/* Background accent */}
 <div
 style={{
 position: "absolute",
 top: "50%",
 left: "50%",
 transform: "translate(-50%, -50%)",
 width: "60%",
 height: "60%",
 background: `radial-gradient(ellipse, rgba(236,72,153,0.05) 0%, transparent 70%)`,
 pointerEvents: "none",
 }}
 />

 <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 style={{ textAlign: "center", marginBottom: "3rem" }}
 >
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "1rem",
 padding: "0.375rem 1rem",
 borderRadius: "9999px",
 background: `${DS.pink}10`,
 border: `1px solid ${DS.pink}25`,
 }}
 >
 <div
 style={{
 width: 6, height: 6, borderRadius: "50%",
 background: DS.pink, boxShadow: `0 0 6px ${DS.pink}`,
 }}
 />
 <span
 style={{
 color: DS.pinkLight,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.22em",
 }}
 >
 {t("testimonialsBadge") || "ĐÁNH GIÁ KHÁCH HÀNG"}
 </span>
 </div>
 <h2
 style={{
 fontFamily: DS.heading,
 fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
 fontWeight: 900,
 letterSpacing: "0.04em",
 background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 100%)`,
 WebkitBackgroundClip: "text",
 WebkitTextFillColor: "transparent",
 backgroundClip: "text",
 marginBottom: "0.875rem",
 }}
 >
 {t("testimonialsTitle")}
 </h2>
 <p style={{ color: DS.text3, fontSize: "0.9375rem", lineHeight: 1.7 }}>
 {t("testimonialsDesc")}
 </p>
 </motion.div>

 {/* Carousel */}
 <div
 style={{ position: "relative" }}
 onMouseEnter={() => setIsPaused(true)}
 onMouseLeave={() => setIsPaused(false)}
 >
 {/* Cards */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: `repeat(${visibleCount}, 1fr)`,
 gap: "1rem",
 }}
 >
 <AnimatePresence mode="popLayout">
 {visibleTestimonials.map((testimonial, i) => (
 <motion.div
 key={testimonial.id}
 initial={{ opacity: 0, x: 30 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -30 }}
 transition={{ duration: 0.4, delay: i * 0.08 }}
 layout
 >
 <TestimonialCard testimonial={testimonial} />
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {/* Navigation arrows */}
 {testimonials.length > visibleCount && (
 <>
 <button
 onClick={prev}
 disabled={!canPrev}
 style={{
 position: "absolute",
 left: "-1rem",
 top: "50%",
 transform: "translateY(-50%)",
 width: 40,
 height: 40,
 borderRadius: "50%",
 background: canPrev ? "rgba(15,23,42,0.9)" : "rgba(15,23,42,0.3)",
 border: `1px solid ${canPrev ? DS.pink + "40" : DS.border}`,
 color: canPrev ? DS.pink : DS.text5,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 cursor: canPrev ? "pointer" : "not-allowed",
 transition: "all 0.2s ease",
 zIndex: 10,
 }}
 >
 <ChevronLeft size={18} />
 </button>
 <button
 onClick={next}
 disabled={!canNext}
 style={{
 position: "absolute",
 right: "-1rem",
 top: "50%",
 transform: "translateY(-50%)",
 width: 40,
 height: 40,
 borderRadius: "50%",
 background: canNext ? "rgba(15,23,42,0.9)" : "rgba(15,23,42,0.3)",
 border: `1px solid ${canNext ? DS.pink + "40" : DS.border}`,
 color: canNext ? DS.pink : DS.text5,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 cursor: canNext ? "pointer" : "not-allowed",
 transition: "all 0.2s ease",
 zIndex: 10,
 }}
 >
 <ChevronRight size={18} />
 </button>
 </>
 )}
 </div>

 {/* Dots */}
 {testimonials.length > visibleCount && (
 <div
 style={{
 display: "flex",
 justifyContent: "center",
 gap: "0.375rem",
 marginTop: "1.5rem",
 }}
 >
 {Array.from({ length: Math.ceil(testimonials.length / visibleCount) }).map((_, i) => (
 <button
 key={i}
 onClick={() => setCurrentIndex(i * visibleCount)}
 style={{
 width: i * visibleCount === currentIndex ? 24 : 8,
 height: 8,
 borderRadius: 4,
 background:
 i * visibleCount === currentIndex
 ? DS.pink
 : DS.text5,
 border: "none",
 cursor: "pointer",
 transition: "all 0.3s ease",
 opacity: i * visibleCount === currentIndex ? 1 : 0.35,
 }}
 />
 ))}
 </div>
 )}
 </div>
 </section>
 );
}
