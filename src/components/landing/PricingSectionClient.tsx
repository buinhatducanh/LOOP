"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PricingSection } from "@/components/landing/PricingSection";
import { PricingRentalSection } from "@/components/landing/PricingRentalSection";

type PricingMode = "buy" | "rental";

interface PricingSectionClientProps {
  locale: string;
  // Buy mode translations
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

export function PricingSectionClient(props: PricingSectionClientProps) {
  const [mode, setMode] = useState<PricingMode>("buy");

  return (
    <div className="min-h-screen" style={{ background: "var(--ds-bg, #0C0C14)" }}>
      {/* Toggle */}
      <div className="flex justify-center pt-12 pb-8">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-full"
          style={{ background: "#1E293B" }}
        >
          <button
            onClick={() => setMode("buy")}
            className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: mode === "buy" ? "#EC4899" : "transparent",
              color: mode === "buy" ? "#FFFFFF" : "#94A3B8",
              boxShadow: mode === "buy" ? "0 2px 8px rgba(236,72,153,0.3)" : "none",
            }}
          >
            Mua trọn gói
          </button>
          <button
            onClick={() => setMode("rental")}
            className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              background: mode === "rental" ? "#2D6BFF" : "transparent",
              color: mode === "rental" ? "#FFFFFF" : "#94A3B8",
              boxShadow: mode === "rental" ? "0 2px 8px rgba(45,107,255,0.3)" : "none",
            }}
          >
            Thuê theo tháng
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === "buy" ? (
          <motion.div
            key="buy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <PricingSection {...props} />
          </motion.div>
        ) : (
          <motion.div
            key="rental"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <PricingRentalSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
