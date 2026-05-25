"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  { id: 1, q: "LOOPS cung cấp những dịch vụ gì?", a: "LOOPS cung cấp giải pháp toàn diện bao gồm: Thiết kế Website, Sản xuất Media (quay phim, chụp ảnh), Digital Marketing (SEO, Ads, Content), Branding Strategy, Phát triển App Mobile và Tư vấn chiến lược chuyển đổi số." },
  { id: 2, q: "Thời gian thực hiện một dự án website là bao lâu?", a: "Thời gian thực hiện phụ thuộc vào quy mô dự án. Thông thường website cơ bản mất 7–14 ngày, website thương mại điện tử 21–30 ngày, và web app tùy chỉnh từ 45–90 ngày." },
  { id: 3, q: "Chi phí thiết kế website tại LOOPS như thế nào?", a: "Chi phí khởi điểm từ 9.900.000₫ cho gói Starter. Giá cụ thể phụ thuộc vào yêu cầu, số trang và tính năng. Chúng tôi tư vấn miễn phí và báo giá chi tiết trước khi ký hợp đồng — không phát sinh chi phí ẩn." },
  { id: 4, q: "LOOPS có hỗ trợ sau khi bàn giao không?", a: "Có. Tất cả dự án đều được bảo hành ít nhất 6 tháng. Gói Business và Enterprise được hỗ trợ 24/7 với account manager riêng." },
  { id: 5, q: "Làm thế nào để bắt đầu hợp tác với LOOPS?", a: "Rất đơn giản! Điền vào form tư vấn miễn phí hoặc liên hệ qua hotline. Chuyên gia của chúng tôi sẽ liên hệ trong vòng 2 giờ làm việc." },
  { id: 6, q: "LOOPS có kinh nghiệm với doanh nghiệp ngành tài chính/bất động sản không?", a: "Có. Chúng tôi đã thực hiện hơn 500 dự án đa dạng ngành nghề, bao gồm tài chính ngân hàng (VPBank, ACB), bất động sản, F&B, thời trang, y tế và giáo dục." },
];

export function LP2FAQ({ dbFaqs }: { dbFaqs?: any[] }) {
  const [open, setOpen] = useState<string | number | null>(null);
  const isInitial = useRef(true);

  const items = dbFaqs && dbFaqs.length > 0
    ? dbFaqs.map(item => ({
      id: item.id,
      q: item.question,
      a: item.answer
    }))
    : faqs;

  // Set first item open by default
  useEffect(() => {
    if (items.length > 0 && open === null) {
      setOpen(items[0].id);
    }
  }, [items, open]);

  // Scroll active item into view when opened (but skip initial mount scroll)
  useEffect(() => {
    if (open !== null) {
      if (isInitial.current) {
        isInitial.current = false;
        return;
      }
      const activeEl = document.getElementById(`lp2-faq-item-${open}`);
      if (activeEl) {
        const timer = setTimeout(() => {
          activeEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 400); // 400ms delay to let the 350ms Framer Motion height animation fully complete
        return () => clearTimeout(timer);
      }
    }
  }, [open]);

  return (
    <section id="faq" className="lp2-section-pad" style={{ backgroundColor: "var(--lp2-bg-primary)", position: "relative" }}>
      <div className="lp2-container">
        <div className="lp2-grid-faq">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ position: "sticky", top: "calc(var(--lp2-navbar-h) + var(--lp2-sp-8))" }}>
            <p className="lp2-section-label" style={{ marginBottom: "var(--lp2-sp-4)" }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: "var(--lp2-fw-extrabold)", letterSpacing: "var(--lp2-ls-tight)", color: "var(--lp2-text-primary)", marginBottom: "var(--lp2-sp-5)", lineHeight: "var(--lp2-lh-tight)" }}>Câu hỏi<br />thường gặp</h2>
            <p style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-muted)", lineHeight: "var(--lp2-lh-relaxed)", marginBottom: "var(--lp2-sp-8)", fontFamily: "var(--lp2-font-sans)" }}>Không tìm thấy câu trả lời bạn cần? Liên hệ với chúng tôi ngay.</p>
            <a href="#contact" className="lp2-btn-primary">Liên hệ hỗ trợ</a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 24 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true, margin: "-80px" }} 
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
            className="lp2-faq-scroll-container"
          >
            {items.map((faq, index) => {
              const isOpen = open === faq.id;
              const numberStr = (index + 1).toString().padStart(2, "0");
              return (
                <div 
                  key={faq.id} 
                  id={`lp2-faq-item-${faq.id}`}
                  className={`lp2-faq-item ${isOpen ? "is-open" : ""}`}
                >
                  <button 
                    onClick={() => setOpen(isOpen ? null : faq.id)} 
                    className="lp2-faq-button"
                  >
                    <span className="lp2-faq-number">{numberStr}</span>
                    <span className="lp2-faq-question" style={{ fontWeight: isOpen ? "var(--lp2-fw-bold)" : "var(--lp2-fw-semibold)" }}>
                      {faq.q}
                    </span>
                    <span className="lp2-faq-icon-wrapper">
                      <Plus 
                        size={13} 
                        color={isOpen ? "var(--lp2-bg-primary)" : "var(--lp2-text-primary)"} 
                        strokeWidth={2.5} 
                        style={{ transition: "color 0.3s ease" }}
                      />
                    </span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
                        style={{ overflow: "hidden" }}
                      >
                        <p className="lp2-faq-answer">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
