"use client";

/**
 * ServicesClient — LOOP Solutions Services Page
 * 3-tab layout matching FE design: Web Packages / Custom Services / Pricing
 * PackageModal with trial/buy flow
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ChevronRight, ChevronDown, ChevronUp, CheckCircle2, Sparkles,
  Zap as ZapAlt, X, Play, ShoppingCart,
  Globe, Code2, BarChart3, TrendingUp,
  LayoutGrid, List, CalendarClock, Eye,
  Phone,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import type { ServicesPackage } from "@/app/data/locales/services-vi";

const fmtVND = (n: number | null | undefined, fallbackLabel = "—") =>
  n == null ? fallbackLabel : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const _fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

const CAT_ICONS: Record<string, string> = {
  "an-uong": "🍜",
  "suc-khoe": "💆",
  "luu-tru": "🏨",
  "bat-dong-san": "🏠",
  "khac": "📦",
};

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "tabWebPackage" | "tabCustom" | "tabPricing";
type Category = "an-uong" | "suc-khoe" | "luu-tru" | "bat-dong-san" | "khac";
type SortBy = "popular" | "price-asc" | "price-desc";
type LayoutMode = "grid" | "list";

interface CustomService {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  features: string[];
  priceFrom: number;
  color: string;
  image: string;
  tags: string[];
}

// ── PackageModal ──────────────────────────────────────────────────────────────

function PackageModal({
  pkg,
  onClose,
  locale,
  labels,
}: {
  pkg: ServicesPackage;
  locale: string;
  onClose: () => void;
  labels: {
    modalFreeTrial: string;
    modalActivate: string;
    modalTrialSection: string;
    modalTrialFree: string;
    modalTrialDays: string;
    modalFullSection: string;
    modalFullWarranty: string;
    modalFeatures: string;
    formLPReward: string;
    formLPRewardMsg: string;
    pkgTrial: string;
    pkgBuyNow: string;
    formBack: string;
    formConfirmTrial: string;
    formConfirmBuy: string;
    formSuccessTrial: string;
    formSuccessTrialMsg: string;
    formSuccessBuy: string;
    formSuccessBuyMsg: string;
    formDone: string;
    formBookConsult: string;
    formName: string;
    formNamePlaceholder: string;
    formPhone: string;
    formPhonePlaceholder: string;
    formEmail: string;
    formEmailPlaceholder: string;
    formBusiness: string;
    formBusinessPlaceholder: string;
    formDomain: string;
    formDomainPlaceholder: string;
    faqQ1: string;
    faqA1: string;
    faqQ2: string;
    faqA2: string;
    faqQ3: string;
    faqA3: string;
    faqQ4: string;
    faqA4: string;
  };
}) {
  const [step, setStep] = useState<"detail" | "trial" | "buy" | "success">("detail");
  const [flowType, setFlowType] = useState<"trial" | "buy">("trial");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleTrial = () => { setFlowType("trial"); setStep("trial"); };
  const handleBuy = () => { setFlowType("buy"); setStep("buy"); };
  const handleConfirm = () => setStep("success");

  const faqs = [
    { q: labels.faqQ1, a: labels.faqA1.replace("{days}", String(pkg.trialDays)) },
    { q: labels.faqQ2, a: labels.faqA2 },
    { q: labels.faqQ3, a: labels.faqA3 },
    { q: labels.faqQ4, a: labels.faqA4 },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(2,6,23,0.92)", backdropFilter: "blur(16px)",
        }}
      />
      <motion.div
        initial={{ scale: 0.93, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 680,
          borderRadius: "1.5rem",
          background: DS.bgCard,
          border: `1px solid ${hexRgba(pkg.color, 0.21)}`,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 0 80px ${hexRgba(pkg.color, 0.13)}`,
          overflow: "hidden",
        }}
      >
        {/* Hero image */}
        <div
          style={{
            position: "relative",
            height: 180,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {pkg.previewImg ? (
            <img
              src={pkg.previewImg}
              alt={pkg.industry}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(${pkg.gradFrom}, ${pkg.gradTo})` }} />
          )}
          <div
            style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(to bottom, ${hexRgba(pkg.gradFrom, 0.19)}, rgba(15,23,42,0.95))`,
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(0,0,0,0.5)", border: "none",
              borderRadius: 8, padding: "6px 8px",
              cursor: "pointer", color: "#fff",
            }}
          >
            <X size={16} />
          </button>
          {pkg.badge && (
            <div
              style={{
                position: "absolute", top: 12, left: 12,
                background: `${pkg.badgeColor}20`,
                border: `1px solid ${pkg.badgeColor}50`,
                backdropFilter: "blur(8px)",
                borderRadius: "9999px",
                padding: "3px 10px",
              }}
            >
              <span
                style={{
                  color: pkg.badgeColor, fontSize: 9,
                  fontFamily: DS.mono, fontWeight: 700,
                }}
              >
                {pkg.badge}
              </span>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>{pkg.icon}</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{pkg.industry}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{pkg.tagline}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          <AnimatePresence mode="wait">
            {step === "detail" && (
              <motion.div
                key="detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
              >
                {/* Trial badge */}
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem", borderRadius: "1rem",
                    background: `${pkg.color}06`, border: `1px solid ${hexRgba(pkg.color, 0.19)}`,
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${pkg.color}13`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CalendarClock size={20} style={{ color: pkg.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: pkg.color, fontSize: 13, fontWeight: 700 }}>
                      {labels.modalFreeTrial.replace("{days}", String(pkg.trialDays))}
                    </div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>
                      {labels.modalActivate.replace("{time}", pkg.activateTime)}
                    </div>
                  </div>
                  <div
                    style={{
                      color: DS.green, fontSize: 11,
                      fontFamily: DS.mono, fontWeight: 700,
                      background: "rgba(34,197,94,0.12)",
                      padding: "4px 10px", borderRadius: 8,
                    }}
                  >
                    FREE
                  </div>
                </div>

                {/* Pricing */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div
                    style={{
                      padding: "1rem", borderRadius: "1rem", textAlign: "center",
                      background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>
                      {labels.modalTrialSection}
                    </div>
                    <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 900 }}>
                      {labels.modalTrialFree}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>
                      {labels.modalTrialDays.replace("{days}", String(pkg.trialDays)).replace("{time}", pkg.activateTime)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "1rem", borderRadius: "1rem", textAlign: "center",
                      background: `${pkg.color}05`, border: `1px solid ${hexRgba(pkg.color, 0.19)}`,
                    }}
                  >
                    <div style={{ color: pkg.color, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>
                      {labels.modalFullSection}
                    </div>
                    <div style={{ color: pkg.color, fontSize: "1.25rem", fontWeight: 900 }}>
                      {new Intl.NumberFormat("vi-VN").format(pkg.fullPrice)}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>
                      {labels.modalFullWarranty}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div
                    style={{
                      color: DS.text4, fontSize: 10, fontFamily: DS.mono,
                      letterSpacing: "0.12em", marginBottom: "0.625rem",
                    }}
                  >
                    {labels.modalFeatures} ({pkg.features.length})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                    {pkg.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem" }}>
                        <CheckCircle2 size={11} style={{ color: pkg.color, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ color: DS.text3, fontSize: 12 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                <div>
                  <div
                    style={{
                      color: DS.text4, fontSize: 10, fontFamily: DS.mono,
                      letterSpacing: "0.12em", marginBottom: "0.625rem",
                    }}
                  >
                    FAQ
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {faqs.map((faq, i) => (
                      <div
                        key={i}
                        style={{ borderRadius: "0.75rem", overflow: "hidden", border: `1px solid ${DS.border}` }}
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0.75rem 1rem",
                            background: DS.bgCard2, border: "none", cursor: "pointer",
                            color: DS.text3, fontSize: 13, textAlign: "left",
                          }}
                        >
                          <span>{faq.q}</span>
                          {openFaq === i ? (
                            <ChevronUp size={14} style={{ color: DS.text5, flexShrink: 0 }} />
                          ) : (
                            <ChevronDown size={14} style={{ color: DS.text5, flexShrink: 0 }} />
                          )}
                        </button>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <div
                                style={{
                                  padding: "0.75rem 1rem",
                                  background: DS.bgCard,
                                  borderTop: `1px solid ${DS.border}`,
                                }}
                              >
                                <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>{faq.a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LP note */}
                <div
                  style={{
                    padding: "0.75rem", borderRadius: "0.75rem",
                    background: "rgba(129,140,248,0.06)",
                    border: "1px solid rgba(129,140,248,0.2)",
                  }}
                >
                  <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono }}>
                    {labels.formLPReward}:{" "}
                  </span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>
                    {labels.formLPRewardMsg.replace("{lp}", pkg.lp.toLocaleString())}
                  </span>
                </div>
              </motion.div>
            )}

            {(step === "trial" || step === "buy") && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {step === "trial"
                    ? labels.pkgTrial.replace("{days}", String(pkg.trialDays))
                    : `Mua ngay · ${new Intl.NumberFormat("vi-VN").format(pkg.fullPrice)} VNĐ`}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { label: labels.formName, placeholder: labels.formNamePlaceholder },
                    { label: labels.formPhone, placeholder: labels.formPhonePlaceholder },
                    { label: labels.formEmail, placeholder: labels.formEmailPlaceholder },
                    {
                      label: labels.formBusiness,
                      placeholder: labels.formBusinessPlaceholder.replace("{name}", pkg.industry.replace("Web ", "")),
                    },
                    ...(step === "buy"
                      ? [{ label: labels.formDomain, placeholder: labels.formDomainPlaceholder }]
                      : []),
                  ].map((f) => (
                    <div key={f.label}>
                      <label
                        style={{
                          color: DS.text5, fontSize: 10, fontFamily: DS.mono,
                          display: "block", marginBottom: 5,
                        }}
                      >
                        {f.label.toUpperCase()}
                      </label>
                      <input
                        placeholder={f.placeholder}
                        style={{
                          width: "100%",
                          background: DS.bgCard2,
                          border: `1px solid ${DS.border}`,
                          borderRadius: 10,
                          padding: "10px 14px",
                          color: DS.text,
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                  <button
                    onClick={() => setStep("detail")}
                    style={{
                      padding: "12px 16px",
                      background: DS.bgCard2,
                      border: `1px solid ${DS.border}`,
                      borderRadius: 12,
                      color: DS.text3,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    ← {labels.formBack}
                  </button>
                  <button
                    onClick={handleConfirm}
                    style={{
                      flex: 1,
                      background:
                        step === "trial"
                          ? "linear-gradient(135deg, #22C55E, #14B8A6)"
                          : GRD.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    ✓ {step === "trial" ? labels.formConfirmTrial : labels.formConfirmBuy}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "2rem 1rem" }}
              >
                <motion.div
                  style={{ fontSize: "3.5rem", marginBottom: "1rem" }}
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  {flowType === "trial" ? "🎉" : "🚀"}
                </motion.div>
                <div style={{ color: DS.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                  {flowType === "trial" ? labels.formSuccessTrial : labels.formSuccessBuy}
                </div>
                <p
                  style={{
                    color: DS.text3, fontSize: 13, lineHeight: 1.8,
                    maxWidth: 380, margin: "0 auto 1.5rem",
                  }}
                >
                  {flowType === "trial"
                    ? labels.formSuccessTrialMsg.replace("{time}", pkg.activateTime)
                    : labels.formSuccessBuyMsg}
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={onClose}
                    style={{
                      background: GRD.primary, color: "#fff",
                      border: "none", borderRadius: 12,
                      padding: "12px 28px", cursor: "pointer",
                      fontSize: 14, fontWeight: 700,
                    }}
                  >
                    {labels.formDone}
                  </button>
                  <Link
                    href={`/${locale}/contact`}
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "12px 20px", borderRadius: 12,
                      background: DS.bgCard2, border: `1px solid ${DS.border}`,
                      color: DS.text3, fontSize: 13, textDecoration: "none",
                    }}
                  >
                    <Phone size={13} /> {labels.formBookConsult}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky footer CTAs */}
        {step === "detail" && (
          <div
            style={{
              display: "flex", gap: "0.75rem", padding: "1.25rem",
              borderTop: `1px solid ${DS.border}`,
              background: DS.bgCard,
              flexShrink: 0,
            }}
          >
            <button
              onClick={handleTrial}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.15))",
                border: "1px solid rgba(34,197,94,0.35)",
                borderRadius: 12, padding: "13px", cursor: "pointer",
                color: DS.green, fontSize: 14, fontWeight: 700,
              }}
            >
              <Play size={14} />
              {labels.pkgTrial.replace("{days}", String(pkg.trialDays))}
            </button>
            <button
              onClick={handleBuy}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                background: GRD.primary, border: "none",
                borderRadius: 12, padding: "13px", cursor: "pointer",
                color: "#fff", fontSize: 14, fontWeight: 700,
                boxShadow: `0 0 24px ${hexRgba(pkg.color, 0.19)}`,
              }}
            >
              <ShoppingCart size={14} />
              {labels.pkgBuyNow}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Package Card (Grid) ────────────────────────────────────────────────────────

function PackageCardGrid({
  pkg,
  onClick,
  labels,
}: {
  pkg: ServicesPackage;
  onClick: () => void;
  labels: {
    pkgTrialBadge: string;
    pkgActivate: string;
    pkgFull: string;
    pkgViewDetails: string;
  };
}) {
  return (
    <motion.div
      onClick={onClick}
      style={{
        borderRadius: "1rem", overflow: "hidden",
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        cursor: "pointer",
        boxShadow: "0 0 0px rgba(0,0,0,0)",
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{
        borderColor: hexRgba(pkg.color, 0.31),
        boxShadow: `0 12px 48px ${hexRgba(pkg.color, 0.09)}`,
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      {/* Preview image */}
      <div style={{ position: "relative", height: 140, overflow: "hidden" }}>
        {pkg.previewImg ? (
          <img
            src={pkg.previewImg}
            alt={pkg.industry}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(${pkg.gradFrom}, ${pkg.gradTo})` }} />
        )}
        <div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to bottom, ${hexRgba(pkg.gradFrom, 0.13)}, rgba(15,23,42,0.92))`,
          }}
        />

        {/* Badges */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {pkg.badge && (
            <span
              style={{
                color: pkg.badgeColor, fontSize: 8, fontFamily: DS.mono,
                fontWeight: 700, background: `${pkg.badgeColor}20`,
                border: `1px solid ${pkg.badgeColor}40`,
                padding: "2px 7px", borderRadius: 8,
                backdropFilter: "blur(6px)",
              }}
            >
              {pkg.badge}
            </span>
          )}
        </div>
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span
            style={{
              color: DS.green, fontSize: 9, fontFamily: DS.mono, fontWeight: 700,
              background: "rgba(34,197,94,0.18)",
              border: "1px solid rgba(34,197,94,0.4)",
              padding: "2px 7px", borderRadius: 8,
              backdropFilter: "blur(6px)",
            }}
          >
            {labels.pkgTrialBadge.replace("{days}", String(pkg.trialDays)).toUpperCase()}
          </span>
        </div>

        {/* Icon */}
        <div style={{ position: "absolute", bottom: 12, left: 16 }}>
          <span style={{ fontSize: 28, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
            {pkg.icon}
          </span>
        </div>
      </div>

      <div style={{ padding: "1rem" }}>
        <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: "0.1875rem" }}>
          {pkg.industry}
        </div>
        <div style={{ color: DS.text5, fontSize: 11, marginBottom: "0.75rem" }}>
          {pkg.tagline}
        </div>

        {/* Demo features pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
          {(pkg.features ?? []).slice(0, 3).map((f) => (
            <span
              key={f}
              style={{
                color: pkg.color, fontSize: 9, fontFamily: DS.mono,
                background: `${pkg.color}10`,
                border: `1px solid ${pkg.color}25`,
                padding: "2px 7px", borderRadius: 5,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Price row */}
        <div
          style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            paddingTop: "0.75rem", borderTop: `1px solid ${DS.border}`,
          }}
        >
          <div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginBottom: "0.0625rem" }}>
              {labels.pkgFull}
            </div>
            <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>
              {new Intl.NumberFormat("vi-VN").format(pkg.fullPrice)}
              <span style={{ fontSize: 10, fontFamily: DS.mono }}> VNĐ</span>
            </div>
          </div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 0.75rem", borderRadius: "0.75rem",
              background: `${pkg.color}12`, border: `1px solid ${hexRgba(pkg.color, 0.19)}`,
            }}
          >
            <Eye size={12} style={{ color: pkg.color }} />
            <span style={{ color: pkg.color, fontSize: 11, fontWeight: 700 }}>
              {labels.pkgViewDetails}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Package Card (List) ────────────────────────────────────────────────────────

function PackageCardList({
  pkg,
  onClick,
  labels,
}: {
  pkg: ServicesPackage;
  onClick: () => void;
  labels: {
    pkgTrialBadge: string;
    pkgActivate: string;
    pkgPrice: string;
  };
}) {
  return (
    <motion.div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "1.25rem", padding: "1rem",
        borderRadius: "1rem", cursor: "pointer",
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
      }}
      whileHover={{
        borderColor: hexRgba(pkg.color, 0.27),
        x: 4,
        boxShadow: `0 4px 24px ${hexRgba(pkg.color, 0.07)}`,
        transition: { duration: 0.2 },
      }}
    >
      <div
        style={{
          position: "relative", width: 72, height: 56,
          borderRadius: 12, overflow: "hidden", flexShrink: 0,
        }}
      >
        {pkg.previewImg ? (
          <img src={pkg.previewImg} alt={pkg.industry} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(${pkg.gradFrom}, ${pkg.gradTo})` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: `${pkg.gradFrom}30` }} />
        <span
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 22,
          }}
        >
          {pkg.icon}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
          <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{pkg.industry}</span>
          {pkg.badge && (
            <span
              style={{
                color: pkg.badgeColor, fontSize: 8, fontFamily: DS.mono,
                background: `${pkg.badgeColor}18`, padding: "1px 6px", borderRadius: 6,
              }}
            >
              {pkg.badge}
            </span>
          )}
        </div>
        <div style={{ color: DS.text5, fontSize: 11, marginBottom: "0.25rem" }}>{pkg.tagline}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              color: DS.green, fontSize: 10, fontFamily: DS.mono,
              background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: 5,
            }}
          >
            {labels.pkgTrialBadge.replace("{days}", String(pkg.trialDays))}
          </span>
          <span style={{ color: DS.text5, fontSize: 10 }}>
            {labels.pkgActivate.replace("{time}", pkg.activateTime)}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>
          {new Intl.NumberFormat("vi-VN").format(pkg.fullPrice)}
        </div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{labels.pkgPrice}</div>
      </div>
      <ChevronRight size={16} style={{ color: DS.text5, flexShrink: 0 }} />
    </motion.div>
  );
}

