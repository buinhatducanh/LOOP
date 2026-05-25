"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { rgba } from "@/components/ui/utils";
import { ArrowRight } from "lucide-react";

interface PricingPlan {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  price: number | null;
  period: string;
  tagline: string;
  taglineEn?: string;
  features: string[];
  highlighted: boolean;
}

interface Props {
  locale: string;
  badge: string;
  heading: string;
  btnContact: string;
  planStarter: string;
  planStarterPrice: string;
  planStarterPeriod: string;
  planStarterFeatures: string;
  planProfessional: string;
  planProfessionalPrice: string;
  planProfessionalPeriod: string;
  planProfessionalFeatures: string;
  planEnterprise: string;
  planEnterprisePrice: string;
  planEnterprisePeriod: string;
  planEnterpriseFeatures: string;
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ flexShrink: 0, marginTop: 3 }}
    >
      <circle cx="7" cy="7" r="7" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M4 7.5L6 9.5L10 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PricingCard({
  name,
  price,
  period,
  tagline,
  features,
  highlighted,
  ctaLabel,
  locale,
  index,
}: {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlighted: boolean;
  ctaLabel: string;
  locale: string;
  index: number;
}) {
  const cardBg = rgba(DS.bgCard, 0.8);
  const borderColor = highlighted ? rgba(DS.pink, 0.4) : rgba(DS.border, 0.5);
  const btnBg = highlighted ? DS.pink : rgba(DS.bgCard, 0.9);
  const btnColor = highlighted ? "#ffffff" : DS.text;
  const btnBorder = highlighted ? "transparent" : rgba(DS.border, 0.8);
  const btnHover = highlighted
    ? rgba(DS.pinkLight, 0.9)
    : rgba(DS.bgCard, 0.6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      style={{
        position: "relative",
        borderRadius: "1.25rem",
        border: `1px solid ${borderColor}`,
        background: cardBg,
        backdropFilter: "blur(16px)",
        padding: highlighted ? "2.5rem 2rem" : "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        boxShadow: highlighted
          ? `0 0 40px ${rgba(DS.pink, 0.15)}, 0 8px 32px rgba(0,0,0,0.12)`
          : `0 4px 24px rgba(0,0,0,0.06)`,
        transform: highlighted ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Popular badge */}
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            background: DS.pink,
            color: "#fff",
            fontSize: "0.6875rem",
            fontWeight: 700,
            fontFamily: DS.mono,
            letterSpacing: "0.1em",
            padding: "4px 16px",
            borderRadius: "9999px",
            whiteSpace: "nowrap",
          }}
        >
          PHỔ BIẾN NHẤT
        </div>
      )}

      {/* Header */}
      <div>
        <div
          style={{
            fontFamily: DS.heading,
            fontSize: "1.125rem",
            fontWeight: 800,
            color: DS.text,
            marginBottom: "0.25rem",
          }}
        >
          {name}
        </div>
        {tagline && (
          <div
            style={{
              fontSize: "0.8125rem",
              color: DS.text4,
              lineHeight: 1.5,
            }}
          >
            {tagline}
          </div>
        )}
      </div>

      {/* Price */}
      <div style={{ borderTop: `1px solid ${rgba(DS.border, 0.4)}`, paddingTop: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
          <span
            style={{
              fontFamily: DS.heading,
              fontSize: "2.25rem",
              fontWeight: 900,
              color: highlighted ? DS.pink : DS.text,
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          {period && (
            <span style={{ color: DS.text4, fontSize: "0.875rem" }}>{period}</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
        {features.map((feat, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              fontSize: "0.875rem",
              color: DS.text3,
              lineHeight: 1.5,
            }}
          >
            <CheckIcon />
            <span style={{ color: DS.text2 }}>{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={`/${locale}/contact`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.875rem 1.5rem",
          borderRadius: "0.875rem",
          border: `1px solid ${btnBorder}`,
          background: btnBg,
          color: btnColor,
          fontSize: "0.9375rem",
          fontWeight: 700,
          textDecoration: "none",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = btnHover;
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = btnBg;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {ctaLabel}
        <ArrowRight size={15} />
      </Link>
    </motion.div>
  );
}

export function PricingSection({
  locale,
  badge,
  heading,
  btnContact,
  planStarter,
  planStarterPrice,
  planStarterPeriod,
  planStarterFeatures,
  planProfessional,
  planProfessionalPrice,
  planProfessionalPeriod,
  planProfessionalFeatures,
  planEnterprise,
  planEnterprisePrice,
  planEnterprisePeriod,
  planEnterpriseFeatures,
}: Props) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const isVi = locale === "vi";

  useEffect(() => {
    fetch("/api/v1/pricing")
      .then((r) => r.json())
      .then((d) => {
        if (d.data && Array.isArray(d.data)) setPlans(d.data);
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, []);

  // Build display plans — DB plans first, else fallback static
  const displayPlans = plans.length > 0
    ? plans.map((p) => ({
        name: isVi ? p.name : (p.nameEn ?? p.name),
        price: p.price != null
          ? p.price === 0
            ? "Miễn phí"
            : `${p.price.toLocaleString()}đ`
          : "Liên hệ",
        period: p.period,
        tagline: isVi ? p.tagline : (p.taglineEn ?? p.tagline),
        features: p.features ?? [],
        highlighted: p.highlighted,
      }))
    : [
        {
          name: planStarter,
          price: planStarterPrice,
          period: planStarterPeriod,
          tagline: "",
          features: planStarterFeatures.split(",").map((s) => s.trim()),
          highlighted: false,
        },
        {
          name: planProfessional,
          price: planProfessionalPrice,
          period: planProfessionalPeriod,
          tagline: "",
          features: planProfessionalFeatures.split(",").map((s) => s.trim()),
          highlighted: true,
        },
        {
          name: planEnterprise,
          price: planEnterprisePrice,
          period: planEnterprisePeriod,
          tagline: "",
          features: planEnterpriseFeatures.split(",").map((s) => s.trim()),
          highlighted: false,
        },
      ];

  return (
    <section
      style={{
        padding: "5rem 1.5rem 6rem",
        background: rgba(DS.bg, 0.5),
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <div
            style={{
              display: "inline-block",
              color: DS.text4,
              fontSize: "0.6875rem",
              fontFamily: DS.mono,
              letterSpacing: "0.2em",
              marginBottom: "0.75rem",
              padding: "4px 12px",
              borderRadius: "9999px",
              border: `1px solid ${rgba(DS.pink, 0.3)}`,
              background: rgba(DS.pink, 0.06),
            }}
          >
            {badge}
          </div>
          <h2
            style={{
              fontFamily: DS.heading,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 900,
              color: "var(--light-text, #0F172A)",
              margin: 0,
              letterSpacing: "0.02em",
            }}
          >
            {heading}
          </h2>
        </motion.div>

        {/* Cards */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.25rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  borderRadius: "1.25rem",
                  border: `1px solid ${rgba(DS.border, 0.3)}`,
                  height: "420px",
                  background: rgba(DS.bgCard, 0.4),
                  animation: "pricingShimmer 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
              alignItems: "stretch",
            }}
          >
            {displayPlans.map((plan, i) => (
              <PricingCard
                key={i}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                tagline={plan.tagline}
                features={plan.features}
                highlighted={plan.highlighted}
                ctaLabel={btnContact}
                locale={locale}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes pricingShimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
