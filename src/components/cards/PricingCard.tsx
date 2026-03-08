"use client";

import { useRouter } from "next/navigation";
import { Check, X, Zap } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price: number | null;
  period: string;
  tagline: string;
  features: string[];
  notIncluded: string[];
  highlighted: boolean;
  cta: string;
  color: string;
}

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  const router = useRouter();

  return (
    <div
      style={{
        background: plan.highlighted ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))" : "#0F172A",
        border: plan.highlighted ? "2px solid #6366F1" : "1px solid #1F2937",
        borderRadius: "20px",
        padding: "36px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        position: "relative",
        transition: "all 0.3s ease",
        boxShadow: plan.highlighted ? "0 0 40px rgba(99, 102, 241, 0.2)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!plan.highlighted) {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = plan.color;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = `0 20px 60px ${plan.color}25`;
        }
      }}
      onMouseLeave={(e) => {
        if (!plan.highlighted) {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "#1F2937";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }
      }}
    >
      {/* Popular Badge */}
      {plan.highlighted && (
        <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)" }}>
          <span style={{
            background: "linear-gradient(135deg, #3B82F6, #6366F1)",
            color: "#FFFFFF",
            padding: "4px 18px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}>
            <Zap size={11} /> MOST POPULAR
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 style={{ color: plan.highlighted ? "#FFFFFF" : "#94A3B8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "4px" }}>
          {plan.name}
        </h3>
        <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "1.5" }}>{plan.tagline}</p>
      </div>

      {/* Price */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
        {plan.price !== null ? (
          <>
            <span style={{ color: "#94A3B8", fontSize: "22px", fontWeight: 400, marginBottom: "4px" }}>$</span>
            <span style={{
              fontSize: "52px",
              fontWeight: 800,
              background: plan.highlighted ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "none",
              color: plan.highlighted ? "transparent" : "#FFFFFF",
              WebkitBackgroundClip: plan.highlighted ? "text" : "initial",
              WebkitTextFillColor: plan.highlighted ? "transparent" : "#FFFFFF",
              lineHeight: 1,
            }}>
              {plan.price.toLocaleString("en-US")}
            </span>
            <span style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "8px" }}>/ {plan.period}</span>
          </>
        ) : (
          <span style={{ color: "#FFFFFF", fontSize: "36px", fontWeight: 800, lineHeight: 1 }}>Custom</span>
        )}
      </div>

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {plan.features.map((feature) => (
          <div key={feature} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: plan.highlighted ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "rgba(59,130,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Check size={11} color="#FFFFFF" />
            </div>
            <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{feature}</span>
          </div>
        ))}
        {plan.notIncluded.map((feature) => (
          <div key={feature} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={11} color="#4B5563" />
            </div>
            <span style={{ color: "#4B5563", fontSize: "14px" }}>{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/contact")}
        style={{
          width: "100%",
          background: plan.highlighted ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "transparent",
          color: plan.highlighted ? "#FFFFFF" : plan.color,
          border: plan.highlighted ? "none" : `1px solid ${plan.color}`,
          padding: "14px",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: plan.highlighted ? "0 0 30px rgba(99, 102, 241, 0.4)" : "none",
          marginTop: "auto",
        }}
        onMouseEnter={(e) => {
          if (!plan.highlighted) {
            (e.currentTarget as HTMLElement).style.background = plan.color;
            (e.currentTarget as HTMLElement).style.color = "#fff";
          } else {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!plan.highlighted) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = plan.color;
          } else {
            (e.currentTarget as HTMLElement).style.opacity = "1";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }
        }}
      >
        {plan.cta}
      </button>
    </div>
  );
}
