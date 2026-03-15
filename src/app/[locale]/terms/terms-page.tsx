"use client";

import { useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, useInView } from "motion/react";
import { FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

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

function SectionCard({
  number,
  title,
  children,
  delay = 0,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div
        style={{
          background: "#0F172A",
          border: "1px solid #1F2937",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 900,
              background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
              minWidth: "36px",
            }}
          >
            {number}
          </div>
          <h2
            style={{
              color: "#FFFFFF",
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
        <div style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.8, paddingLeft: "52px" }}>
          {children}
        </div>
      </div>
    </FadeIn>
  );
}

export function TermsPage() {
  const t = useTranslations("TermsPage");
  const locale = useLocale();

  const breadcrumbs = [
    { label: t("breadcrumbHome"), href: `/${locale}` },
    { label: t("breadcrumbTerms") },
  ];

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
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <Breadcrumbs items={breadcrumbs} locale={locale} />
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
            <FileText size={14} color="#6366F1" />
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
              fontSize: "16px",
              lineHeight: 1.7,
              maxWidth: "680px",
            }}
          >
            {t("heroDesc")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              color: "#64748B",
              fontSize: "14px",
              marginTop: "16px",
            }}
          >
            {t("lastUpdated")}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <SectionCard number="01" title={t("section1Title")} delay={0}>
            <p>{t("section1P1")}</p>
            <p style={{ marginTop: "12px" }}>{t("section1P2")}</p>
          </SectionCard>

          <SectionCard number="02" title={t("section2Title")} delay={0.05}>
            <p>{t("section2P1")}</p>
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li style={{ marginBottom: "8px" }}>{t("section2Item1")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section2Item2")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section2Item3")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section2Item4")}</li>
            </ul>
          </SectionCard>

          <SectionCard number="03" title={t("section3Title")} delay={0.1}>
            <p>{t("section3P1")}</p>
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li style={{ marginBottom: "8px" }}>{t("section3Item1")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section3Item2")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section3Item3")}</li>
            </ul>
          </SectionCard>

          <SectionCard number="04" title={t("section4Title")} delay={0.15}>
            <p>{t("section4P1")}</p>
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li style={{ marginBottom: "8px" }}>{t("section4Item1")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section4Item2")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section4Item3")}</li>
            </ul>
          </SectionCard>

          <SectionCard number="05" title={t("section5Title")} delay={0.2}>
            <p>{t("section5P1")}</p>
            <p style={{ marginTop: "12px" }}>{t("section5P2")}</p>
          </SectionCard>

          <SectionCard number="06" title={t("section6Title")} delay={0.25}>
            <p>{t("section6P1")}</p>
            <p style={{ marginTop: "12px" }}>{t("section6P2")}</p>
          </SectionCard>

          <SectionCard number="07" title={t("section7Title")} delay={0.3}>
            <p>{t("section7P1")}</p>
            <p style={{ marginTop: "12px" }}>{t("section7P2")}</p>
          </SectionCard>

          <SectionCard number="08" title={t("section8Title")} delay={0.35}>
            <p>{t("section8P1")}</p>
          </SectionCard>

          <SectionCard number="09" title={t("section9Title")} delay={0.4}>
            <p>{t("section9P1")}</p>
            <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
              <li style={{ marginBottom: "8px" }}>{t("section9Item1")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section9Item2")}</li>
              <li style={{ marginBottom: "8px" }}>{t("section9Item3")}</li>
            </ul>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
