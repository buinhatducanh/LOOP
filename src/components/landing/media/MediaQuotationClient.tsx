"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { 
  Camera, Film, Mic2, Layers, Check, ArrowRight, ArrowLeft, 
  Send, Sparkles, Clock, Shield, Zap, Star
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

interface MediaPackage {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  price: number | null;
  priceText: string;
  features: string[];
  tagline: string;
  color: string;
  type: "product" | "content" | "livestream" | "bundle";
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MediaQuotationClient({ locale }: { locale: string }) {
  const t = useTranslations("MediaPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPackage = searchParams.get("package");

  const [step, setStep] = useState(1);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    requirements: "",
    deadline: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Media Packages (Synced with PackagesTab)
  const [packages, setPackages] = useState<MediaPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/pricing/packages?serviceKey=media&type=media");
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setPackages(data.data.map((p: any) => ({
              ...p,
              type: p.type || "product"
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch media packages:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    if (initialPackage) {
      const pkg = packages.find(p => p.slug === initialPackage);
      if (pkg) {
        setSelectedPkgId(pkg.id);
        setStep(2);
      }
    }
  }, [initialPackage]);

  const selectedPkg = packages.find(p => p.id === selectedPkgId);

  const handleNext = () => {
    if (step === 1 && selectedPkgId) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submission = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        companyName: formData.company,
        bookingType: selectedPkg?.type || "custom",
        title: `${formData.name} - ${selectedPkg?.title || "Custom Request"}`,
        requirements: formData.requirements,
        deadline: formData.deadline,
        budget: selectedPkg?.price || null,
        packageId: selectedPkg?.id || null,
      };

      const res = await fetch("/api/media-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit");
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("[MediaQuotation] Submission error:", err);
      alert(err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: string, size = 20) => {
    switch (type) {
      case "product": return <Camera size={size} />;
      case "content": return <Film size={size} />;
      case "livestream": return <Mic2 size={size} />;
      default: return <Layers size={size} />;
    }
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            maxWidth: 500, 
            textAlign: "center", 
            background: DS.bgCard, 
            padding: "3rem", 
            borderRadius: 32,
            border: `1px solid ${DS.border}`,
            boxShadow: GLOW.cardShadow
          }}
        >
          <div style={{ 
            width: 80, height: 80, borderRadius: "50%", background: `${DS.green}15`, 
            color: DS.green, display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px"
          }}>
            <Check size={40} />
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 28, color: DS.text, marginBottom: 16 }}>
            {t("quotation.successTitle")}
          </h2>
          <span suppressHydrationWarning style={{ color: DS.text4, lineHeight: 1.6, marginBottom: 32 }}>
            {t("quotation.successDesc")}
          </span>
          <Link 
            href={`/${locale}/media`}
            style={{ 
              display: "inline-block", padding: "14px 32px", borderRadius: 16, 
              background: GRD.primary, color: "#fff", fontWeight: 700, textDecoration: "none"
            }}
          >
            {t("quotation.btnBackHome")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: DS.bg, padding: "5rem 1.5rem" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: 8, 
              padding: "6px 16px", borderRadius: 99, background: `${DS.pink}15`,
              border: `1px solid ${DS.pink}30`, marginBottom: 16
            }}
          >
            <Sparkles size={12} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, letterSpacing: "0.1em" }}>
              {t("quotation.badge")}
            </span>
          </motion.div>
          <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: DS.text, marginBottom: 16 }}>
            {t("quotation.title")}
          </h1>
          <p style={{ color: DS.text4, maxWidth: 600, margin: "0 auto" }}>
            {t("quotation.subtitle")}
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "4rem" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: "50%", 
                background: step >= s ? GRD.primary : DS.bgCard,
                border: step === s ? `2px solid ${DS.pink}` : `1px solid ${DS.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: step >= s ? "#fff" : DS.text5,
                fontSize: 12, fontWeight: 800, fontFamily: DS.mono,
                boxShadow: step === s ? GLOW.pinkCosmic : "none",
                transition: "all 0.3s"
              }}>
                {step > s ? <Check size={14} /> : s}
              </div>
              <span style={{ 
                fontSize: 11, fontWeight: 700, fontFamily: DS.mono,
                color: step >= s ? DS.text : DS.text5,
                letterSpacing: "0.1em"
              }}>
                {s === 1 ? t("quotation.stepSelect") : s === 2 ? t("quotation.stepDetail") : t("quotation.stepContact")}
              </span>
            </div>
          ))}
        </div>

        {/* Wizard Content */}
        <div style={{ position: "relative" }}>
          <AnimatePresence mode="wait">
            
            {/* Step 1: Select Package */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
                  gap: 20 
                }}
              >
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        background: DS.bgCard,
                        border: `1px solid ${DS.border}`,
                        borderRadius: 24,
                        padding: "24px",
                        height: 200,
                      }}
                    >
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: 40, height: 40, borderRadius: 12, background: DS.border, marginBottom: 16 }}
                      />
                      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ height: 18, width: "60%", background: DS.border, borderRadius: 4, marginBottom: 8 }} />
                      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ height: 12, width: "90%", background: DS.border, borderRadius: 4, marginBottom: 16 }} />
                      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ height: 14, width: "40%", background: DS.border, borderRadius: 4 }} />
                    </div>
                  ))
                ) : packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    style={{
                      background: DS.bgCard,
                      border: `1px solid ${selectedPkgId === pkg.id ? pkg.color : DS.border}`,
                      borderRadius: 24,
                      padding: "24px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: selectedPkgId === pkg.id ? `0 12px 24px -8px ${pkg.color}40` : "none",
                    }}
                  >
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 12, background: `${pkg.color}15`,
                      color: pkg.color, display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 16
                    }}>
                      {getIcon(pkg.type)}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: DS.text, marginBottom: 8 }}>{pkg.title}</h3>
                    <p style={{ fontSize: 12, color: DS.text4, lineHeight: 1.5, marginBottom: 16 }}>{pkg.shortDesc}</p>
                    <div style={{ fontSize: 14, fontWeight: 700, color: DS.text2, fontFamily: DS.mono }}>{pkg.priceText}</div>
                    
                    {selectedPkgId === pkg.id && (
                      <div style={{ position: "absolute", top: 12, right: 12, color: pkg.color }}>
                        <Check size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 2: Requirements */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ background: DS.bgCard, borderRadius: 32, padding: "3rem", border: `1px solid ${DS.border}` }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "2rem" }}>
                  <div style={{ 
                    width: 48, height: 48, borderRadius: 16, background: `${selectedPkg?.color}15`,
                    color: selectedPkg?.color, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {getIcon(selectedPkg?.type || "bundle", 24)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: DS.text }}>{selectedPkg?.title}</h2>
                    <p style={{ fontSize: 13, color: DS.text4 }}>{t("quotation.pkgSubtitle")}</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: DS.text3, marginBottom: 8, fontFamily: DS.mono }}>
                      {t("quotation.fieldRequirements")}
                    </label>
                    <textarea 
                      value={formData.requirements}
                      onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                      placeholder={t("quotation.fieldRequirementsPlaceholder")}
                      style={{ 
                        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                        borderRadius: 12, padding: "12px 16px", color: DS.text, minHeight: 120,
                        outline: "none", transition: "border 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = DS.pink}
                      onBlur={(e) => e.target.style.borderColor = DS.border}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: DS.text3, marginBottom: 8, fontFamily: DS.mono }}>
                      {t("quotation.fieldDeadline")}
                    </label>
                    <input 
                      type="text"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      placeholder={t("quotation.fieldDeadlinePlaceholder")}
                      style={{ 
                        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                        borderRadius: 12, padding: "12px 16px", color: DS.text,
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: 16 }}>
                    <div style={{ background: `${DS.blue}05`, padding: "16px", borderRadius: 16, border: `1px solid ${DS.blue}20` }}>
                      <Clock size={16} style={{ color: DS.blue, marginBottom: 8 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: DS.text2 }}>{t("quotation.featFast")}</div>
                      <p style={{ fontSize: 11, color: DS.text4, margin: 0 }}>{t("quotation.featFastDesc")}</p>
                    </div>
                    <div style={{ background: `${DS.purple}05`, padding: "16px", borderRadius: 16, border: `1px solid ${DS.purple}20` }}>
                      <Shield size={16} style={{ color: DS.purple, marginBottom: 8 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: DS.text2 }}>{t("quotation.featQuality")}</div>
                      <p style={{ fontSize: 11, color: DS.text4, margin: 0 }}>{t("quotation.featQualityDesc")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ background: DS.bgCard, borderRadius: 32, padding: "3rem", border: `1px solid ${DS.border}` }}
              >
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                  <div style={{ 
                    width: 56, height: 56, borderRadius: "50%", background: `${DS.pink}15`,
                    color: DS.pink, display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px"
                  }}>
                    <Send size={24} />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: DS.text }}>{t("quotation.contactTitle")}</h2>
                  <p style={{ fontSize: 13, color: DS.text4 }}>{t("quotation.contactSubtitle")}</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: DS.text3, marginBottom: 8, fontFamily: DS.mono }}>
                      {t("quotation.fieldName")}
                    </label>
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nguyễn Văn A"
                      style={{ 
                        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                        borderRadius: 12, padding: "12px 16px", color: DS.text, outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: DS.text3, marginBottom: 8, fontFamily: DS.mono }}>
                      {t("quotation.fieldEmail")}
                    </label>
                    <input 
                      required type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@company.vn"
                      style={{ 
                        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                        borderRadius: 12, padding: "12px 16px", color: DS.text, outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: DS.text3, marginBottom: 8, fontFamily: DS.mono }}>
                      {t("quotation.fieldPhone")}
                    </label>
                    <input 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="09xx xxx xxx"
                      style={{ 
                        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                        borderRadius: 12, padding: "12px 16px", color: DS.text, outline: "none"
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: DS.text3, marginBottom: 8, fontFamily: DS.mono }}>
                      {t("quotation.fieldCompany")}
                    </label>
                    <input 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="LOOP Solutions"
                      style={{ 
                        width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
                        borderRadius: 12, padding: "12px 16px", color: DS.text, outline: "none"
                      }}
                    />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div style={{ 
            display: "flex", justifyContent: "space-between", alignItems: "center", 
            marginTop: "2.5rem", padding: "0 8px" 
          }}>
            <button
              onClick={handleBack}
              disabled={step === 1}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 12, border: `1px solid ${DS.border}`,
                color: step === 1 ? DS.text5 : DS.text3, fontWeight: 600, cursor: step === 1 ? "default" : "pointer",
                background: "transparent", transition: "all 0.2s"
              }}
            >
              <ArrowLeft size={16} /> {t("quotation.btnBack")}
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && !selectedPkgId}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 32px", borderRadius: 16, border: "none",
                  background: (step === 1 && !selectedPkgId) ? DS.bgCard : GRD.primary,
                  color: (step === 1 && !selectedPkgId) ? DS.text5 : "#fff",
                  fontWeight: 700, cursor: (step === 1 && !selectedPkgId) ? "default" : "pointer",
                  boxShadow: (step === 1 && !selectedPkgId) ? "none" : GLOW.pinkCosmic,
                  transition: "all 0.3s"
                }}
              >
                {t("quotation.btnNext")} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 32px", borderRadius: 16, border: "none",
                  background: isSubmitting ? DS.bgCard : GRD.primary,
                  color: "#fff", fontWeight: 700, cursor: isSubmitting ? "wait" : "pointer",
                  boxShadow: isSubmitting ? "none" : GLOW.pinkCosmic,
                  transition: "all 0.3s"
                }}
              >
                {isSubmitting ? t("quotation.btnSubmitting") : t("quotation.btnSubmit")} <Zap size={16} fill="currentColor" />
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: "5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, opacity: 0.6 }}>
          {[
            { icon: <Zap size={18} />, title: t("quotation.featFast"), desc: t("quotation.featFastDesc") },
            { icon: <Star size={18} />, title: t("quotation.featQuality"), desc: t("quotation.featQualityDesc") },
            { icon: <Shield size={18} />, title: t("quotation.featSecure"), desc: t("quotation.featSecureDesc") },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: DS.pink, marginBottom: 8, display: "flex", justifyContent: "center" }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: DS.text, marginBottom: 4 }}>{item.title.toUpperCase()}</div>
              <p style={{ fontSize: 11, color: DS.text4, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
