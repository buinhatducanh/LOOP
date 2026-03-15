"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Building2, GitBranch, ShoppingCart, Rocket, Code2, ArrowRight, MessageSquare, type LucideIcon } from "lucide-react";
import { formatVND } from "@/data/pricingPackages";

const iconMap: Record<string, LucideIcon> = {
  Building2, GitBranch, ShoppingCart, Rocket, Code2,
};

interface Service {
  id: string;
  icon: string;
  title: string;
  shortDescription: string;
  startingPrice: number;
  deliveryTime: string;
  category: string;
}

export function ServiceCard({ service }: { service: Service }) {
  const router = useRouter();
  const t = useTranslations("ServiceCard");
  const Icon = iconMap[service.icon] || Code2;

  return (
    <motion.div
      whileHover={{ y: -6, borderColor: "#3B82F6", boxShadow: "0 24px 60px rgba(59,130,246,0.15)" }}
      onClick={() => router.push(`/services/${service.id}`)}
      style={{
        background: "#0F172A",
        border: "1px solid #1F2937",
        borderRadius: "16px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Hover glow bg */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #3B82F6, #6366F1)" }}
      />

      {/* Category badge */}
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <span style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {service.category}
        </span>
      </div>

      {/* Icon */}
      <motion.div
        whileHover={{ rotate: 8, scale: 1.1 }}
        style={{ width: "52px", height: "52px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Icon size={24} color="#6366F1" />
      </motion.div>

      {/* Content */}
      <div>
        <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{service.title}</h3>
        <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: "1.6" }}>{service.shortDescription}</p>
      </div>

      {/* Price & Time */}
      <div style={{ display: "flex", gap: "16px", paddingTop: "8px", borderTop: "1px solid #1F2937" }}>
        <div>
          <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("priceFrom")}</p>
          <p style={{ color: "#3B82F6", fontSize: "18px", fontWeight: 700 }}>{formatVND(service.startingPrice)}</p>
        </div>
        <div style={{ borderLeft: "1px solid #1F2937", paddingLeft: "16px" }}>
          <p style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("deliveryTime")}</p>
          <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600 }}>{service.deliveryTime}</p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); router.push(`/services/${service.id}`); }}
          style={{ flex: 1, background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          {t("viewDetails")} <ArrowRight size={13} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, opacity: 0.9 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); router.push(`/contact?service=${service.id}`); }}
          style={{ flex: 1, background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <MessageSquare size={13} /> {t("getQuote")}
        </motion.button>
      </div>
    </motion.div>
  );
}