// ── Custom Service Card ───────────────────────────────────────────────────────

const CUSTOM_SERVICES: CustomService[] = [
  {
    id: "web",
    icon: <Globe size={28} />,
    title: "Thiết kế & Phát triển Website",
    desc: "Từ landing page đến e-commerce platform cao cấp. Thiết kế riêng theo thương hiệu, đảm bảo performance và UX tốt nhất.",
    features: [
      "Thiết kế UI/UX độc đảo theo brand",
      "Responsive 100% thiết bị",
      "Core Web Vitals ≥ 90",
      "SEO on-page tích hợp",
      "CMS tùy chọn",
      "E-commerce & Payment gateway",
    ],
    priceFrom: 15_000_000,
    color: DS.blue,
    image: "https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=600&q=80",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "app",
    icon: <Code2 size={28} />,
    title: "Phát triển App & SaaS Platform",
    desc: "Mobile app, web app và nền tảng SaaS enterprise. Từ MVP đến sản phẩm với hàng triệu người dùng.",
    features: [
      "Phân tích & thiết kế kiến trúc system",
      "React Native / Flutter Mobile",
      "Backend Node.js / Rust",
      "Database design & optimization",
      "API RESTful & GraphQL",
      "Microservices & Docker",
    ],
    priceFrom: 80_000_000,
    color: DS.purple,
    image: "https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=600&q=80",
    tags: ["React Native", "Node.js", "TypeScript", "AWS"],
  },
  {
    id: "dashboard",
    icon: <BarChart3 size={28} />,
    title: "Dashboard & Data Analytics",
    desc: "Biến dữ liệu thành insight hành động được. Dashboard real-time, báo cáo tự động và data visualization.",
    features: [
      "Dashboard real-time multi-source",
      "Data visualization D3.js",
      "Báo cáo tự động PDF/Excel",
      "Data pipeline ETL",
      "Alert & notification system",
      "BigQuery/Snowflake integration",
    ],
    priceFrom: 25_000_000,
    color: DS.cyan,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    tags: ["React", "D3.js", "Python", "BigQuery"],
  },
  {
    id: "seo",
    icon: <TrendingUp size={28} />,
    title: "SEO & Digital Marketing",
    desc: "Tăng trưởng organic bền vững, data-driven. Chiến lược SEO kỹ thuật + content marketing toàn diện.",
    features: [
      "Technical SEO audit & fix",
      "Keyword research & strategy",
      "On-page optimization",
      "Content strategy & production",
      "Link building (white hat)",
      "Google Ads management",
    ],
    priceFrom: 8_000_000,
    color: DS.green,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    tags: ["SEMrush", "Ahrefs", "Google Analytics 4"],
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────

type ServicesUI = {
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  ctaPrimary: string;
  ctaSecondary: string;
  filterAll: string;
  processLabel: string;
  processTitle: string;
  processStep1Title: string;
  processStep1Desc: string;
  processStep2Title: string;
  processStep2Desc: string;
  processStep3Title: string;
  processStep3Desc: string;
  processStep4Title: string;
  processStep4Desc: string;
  ctaReady: string;
  ctaReadyDesc: string;
  ctaReadyBtn: string;
  webPackagesLabel: string;
  customServicesLabel: string;
  customServicesDesc: string;
  pkgPrice: string;
  pkgOrTrial: string;
  pkgFeatures: string;
  pkgMoreFeatures: string;
  pkgCollapse: string;
  pkgLpReward: string;
  pkgTrialCta: string;
  emptyState: string;
  anUong: string;
  sucKhoe: string;
  luuTru: string;
  batDongSan: string;
  khac: string;
  lienHe: string;
  // Additional labels for modal + tabs
  tabWebPackage: string;
  tabCustom: string;
  tabPricing: string;
  catAll: string;
  catFood: string;
  catHealth: string;
  catLodging: string;
  catRetail: string;
  catEducation: string;
  catRealEstate: string;
  sortPopular: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  pkgTrialBadge: string;
  pkgActivate: string;
  pkgFull: string;
  pkgViewDetails: string;
  pkgBuyNow: string;
  ctaNotFound: string;
  ctaCustomDesign: string;
  ctaCustomDesc: string;
  ctaFreeConsult: string;
  ctaViewCustom: string;
  customPriceFrom: string;
  customConsult: string;
  pricingHeader: string;
  pricingSubheader: string;
  planStarter: string;
  planStarterSub: string;
  planStarterFeatures: string;
  planStartNow: string;
  planBusiness: string;
  planBusinessSub: string;
  planBusinessFeatures: string;
  planChooseBusiness: string;
  planEnterprise: string;
  planEnterpriseSub: string;
  planEnterpriseFeatures: string;
  planContactConsult: string;
  planPopular: string;
  planVND: string;
  planLPReward: string;
  webSectionLabel: string;
  webTableTrial: string;
  webTableTrialDays: string;
  webTableSee: string;
  lpProgram: string;
  lpPerMillion: string;
  lpReferral: string;
  lpMaxDiscount: string;
  // Modal
  modalFreeTrial: string;
  modalActivate: string;
  modalTrialSection: string;
  modalTrialFree: string;
  modalTrialDays: string;
  modalFullSection: string;
  modalFullWarranty: string;
  modalFeatures: string;
  formLPReward: string;
  formLPRewardMsg: string;
  pkgTrial: string;
  formBack: string;
  formConfirmTrial: string;
  formConfirmBuy: string;
  formSuccessTrial: string;
  formSuccessTrialMsg: string;
  formSuccessBuy: string;
  formSuccessBuyMsg: string;
  formDone: string;
  formBookConsult: string;
  formName: string;
  formNamePlaceholder: string;
  formPhone: string;
  formPhonePlaceholder: string;
  formEmail: string;
  formEmailPlaceholder: string;
  formBusiness: string;
  formBusinessPlaceholder: string;
  formDomain: string;
  formDomainPlaceholder: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
  faqQ4: string;
  faqA4: string;
};

export function ServicesClient({
  locale,
  _customServices,
  webPackages,
  ui,
  defaultTab = "tabWebPackage",
}: {
  locale: string;
  _customServices: Record<string, unknown>[];
  webPackages: ServicesPackage[];
  ui: ServicesUI;
  /** Tab khởi tạo — từ query param (?tab=custom|web-pricing|pricing) */
  defaultTab?: TabKey;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const searchParams = useSearchParams();

  // Sync tab khi URL ?tab= thay đổi (e.g. user navigate từ dropdown nav)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabKey | null;
    if (tabParam && ["tabWebPackage", "tabCustom", "tabPricing"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [category, setCategory] = useState<Category | "all">("all");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [selectedPkg, setSelectedPkg] = useState<ServicesPackage | null>(null);

  const catLabels: Record<string, string> = {
    "an-uong": ui.catFood,
    "suc-khoe": ui.catHealth,
    "luu-tru": ui.catLodging,
    "bat-dong-san": ui.catRealEstate,
    khac: ui.khac,
  };

  const allCats = ["all", "an-uong", "suc-khoe", "luu-tru", "bat-dong-san", "khac"] as const;

  const filtered = webPackages
    .filter((p) => category === "all" || p.category === category)
    .sort((a, b) => {
      if (sortBy === "popular") return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      if (sortBy === "price-asc") return a.fullPrice - b.fullPrice;
      return b.fullPrice - a.fullPrice;
    });

  const pkgLabels = {
    pkgTrialBadge: ui.pkgTrialBadge,
    pkgActivate: ui.pkgActivate,
    pkgFull: ui.pkgFull,
    pkgPrice: ui.pkgPrice,
    pkgViewDetails: ui.pkgViewDetails,
    pkgTrial: ui.pkgTrial,
    pkgBuyNow: ui.pkgBuyNow,
    modalFreeTrial: ui.modalFreeTrial,
    modalActivate: ui.modalActivate,
    modalTrialSection: ui.modalTrialSection,
    modalTrialFree: ui.modalTrialFree,
    modalTrialDays: ui.modalTrialDays,
    modalFullSection: ui.modalFullSection,
    modalFullWarranty: ui.modalFullWarranty,
    modalFeatures: ui.modalFeatures,
    formLPReward: ui.formLPReward,
    formLPRewardMsg: ui.formLPRewardMsg,
    formBack: ui.formBack,
    formConfirmTrial: ui.formConfirmTrial,
    formConfirmBuy: ui.formConfirmBuy,
    formSuccessTrial: ui.formSuccessTrial,
    formSuccessTrialMsg: ui.formSuccessTrialMsg,
    formSuccessBuy: ui.formSuccessBuy,
    formSuccessBuyMsg: ui.formSuccessBuyMsg,
    formDone: ui.formDone,
    formBookConsult: ui.formBookConsult,
    formName: ui.formName,
    formNamePlaceholder: ui.formNamePlaceholder,
    formPhone: ui.formPhone,
    formPhonePlaceholder: ui.formPhonePlaceholder,
    formEmail: ui.formEmail,
    formEmailPlaceholder: ui.formEmailPlaceholder,
    formBusiness: ui.formBusiness,
    formBusinessPlaceholder: ui.formBusinessPlaceholder,
    formDomain: ui.formDomain,
    formDomainPlaceholder: ui.formDomainPlaceholder,
    faqQ1: ui.faqQ1,
    faqA1: ui.faqA1,
    faqQ2: ui.faqQ2,
    faqA2: ui.faqA2,
    faqQ3: ui.faqQ3,
    faqA3: ui.faqA3,
    faqQ4: ui.faqQ4,
    faqA4: ui.faqA4,
  };

  return (
    <main style={{ background: DS.bg, minHeight: "100vh", paddingTop: 0 }}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "4rem 1.5rem",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(29,78,216,0.1) 0%, rgba(129,140,248,0.04) 60%, transparent 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid bg */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1024, margin: "0 auto", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.25)",
              marginBottom: "1.25rem",
            }}
          >
            <Sparkles size={11} style={{ color: DS.blue }} />
            <span
              style={{
                color: DS.blue, fontSize: 10, fontFamily: DS.mono,
                letterSpacing: "0.22em",
              }}
            >
              {ui.heroBadge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontFamily: DS.heading,
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 900, letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #3B82F6, #818CF8, #14B8A6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1rem",
            }}
          >
            {ui.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              color: DS.text3, fontSize: 16, lineHeight: 1.8,
              maxWidth: 560, margin: "0 auto 2.5rem",
            }}
          >
            {ui.heroDesc}
          </motion.p>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", marginBottom: 0 }}
          >
            {[
              { val: `${webPackages.length}`, label: ui.catAll, color: DS.blue, icon: "🌐" },
              { val: "FREE", label: ui.pkgTrialBadge.replace("{days}", "").trim(), color: DS.green, icon: "🎯" },
              { val: "2h", label: ui.pkgActivate.replace("{time}", "").trim(), color: DS.amber, icon: "⚡" },
              { val: "100%", label: ui.pkgFull, color: DS.purple, icon: "✅" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  background: `${s.color}10`,
                  border: `1px solid ${hexRgba(s.color, 0.15)}`,
                }}
              >
                <span>{s.icon}</span>
                <span style={{ color: s.color, fontFamily: DS.mono, fontSize: 13, fontWeight: 800 }}>
                  {s.val}
                </span>
                <span style={{ color: DS.text5, fontSize: 11 }}>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TAB NAV ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky", top: 64, zIndex: 30,
          padding: "0.75rem 1.5rem",
          background: "rgba(2,6,23,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {(
            [
              { key: "tabWebPackage", icon: <ZapAlt size={12} style={{ display: "inline", marginRight: 4 }} /> },
              { key: "tabCustom", icon: null },
              { key: "tabPricing", icon: null },
            ] as const
          ).map(({ key, icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "7px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: `1px solid ${active ? hexRgba(DS.blue, 0.31) : DS.border}`,
                  background: active ? "rgba(59,130,246,0.12)" : "none",
                  color: active ? DS.blue : DS.text4,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {icon}
                {ui[key as TabKey]}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── TAB: GÓI WEB DOANH NGHIỆP ──────────────────────────────── */}
        {activeTab === "tabWebPackage" && (
          <motion.section
            key="goi-web"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "2.5rem 1.5rem" }}
          >
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              {/* Toolbar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                {/* Category filter */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {allCats.map((cat) => {
                    const active = cat === category;
                    const count =
                      cat === "all"
                        ? webPackages.length
                        : webPackages.filter((p) => p.category === cat).length;
                    return (
                      <motion.button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                          padding: "6px 16px", borderRadius: 20, fontSize: 12,
                          fontFamily: DS.mono, cursor: "pointer",
                          border: `1px solid ${active ? DS.blue : DS.border}`,
                          background: active ? "rgba(59,130,246,0.12)" : "none",
                          color: active ? DS.blue : DS.text5,
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {cat === "all"
                          ? `${ui.catAll} (${count})`
                          : `${CAT_ICONS[cat] ?? "📦"} ${catLabels[cat] ?? cat} (${count})`}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Sort + layout */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    style={{
                      background: DS.bgCard, border: `1px solid ${DS.border}`,
                      borderRadius: 8, padding: "6px 12px",
                      color: DS.text4, fontSize: 12, fontFamily: DS.mono,
                      outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="popular">{ui.sortPopular}</option>
                    <option value="price-asc">{ui.sortPriceAsc}</option>
                    <option value="price-desc">{ui.sortPriceDesc}</option>
                  </select>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "0.25rem" }}>
                    <button
                      onClick={() => setLayout("grid")}
                      style={{
                        padding: "7px 10px", borderRadius: 8,
                        background: layout === "grid" ? "rgba(59,130,246,0.12)" : "none",
                        border: `1px solid ${layout === "grid" ? hexRgba(DS.blue, 0.25) : DS.border}`,
                        color: layout === "grid" ? DS.blue : DS.text5, cursor: "pointer",
                      }}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setLayout("list")}
                      style={{
                        padding: "7px 10px", borderRadius: 8,
                        background: layout === "list" ? "rgba(59,130,246,0.12)" : "none",
                        border: `1px solid ${layout === "list" ? hexRgba(DS.blue, 0.25) : DS.border}`,
                        color: layout === "list" ? DS.blue : DS.text5, cursor: "pointer",
                      }}
                    >
                      <List size={14} />
                    </button>
                  </div>
                  <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
                    {filtered.length} gói
                  </span>
                </div>
              </div>

              {/* Package grid/list */}
              {layout === "grid" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {filtered.map((pkg, i) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <PackageCardGrid
                        pkg={pkg}
                        onClick={() => setSelectedPkg(pkg)}
                        labels={pkgLabels}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {filtered.map((pkg, i) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <PackageCardList
                        pkg={pkg}
                        onClick={() => setSelectedPkg(pkg)}
                        labels={pkgLabels}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Bottom CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{
                  marginTop: "3rem", borderRadius: "1.5rem", padding: "2rem",
                  textAlign: "center",
                  background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(129,140,248,0.08))",
                  border: "1px solid rgba(129,140,248,0.25)",
                }}
              >
                <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: "0.625rem" }}>
                  {ui.ctaNotFound}
                </div>
                <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, marginBottom: "0.625rem" }}>
                  {ui.ctaCustomDesign}
                </h3>
                <p style={{ color: DS.text3, fontSize: 14, marginBottom: "1.25rem" }}>
                  {ui.ctaCustomDesc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" }}>
                  <Link
                    href={`/${locale}/contact`}
                    style={{
                      background: GRD.primary, color: "#fff",
                      padding: "12px 24px", borderRadius: 12,
                      textDecoration: "none", fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <Phone size={14} /> {ui.ctaFreeConsult}
                  </Link>
                  <button
                    onClick={() => setActiveTab("tabCustom")}
                    style={{
                      padding: "12px 24px", borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${DS.border}`,
                      color: DS.text3, fontSize: 14, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    {ui.ctaViewCustom} <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ── TAB: DỊCH VỤ TÙY CHỈNH ─────────────────────────────── */}
        {activeTab === "tabCustom" && (
          <motion.section
            key="custom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "2.5rem 1.5rem" }}
          >
            <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {CUSTOM_SERVICES.map((svc, i) => (
                <motion.div
                  key={svc.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: i % 2 === 1 ? "1fr 1fr" : "1fr 1fr",
                    background: DS.bgCard, border: `1px solid ${DS.border}`,
                    borderRadius: "1.5rem", overflow: "hidden",
                    minHeight: 300,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  {/* Image */}
                  <div
                    style={{
                      height: 300, overflow: "hidden",
                      order: i % 2 === 1 ? 1 : 0,
                    }}
                  >
                    <img
                      src={svc.image}
                      alt={svc.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      padding: "2rem",
                      display: "flex", flexDirection: "column",
                      order: i % 2 === 1 ? 0 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `${svc.color}15`,
                        border: `1px solid ${hexRgba(svc.color, 0.19)}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <span style={{ color: svc.color }}>{svc.icon}</span>
                    </div>

                    <h2
                      style={{
                        color: DS.text, fontFamily: DS.heading,
                        fontSize: 20, fontWeight: 900, letterSpacing: "0.04em",
                        marginBottom: "0.625rem",
                      }}
                    >
                      {svc.title}
                    </h2>
                    <p
                      style={{
                        color: DS.text3, fontSize: 13, lineHeight: 1.8,
                        marginBottom: "1rem",
                      }}
                    >
                      {svc.desc}
                    </p>

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1.25rem" }}>
                      {svc.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            color: svc.color, fontSize: 10, fontFamily: DS.mono,
                            padding: "2px 8px", borderRadius: 4,
                            background: `${svc.color}12`,
                            border: `1px solid ${hexRgba(svc.color, 0.15)}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Features */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                      {svc.features.map((feat) => (
                        <div key={feat} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <CheckCircle2 size={11} style={{ color: svc.color, flexShrink: 0 }} />
                          <span style={{ color: DS.text3, fontSize: 11 }}>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                          {ui.customPriceFrom}
                        </div>
                        <div style={{ color: svc.color, fontSize: 16, fontWeight: 800 }}>
                          {fmtVND(svc.priceFrom)}
                        </div>
                      </div>
                      <Link
                        href={`/${locale}/booking?service=${svc.id}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          background: GRD.primary, color: "#fff",
                          padding: "10px 18px", borderRadius: 10,
                          textDecoration: "none", fontSize: 13, fontWeight: 700,
                        }}
                      >
                        {ui.customConsult} <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── TAB: BẢNG GIÁ ──────────────────────────────────────────── */}
        {activeTab === "tabPricing" && (
          <motion.section
            key="pricing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "2.5rem 1.5rem" }}
          >
            <div style={{ maxWidth: 1024, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <h2
                  style={{
                    fontFamily: DS.heading, fontSize: 28, fontWeight: 900,
                    color: DS.text, marginBottom: "0.5rem",
                  }}
                >
                  {ui.pricingHeader}
                </h2>
                <p style={{ color: DS.text3, fontSize: 14 }}>{ui.pricingSubheader}</p>
              </div>

              {/* Web Package pricing table */}
              <div
                style={{
                  borderRadius: "1.5rem", overflow: "hidden",
                  border: `1px solid ${DS.border}`, marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    background: DS.bgCard2,
                    borderBottom: `1px solid ${DS.border}`,
                  }}
                >
                  <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>
                    ─ {ui.webSectionLabel}
                  </span>
                </div>
                <div style={{ background: DS.bgCard }}>
                  {webPackages.map((pkg, i) => (
                    <div
                      key={pkg.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "1rem 1.5rem",
                        borderBottom: i < webPackages.length - 1 ? `1px solid ${DS.border}` : "none",
                      }}
                    >
                      <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{pkg.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{pkg.industry}</div>
                        <div style={{ color: DS.text5, fontSize: 11 }}>{pkg.tagline}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "0 1rem", flexShrink: 0 }}>
                        <div style={{ color: DS.green, fontSize: 11, fontWeight: 700, fontFamily: DS.mono }}>
                          {ui.webTableTrial}
                        </div>
                        <div style={{ color: DS.text5, fontSize: 9 }}>
                          {ui.webTableTrialDays.replace("{days}", String(pkg.trialDays))}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ color: pkg.color, fontSize: 14, fontWeight: 800 }}>
                          {new Intl.NumberFormat("vi-VN").format(pkg.fullPrice)}
                        </div>
                        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                          {ui.pkgPrice}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPkg(pkg)}
                        style={{
                          flexShrink: 0, padding: "6px 14px", borderRadius: 8,
                          background: `${pkg.color}12`,
                          border: `1px solid ${hexRgba(pkg.color, 0.19)}`,
                          color: pkg.color, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        {ui.webTableSee}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom services pricing */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {[
                  { name: ui.planStarter, price: "15,000,000", sub: ui.planStarterSub, features: ui.planStarterFeatures, cta: ui.planStartNow, lp: 750, popular: false, color: DS.text4 },
                  { name: ui.planBusiness, price: "45,000,000", sub: ui.planBusinessSub, features: ui.planBusinessFeatures, cta: ui.planChooseBusiness, lp: 2250, popular: true, color: DS.blue },
                  { name: ui.planEnterprise, price: ui.planEnterpriseSub, sub: ui.planEnterpriseSub, features: ui.planEnterpriseFeatures, cta: ui.planContactConsult, lp: 0, popular: false, color: DS.purple },
                ].map((plan) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{
                      borderRadius: "1.5rem", padding: "1.5rem",
                      position: "relative",
                      background: plan.popular
                        ? `linear-gradient(135deg, ${hexRgba(DS.blue, 0.07)}, rgba(129,140,248,0.04))`
                        : DS.bgCard,
                      border: `2px solid ${plan.popular ? hexRgba(DS.blue, 0.31) : DS.border}`,
                    }}
                  >
                    {plan.popular && (
                      <div
                        style={{
                          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                          background: GRD.primary, color: "#fff", fontSize: 9, fontFamily: DS.mono,
                          fontWeight: 700, padding: "3px 14px", borderRadius: 20,
                        }}
                      >
                        {ui.planPopular}
                      </div>
                    )}

                    <div style={{ color: plan.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700, marginBottom: "0.25rem" }}>
                      {plan.name}
                    </div>
                    <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, marginBottom: "0.25rem" }}>
                      {plan.price}
                    </div>
                    <div style={{ color: DS.text4, fontSize: 12, marginBottom: "1rem" }}>{plan.sub}</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {plan.features.split(", ").map((f) => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <CheckCircle2 size={11} style={{ color: plan.color, flexShrink: 0 }} />
                          <span style={{ color: DS.text3, fontSize: 12 }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {plan.lp > 0 && (
                      <div
                        style={{
                          color: DS.purple, fontSize: 10, fontFamily: DS.mono,
                          marginBottom: "0.75rem",
                        }}
                      >
                        {ui.planLPReward.replace("{lp}", plan.lp.toLocaleString())}
                      </div>
                    )}

                    <Link
                      href={`/${locale}/contact`}
                      style={{
                        display: "block", textAlign: "center",
                        background: plan.popular ? GRD.primary : "none",
                        border: plan.popular ? "none" : `1px solid ${DS.border}`,
                        color: plan.popular ? "#fff" : DS.text3,
                        padding: "11px", borderRadius: 12,
                        textDecoration: "none", fontSize: 13, fontWeight: 700,
                      }}
                    >
                      {plan.cta}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* LP info */}
              <div
                style={{
                  marginTop: "2rem", padding: "1.5rem", borderRadius: "1.5rem",
                  textAlign: "center",
                  background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(129,140,248,0.06))",
                  border: "1px solid rgba(129,140,248,0.25)",
                }}
              >
                <div
                  style={{
                    color: DS.purple, fontSize: 10, fontFamily: DS.mono,
                    letterSpacing: "0.2em", marginBottom: "0.5rem",
                  }}
                >
                  {ui.lpProgram}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem" }}>
                  {[
                    { val: "50 LP", label: ui.lpPerMillion, color: DS.blue },
                    { val: "500 LP", label: ui.lpReferral, color: DS.purple },
                    { val: "20%", label: ui.lpMaxDiscount, color: DS.cyan },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>
                        {s.val}
                      </div>
                      <div style={{ color: DS.text4, fontSize: 11 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {selectedPkg && (
          <PackageModal
            pkg={selectedPkg}
            locale={locale}
            onClose={() => setSelectedPkg(null)}
            labels={pkgLabels}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
