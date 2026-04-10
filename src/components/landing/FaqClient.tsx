"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Search, ArrowUp, MessageCircle } from "lucide-react";
import { DS, GRD, GLOW } from "@/lib/design-tokens";

type FaqRecord = {
  id: string;
  question: string | null;
  answer: string | null;
  category: string;
  sortOrder: number;
};

const CATEGORY_CONFIG: Record<string, { labelKey: string; color: string; bg: string }> = {
  general:    { labelKey: "filterGeneral",   color: DS.text2, bg: "rgba(148,163,184,0.08)" },
  services:   { labelKey: "filterServices",  color: DS.cosmicPurple, bg: "rgba(107,61,245,0.12)" },
  technical:  { labelKey: "filterTechnical", color: DS.cosmicBlue, bg: "rgba(79,125,243,0.12)" },
  payment:    { labelKey: "filterPayment",   color: "#14B8A6", bg: "rgba(20,184,166,0.10)" },
  lp:         { labelKey: "filterLp",        color: DS.pink, bg: "rgba(236,72,153,0.10)" },
  academy:    { labelKey: "filterAcademy",   color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

type CategoryFilter = "all" | (typeof ALL_CATEGORIES)[number];

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqRecord;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const catCfg = CATEGORY_CONFIG[faq.category] ?? CATEGORY_CONFIG.general;

  return (
    <motion.div
      style={{
        background: DS.bgCard,
        border: `1px solid ${isOpen ? hexRgba(catCfg.color, 0.4) : DS.border}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.25s ease",
      }}
    >
      {/* Question row */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 22px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-expanded={isOpen}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: catCfg.color,
              marginTop: 7,
              flexShrink: 0,
              boxShadow: `0 0 8px ${hexRgba(catCfg.color, 0.6)}`,
            }}
          />
          <span
            style={{
              color: isOpen ? DS.text : DS.text2,
              fontSize: 15,
              fontWeight: isOpen ? 600 : 500,
              lineHeight: 1.5,
              transition: "color 0.2s ease",
            }}
          >
            {faq.question ?? "—"}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ color: catCfg.color, flexShrink: 0, marginTop: 2 }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Answer accordion */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 22px 20px 42px",
                borderTop: `1px solid ${DS.border}`,
                paddingTop: 16,
              }}
            >
              <p
                style={{
                  color: DS.text3,
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: faq.answer ?? "" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FaqClient({
  locale,
  initialFaqs,
  initialCategories,
}: {
  locale: string;
  initialFaqs: FaqRecord[];
  initialCategories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [showBackTop, setShowBackTop] = useState(false);

  // Scroll listener for back-to-top
  if (typeof window !== "undefined") {
    const handleScroll = () => setShowBackTop(window.scrollY > 400);
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
  }

  const filtered = useMemo(() => {
    let list = initialFaqs;
    if (activeCategory !== "all") {
      list = list.filter((f) => f.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          (f.question ?? "").toLowerCase().includes(q) ||
          (f.answer ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [initialFaqs, activeCategory, searchQuery]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Display categories — always show all known + any from DB
  const displayCategories = ALL_CATEGORIES;

  // JSON-LD FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: initialFaqs.map((f) => ({
      "@type": "Question",
      name: f.question ?? "",
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer ?? "",
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main style={{ background: DS.bg, minHeight: "100vh" }}>
        {/* Hero */}
        <section
          style={{
            padding: "80px 24px 60px",
            background: "linear-gradient(180deg, rgba(107,61,245,0.06) 0%, transparent 100%)",
            textAlign: "center",
            borderBottom: `1px solid ${DS.border}`,
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                padding: "6px 16px",
                borderRadius: 9999,
                background: "rgba(107,61,245,0.08)",
                border: `1px solid rgba(107,61,245,0.2)`,
              }}
            >
              <span
                style={{
                  color: DS.cosmicPurple,
                  fontSize: 10,
                  fontFamily: DS.mono,
                  letterSpacing: "0.22em",
                }}
              >
                FAQ — LOOP SOLUTIONS
              </span>
            </div>

            <h1
              style={{
                fontFamily: DS.heading,
                fontSize: "clamp(32px, 6vw, 56px)",
                fontWeight: 900,
                letterSpacing: "0.05em",
                background: GRD.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: 18,
                lineHeight: 1.1,
              }}
            >
              CÂU HỎI THƯỜNG GẶP
            </h1>

            <p
              style={{
                color: DS.text3,
                fontSize: 16,
                lineHeight: 1.7,
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              Tìm nhanh câu trả lời cho mọi thắc mắc về dịch vụ, quy trình, thanh
              toán và hệ thống LP của LOOP Solutions.
            </p>
          </div>
        </section>

        {/* Category filters + search */}
        <section style={{ padding: "32px 24px 0", maxWidth: 860, margin: "0 auto" }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: DS.text4,
              }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 16px 13px 46px",
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
                borderRadius: 12,
                color: DS.text,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = DS.cosmicPurple)}
              onBlur={(e) => (e.currentTarget.style.borderColor = DS.border)}
            />
          </div>

          {/* Category tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setActiveCategory("all")}
              style={{
                padding: "7px 18px",
                borderRadius: 9999,
                border: `1px solid ${activeCategory === "all" ? DS.cosmicPurple : DS.border}`,
                background:
                  activeCategory === "all"
                    ? "rgba(107,61,245,0.12)"
                    : "transparent",
                color: activeCategory === "all" ? DS.cosmicPurple : DS.text3,
                fontSize: 13,
                fontWeight: activeCategory === "all" ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              Tất cả
            </button>
            {displayCategories.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.general;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as CategoryFilter)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 9999,
                    border: `1px solid ${isActive ? cfg.color : DS.border}`,
                    background: isActive ? cfg.bg : "transparent",
                    color: isActive ? cfg.color : DS.text3,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cfg.labelKey === "filterGeneral" ? "Chung" :
                   cfg.labelKey === "filterServices" ? "Dịch vụ" :
                   cfg.labelKey === "filterTechnical" ? "Kỹ thuật" :
                   cfg.labelKey === "filterPayment" ? "Thanh toán" :
                   cfg.labelKey === "filterLp" ? "Hệ thống LP" :
                   cfg.labelKey === "filterAcademy" ? "Học viện" : cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* FAQ list */}
        <section style={{ padding: "32px 24px 80px", maxWidth: 860, margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: DS.text4,
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 12,
                  opacity: 0.4,
                }}
              >
                🔍
              </div>
              <p style={{ fontSize: 16 }}>Không tìm thấy câu hỏi phù hợp</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Thử thay đổi từ khóa hoặc danh mục
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((faq, i) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <FaqItem
                    faq={faq}
                    isOpen={openIds.has(faq.id)}
                    onToggle={() => toggleOpen(faq.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Still have questions CTA */}
          {filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                marginTop: 64,
                padding: "36px 32px",
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
                borderRadius: 20,
                textAlign: "center",
                boxShadow: GLOW.cardShadow,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(236,72,153,0.1)",
                  border: `1px solid rgba(236,72,153,0.2)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <MessageCircle size={24} style={{ color: DS.pink }} />
              </div>
              <h3
                style={{
                  color: DS.text,
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Vẫn có thắc mắc?
              </h3>
              <p
                style={{
                  color: DS.text3,
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 24,
                  maxWidth: 400,
                  margin: "0 auto 24px",
                }}
              >
                Đội ngũ LOOP luôn sẵn sàng hỗ trợ bạn 24/7. Liên hệ ngay để được
                tư vấn miễn phí.
              </p>
              <Link
                href={`/${locale}/lien-he`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  background: GRD.primary,
                  color: "#fff",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: GLOW.pink,
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Liên hệ ngay
              </Link>
            </motion.div>
          )}
        </section>

        {/* Back to top */}
        <AnimatePresence>
          {showBackTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              style={{
                position: "fixed",
                bottom: 32,
                right: 32,
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
                color: DS.text3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: GLOW.purple,
                zIndex: 50,
              }}
              title="Lên đầu trang"
            >
              <ArrowUp size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
