"use client";

import { useRef, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { motion, useInView } from "motion/react";
import { ArrowRight, DollarSign, HelpCircle, Check, Calculator } from "lucide-react";
import { pricingPlans as mockPlans } from "@/data/mockData";
import { PricingCard } from "@/components/cards/PricingCard";

type PlanData = (typeof mockPlans)[number];

const getFaqs = (t: any) => [
  { q: t("faq1_q"), a: t("faq1_a") },
  { q: t("faq2_q"), a: t("faq2_a") },
  { q: t("faq3_q"), a: t("faq3_a") },
  { q: t("faq4_q"), a: t("faq4_a") },
  { q: t("faq5_q"), a: t("faq5_a") },
];

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PricingPage({ plans: pricingPlans = mockPlans }: { plans?: PlanData[] }) {
  const router = useRouter();
  const t = useTranslations("PricingPage");

  const faqs = useMemo(() => getFaqs(t), [t]);
  const features = useMemo(() => [
    t("feat1"), t("feat2"), t("feat3"), t("feat4"),
    t("feat5"), t("feat6"), t("feat7"), t("feat8"),
  ], [t]);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Header */}
      <section
        style={{
          padding: "80px 24px 60px",
          background: "linear-gradient(to bottom, rgba(59,130,246,0.05), transparent)",
          borderBottom: "1px solid #1F2937",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "40px",
              padding: "6px 16px 6px 10px",
              marginBottom: "24px",
            }}
          >
            <DollarSign size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
              {t("badge")}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-2px",
              marginBottom: "20px",
            }}
          >
            {t("heroTitle1")} <GradientText>{t("heroHighlight")}</GradientText>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: "#94A3B8",
              fontSize: "18px",
              lineHeight: 1.7,
              maxWidth: "580px",
              margin: "0 auto",
            }}
          >
            {t("heroDesc")}
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "80px 24px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {pricingPlans.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 0.1}>
              <PricingCard plan={plan} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Custom Calculator CTA */}
      <section style={{ padding: "40px 24px 0" }}>
        <FadeIn>
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.08))",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1, minWidth: "250px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calculator size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                  Cần báo giá theo nhu cầu riêng?
                </h3>
              </div>
              <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6 }}>
                Sử dụng công cụ tính giá tùy chỉnh — chọn từng tính năng bạn cần và nhận báo giá tức thì.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/pricing/calculator")}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 20px rgba(99,102,241,0.25)",
                whiteSpace: "nowrap",
              }}
            >
              <Calculator size={16} />
              Tùy chỉnh Báo giá <ArrowRight size={14} />
            </motion.button>
          </div>
        </FadeIn>
      </section>

      {/* All Plans Include */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <FadeIn>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 800,
                letterSpacing: "-1px",
                textAlign: "center",
                marginBottom: "40px",
              }}
            >
              {t("featuresTitle1")} <GradientText>{t("featuresHighlight")}</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {features.map((item) => (
                <div
                  key={item}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0" }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(34,197,94,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={13} color="#22C55E" />
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "15px" }}>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <HelpCircle size={32} color="#6366F1" style={{ marginBottom: "16px" }} />
              <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px" }}>
                {t("faqTitle1")} <GradientText>{t("faqHighlight")}</GradientText>
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div
                  style={{
                    background: "#0F172A",
                    border: "1px solid #1F2937",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}>
                    {faq.q}
                  </h3>
                  <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7 }}>
                    {faq.a}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          textAlign: "center",
        }}
      >
        <FadeIn>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>
              {t("ctaTitle")}
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
              {t("ctaDesc")}
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/contact")}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#fff",
                border: "none",
                padding: "14px 32px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 30px rgba(99,102,241,0.3)",
              }}
            >
              {t("btnContact")} <ArrowRight size={16} />
            </motion.button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
